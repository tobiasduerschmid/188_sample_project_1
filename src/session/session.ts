import { CatalogSnapshot } from '../catalog/snapshot';
import { assessPlan } from '../assessment/assessment';
import { adoptCatalog, copyPlan, createPlan, editPlan } from '../domain/plan';
import { clonePlain, fingerprint, newId, sameRef } from '../domain/identity';
import {
  fail,
  ok,
  type AdoptionPreview,
  type Assessment,
  type CatalogManifest,
  type CommitRequest,
  type PlanCommand,
  type PlanInputs,
  type PlanListItem,
  type Problem,
  type Result,
  type SaveReceipt,
  type SaveState,
  type StoredPlan,
} from '../domain/types';
import type { CatalogLibrary } from '../catalog/library';
import type { PlanRepository } from '../storage/repository';
import type { ExportInput } from '../export/summary';

type Repository = Pick<
  PlanRepository,
  'list' | 'open' | 'nameAvailable' | 'commit' | 'delete' | 'reconcile'
>;
type Library = Pick<CatalogLibrary, 'discover' | 'load' | 'preview'>;
type Assessor = (
  plan: PlanInputs,
  catalog: CatalogSnapshot,
  generation: number,
) => Promise<Result<Assessment>>;
export interface ViewState {
  manifest: CatalogManifest | null;
  plans: PlanListItem[];
  catalog: CatalogSnapshot | null;
  plan: PlanInputs | null;
  generation: number;
  assessment: Assessment | null;
  assessmentStatus: 'pending' | 'complete' | 'failed';
  saveState: SaveState;
  errors: Problem[];
  notice: string;
  loading: boolean;
  canUndo: boolean;
  focusCourseId: string | null;
  adoption: { preview: AdoptionPreview; catalog: CatalogSnapshot } | null;
  olderCatalog: boolean;
}
interface QueuedSave {
  inputs: PlanInputs;
  generation: number;
  mutationId: string;
  operation: CommitRequest['operation'];
  request?: CommitRequest;
}

/** CAN-002 sequences collaborators; policy stays in the owning domain modules. */
export class PlanSession {
  private state: ViewState = {
    manifest: null,
    plans: [],
    catalog: null,
    plan: null,
    generation: 0,
    assessment: null,
    assessmentStatus: 'pending',
    saveState: 'unsaved',
    errors: [],
    notice: '',
    loading: false,
    canUndo: false,
    focusCourseId: null,
    adoption: null,
    olderCatalog: false,
  };
  private listeners = new Set<() => void>();
  private readonly sessionId = newId();
  private baseRevision: number | null = null;
  private durableName: string | null = null;
  private queue: QueuedSave[] = [];
  private pumping = false;
  private retrying = false;
  private contextBusy = false;
  private deleting = false;
  private copyRecovery: {
    request: CommitRequest;
    source: PlanInputs;
    generation: number;
    catalog: CatalogSnapshot;
    saveState: SaveState;
    knownAborted: boolean;
  } | null = null;
  private undoPlan: PlanInputs | null = null;
  private contextRequest = 0;
  private assessmentRequest = 0;
  private disposed = false;
  constructor(
    private readonly repository: Repository,
    private readonly library: Library,
    private readonly assessor: Assessor = assessPlan,
  ) {}
  getSnapshot = (): ViewState => this.state;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private publish(patch: Partial<ViewState>): void {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  private error<T>(result: Result<T>): Result<T> {
    if (!result.ok) this.publish({ errors: result.errors });
    return result;
  }
  clearErrors(): void {
    this.publish({ errors: [] });
  }
  private async attempt<T>(
    operation: () => Promise<Result<T>>,
    code = 'dependency_failed',
  ): Promise<Result<T>> {
    try {
      return await operation();
    } catch {
      return fail(
        code,
        'This operation could not be confirmed. Your current inputs are preserved; retry or download them.',
      );
    }
  }
  async initialize(): Promise<void> {
    this.publish({ loading: true });
    const [manifest, plans] = await Promise.all([
      this.attempt(() => this.library.discover()),
      this.attempt(() => this.repository.list()),
    ]);
    this.publish({
      manifest: manifest.ok ? manifest.value : null,
      plans: plans.ok ? plans.value : [],
      loading: false,
      errors: [...(!manifest.ok ? manifest.errors : []), ...(!plans.ok ? plans.errors : [])],
    });
  }
  private guard(discard: boolean): Result<void> {
    if (
      this.pumping ||
      this.retrying ||
      this.contextBusy ||
      (this.copyRecovery && !this.copyRecovery.knownAborted) ||
      this.state.saveState === 'saving' ||
      this.state.saveState === 'reconciling'
    )
      return this.error(
        fail(
          'save_in_progress',
          'Wait for the current save to finish, or download your current inputs before leaving.',
        ),
      );
    if (this.state.plan && this.state.saveState !== 'saved' && !discard)
      return this.error(
        fail(
          'unsaved_changes',
          'Changes not saved. Retry saving or explicitly discard these edits before switching.',
        ),
      );
    return ok(undefined);
  }
  private detach(): void {
    this.contextRequest++;
    this.copyRecovery = null;
    this.queue = [];
    this.undoPlan = null;
    this.baseRevision = null;
    this.durableName = null;
    this.assessmentRequest++;
    this.publish({
      plan: null,
      assessment: null,
      assessmentStatus: 'pending',
      canUndo: false,
      adoption: null,
      saveState: 'unsaved',
      focusCourseId: null,
      olderCatalog: false,
    });
  }
  async selectQuarter(id: string, discard = false): Promise<Result<void>> {
    const guarded = this.guard(discard);
    if (!guarded.ok) return guarded;
    const request = ++this.contextRequest;
    this.publish({ loading: true, errors: [] });
    const result = await this.attempt(() => this.library.load(id));
    if (request !== this.contextRequest)
      return fail('superseded', 'A newer quarter request replaced this one.');
    this.publish({ loading: false });
    if (!result.ok) return this.error(result);
    this.detach();
    this.publish({
      catalog: result.value.snapshot,
      notice:
        result.value.warning ??
        (result.value.retained
          ? 'Using a retained catalog. Current offerings could not be verified.'
          : ''),
    });
    return ok(undefined);
  }
  async create(name: string): Promise<Result<void>> {
    const guard = this.guard(false);
    if (!guard.ok) return guard;
    const catalog = this.state.catalog;
    if (!catalog)
      return this.error(fail('quarter_required', 'Select a quarter before creating a plan.'));
    const result = createPlan(name, catalog);
    if (!result.ok) return this.error(result);
    const request = ++this.contextRequest;
    const available = await this.attempt(() =>
      this.repository.nameAvailable(result.value.name, result.value.quarterId),
    );
    if (request !== this.contextRequest)
      return fail('superseded', 'The context changed while checking the name.');
    if (!available.ok) return this.error(available);
    if (!available.value)
      return this.error(
        fail('duplicate_name', 'A plan with this name already exists in this quarter.', 'name'),
      );
    this.detach();
    this.accept(result.value, 'create');
    return ok(undefined);
  }
  async open(id: string, discard = false): Promise<Result<void>> {
    const guard = this.guard(discard);
    if (!guard.ok) return guard;
    const request = ++this.contextRequest;
    this.publish({ loading: true, errors: [] });
    const record = await this.attempt(() => this.repository.open(id));
    if (request !== this.contextRequest)
      return fail('superseded', 'The context changed while opening this plan.');
    if (!record.ok) {
      this.publish({ loading: false });
      return this.error(record);
    }
    const loaded = await this.attempt(() =>
      this.library.load(record.value.inputs.quarterId, record.value.inputs.catalogRef),
    );
    if (request !== this.contextRequest)
      return fail('superseded', 'A newer open request replaced this one.');
    this.publish({ loading: false });
    if (!loaded.ok) return this.error(loaded);
    this.loadRecord(record.value, loaded.value.snapshot);
    this.publish({ notice: loaded.value.warning ?? '' });
    return ok(undefined);
  }
  private loadRecord(record: StoredPlan, catalog: CatalogSnapshot): void {
    this.detach();
    this.baseRevision = record.revision;
    this.durableName = record.inputs.name;
    this.publish({ plan: record.inputs, catalog, generation: 0, saveState: 'saved', errors: [] });
    this.assess();
  }
  async edit(command: PlanCommand): Promise<Result<void>> {
    if (this.deleting)
      return this.error(
        fail('delete_in_progress', 'Wait for the deletion to finish before editing.'),
      );
    const { plan, catalog, generation } = this.state;
    if (!plan || !catalog) return this.error(fail('no_plan', 'Create or open a plan first.'));
    const result = editPlan(plan, command, catalog);
    if (!result.ok) return this.error(result);
    if (command.type === 'rename') {
      const token = this.contextRequest;
      const available = await this.attempt(() =>
        this.repository.nameAvailable(result.value.plan.name, plan.quarterId, plan.id),
      );
      if (
        token !== this.contextRequest ||
        this.state.plan !== plan ||
        this.state.generation !== generation ||
        this.deleting
      )
        return this.error(
          fail(
            'edit_changed',
            'The plan changed while checking the name. Please try again.',
            'name',
          ),
        );
      if (!available.ok) return this.error(available);
      if (!available.value)
        return this.error(
          fail('duplicate_name', 'A plan with this name already exists in this quarter.', 'name'),
        );
    }
    if (result.value.focusCourseId && result.value.plan === plan) {
      this.publish({
        focusCourseId: result.value.focusCourseId,
        notice: 'This course is already in your plan.',
        errors: [],
      });
      return ok(undefined);
    }
    this.undoPlan = command.type === 'removeCourse' ? plan : null;
    this.accept(result.value.plan, this.baseRevision === null ? 'create' : 'replace');
    this.publish({
      canUndo: !!this.undoPlan,
      focusCourseId: result.value.focusCourseId ?? null,
      notice: result.value.warnings.join(' '),
    });
    return ok(undefined);
  }
  undo(): Result<void> {
    if (this.deleting)
      return this.error(
        fail('delete_in_progress', 'Wait for the deletion to finish before editing.'),
      );
    if (!this.undoPlan)
      return this.error(
        fail('undo_expired', 'Undo is available until the next accepted edit or plan close.'),
      );
    const prior = this.undoPlan;
    this.undoPlan = null;
    this.accept(prior, this.baseRevision === null ? 'create' : 'replace');
    this.publish({ canUndo: false, notice: 'Course removal undone.' });
    return ok(undefined);
  }
  private accept(plan: PlanInputs, operation: CommitRequest['operation']): void {
    this.contextRequest++;
    const generation = this.state.generation + 1;
    const paused = ['revision_conflict', 'reconciling', 'save_failed'].includes(
      this.state.saveState,
    );
    this.queue.push({ inputs: plan, generation, mutationId: newId(), operation });
    this.publish({
      plan,
      generation,
      loading: false,
      errors: [],
      adoption: null,
      assessment: null,
      assessmentStatus: 'pending',
      saveState: paused ? this.state.saveState : 'saving',
    });
    this.assess();
    if (!paused) void this.pump();
  }
  private assess(): void {
    const { plan, catalog, generation } = this.state;
    if (!plan || !catalog) return;
    const request = ++this.assessmentRequest;
    this.publish({ assessment: null, assessmentStatus: 'pending' });
    void this.attempt(() => this.assessor(plan, catalog, generation), 'assessment_failed')
      .then((result) => {
        if (
          request !== this.assessmentRequest ||
          this.state.plan?.id !== plan.id ||
          this.state.generation !== generation ||
          !sameRef(this.state.plan.catalogRef, plan.catalogRef)
        )
          return;
        if (
          result.ok &&
          result.value.key.planId === plan.id &&
          result.value.key.generation === generation &&
          sameRef(result.value.key.catalogRef, plan.catalogRef)
        )
          this.publish({ assessment: result.value, assessmentStatus: 'complete' });
        else
          this.publish({
            assessment: null,
            assessmentStatus: 'failed',
            errors: result.ok
              ? [
                  {
                    code: 'assessment_key',
                    message: 'Checks could not be matched to the current revision. Retry checks.',
                  },
                ]
              : result.errors,
          });
      })
      .catch(() => {
        if (request === this.assessmentRequest)
          this.publish({
            assessment: null,
            assessmentStatus: 'failed',
            errors: [
              {
                code: 'assessment_failed',
                message:
                  'Checks are unavailable. Your input is preserved; retry checks or download it.',
              },
            ],
          });
      });
  }
  retryAssessment(): void {
    this.assess();
  }
  private async pump(): Promise<void> {
    if (this.pumping || this.contextBusy || this.copyRecovery) return;
    this.pumping = true;
    try {
      while (this.queue.length && !this.disposed) {
        if (['revision_conflict', 'save_failed', 'reconciling'].includes(this.state.saveState))
          break;
        const item = this.queue[0];
        const catalog = this.state.catalog;
        if (!catalog) break;
        const request: CommitRequest = item.request ?? {
          operation: this.baseRevision === null ? item.operation : 'replace',
          inputs: item.inputs,
          expectedRevision: this.baseRevision,
          mutationId: item.mutationId,
          sessionId: this.sessionId,
          generation: item.generation,
          fingerprint: await fingerprint(item.inputs),
          catalog: catalog.envelope,
        };
        item.request = request;
        let result = await this.attempt(() => this.repository.commit(request), 'indeterminate');
        const uncertainCommit = this.uncertain(result);
        if (uncertainCommit) {
          this.publish({ saveState: 'reconciling', errors: result.ok ? [] : result.errors });
          result = await this.attempt(() => this.repository.reconcile(request), 'indeterminate');
        }
        if (!result.ok) {
          const codes = result.errors.map((e) => e.code);
          const state: SaveState = codes.some((c) =>
            ['revision_conflict', 'deleted_plan'].includes(c),
          )
            ? 'revision_conflict'
            : uncertainCommit && !codes.includes('known_aborted')
              ? 'reconciling'
              : 'save_failed';
          this.publish({ saveState: state, errors: result.errors });
          if (!uncertainCommit && codes.includes('duplicate_name') && this.state.plan) {
            let latest = this.state.plan;
            if (this.durableName && latest.name === item.inputs.name) {
              const restored = editPlan(
                latest,
                { type: 'rename', name: this.durableName },
                catalog,
              );
              if (restored.ok) {
                latest = restored.value.plan;
                this.publish({
                  plan: latest,
                  generation: this.state.generation + 1,
                  assessment: null,
                  assessmentStatus: 'pending',
                  notice:
                    'Another tab used that name. The prior plan name was restored; your other edits are retained. Enter a different name, then retry saving.',
                });
                this.assess();
              }
            }
            // This request definitely aborted. Rebuild the latest draft at the original base.
            this.queue = [
              {
                inputs: latest,
                generation: this.state.generation,
                mutationId: newId(),
                operation: this.baseRevision === null ? 'create' : 'replace',
              },
            ];
          }
          break;
        }
        const receipt = result.value;
        if (!this.exactReceipt(request, receipt)) {
          this.receiptMismatch();
          break;
        }
        this.baseRevision = receipt.revision;
        this.durableName = item.inputs.name;
        this.queue.shift();
        this.publish({
          saveState:
            this.queue.length === 0 && this.state.generation === receipt.generation
              ? 'saved'
              : 'saving',
          errors: [],
        });
      }
    } catch (error) {
      this.publish({
        saveState: 'save_failed',
        errors: [
          {
            code: 'unexpected_save',
            message: `Changes not saved. ${error instanceof Error ? error.message : 'Storage is unavailable.'}`,
          },
        ],
      });
    } finally {
      this.pumping = false;
      await this.refreshPlans();
    }
  }
  private exactReceipt(request: CommitRequest, receipt: SaveReceipt): boolean {
    return (
      !!receipt &&
      !!receipt.catalogRef &&
      Number.isInteger(receipt.revision) &&
      receipt.revision > (request.expectedRevision ?? 0) &&
      receipt.planId === request.inputs.id &&
      receipt.mutationId === request.mutationId &&
      receipt.sessionId === request.sessionId &&
      receipt.generation === request.generation &&
      receipt.fingerprint === request.fingerprint &&
      sameRef(receipt.catalogRef, request.inputs.catalogRef)
    );
  }
  private receiptMismatch(): Result<void> {
    this.publish({ saveState: 'reconciling' });
    return this.error(
      fail(
        'receipt_mismatch',
        'The save receipt did not identify this exact edit. Download the current plan and retry recovery.',
      ),
    );
  }
  private uncertain(result: Result<unknown>): boolean {
    return (
      !result.ok &&
      result.errors.some((error) =>
        ['interrupted_or_indeterminate', 'indeterminate'].includes(error.code),
      )
    );
  }
  private knownAborted(result: Result<unknown>): boolean {
    return !result.ok && result.errors.some((error) => error.code === 'known_aborted');
  }
  async retrySave(): Promise<Result<void>> {
    if (this.pumping || this.retrying || this.contextBusy)
      return fail('save_in_progress', 'A save is already in progress.');
    this.retrying = true;
    try {
      if (this.copyRecovery) {
        const recovery = this.copyRecovery;
        let result: Result<SaveReceipt> = recovery.knownAborted
          ? fail('known_aborted', 'This copy did not commit.')
          : await this.attempt(() => this.repository.reconcile(recovery.request), 'indeterminate');
        if (this.knownAborted(result)) {
          recovery.knownAborted = false;
          this.publish({ saveState: 'saving', errors: [] });
          result = await this.attempt(
            () => this.repository.commit(recovery.request),
            'indeterminate',
          );
          if (this.uncertain(result)) {
            this.publish({ saveState: 'reconciling' });
            result = await this.attempt(
              () => this.repository.reconcile(recovery.request),
              'indeterminate',
            );
          } else if (!result.ok) {
            // This retry definitely did not commit. Release its name so the student
            // can request a corrected copy while retaining any newer source edits.
            this.copyRecovery = null;
            this.publish({
              saveState:
                recovery.saveState === 'saved' && this.queue.length ? 'saving' : recovery.saveState,
            });
            if (this.state.saveState === 'saving') await this.pump();
            return this.error(result);
          }
        }
        if (!result.ok) {
          recovery.knownAborted ||= this.knownAborted(result);
          this.publish({ saveState: recovery.knownAborted ? 'save_failed' : 'reconciling' });
          return this.error(result);
        }
        if (!this.exactReceipt(recovery.request, result.value)) return this.receiptMismatch();
        this.finishCopy(recovery, result.value);
      }
      if (this.state.saveState === 'revision_conflict')
        return this.error(
          fail(
            'revision_conflict',
            'Load the newer revision or save a separately named copy. Download is always available.',
          ),
        );
      const item = this.queue[0];
      if (this.state.saveState === 'reconciling' && item?.request) {
        const result = await this.attempt(
          () => this.repository.reconcile(item.request!),
          'indeterminate',
        );
        if (!result.ok && !this.knownAborted(result)) {
          this.publish({
            saveState: result.errors.some((e) =>
              ['revision_conflict', 'deleted_plan'].includes(e.code),
            )
              ? 'revision_conflict'
              : 'reconciling',
          });
          return this.error(result);
        }
        if (result.ok) {
          if (!this.exactReceipt(item.request, result.value)) return this.receiptMismatch();
          this.baseRevision = result.value.revision;
          this.durableName = item.inputs.name;
          this.queue.shift();
        }
        // An atomic read proved this request aborted; explicit retry reuses it unchanged.
      }
      this.publish({ saveState: this.queue.length ? 'saving' : 'saved', errors: [] });
      await this.pump();
      return this.state.saveState === 'saved'
        ? ok(undefined)
        : fail('save_failed', 'Changes are still not saved.');
    } catch {
      this.publish({
        saveState:
          this.copyRecovery || this.state.saveState === 'reconciling'
            ? 'reconciling'
            : 'save_failed',
      });
      return this.error(
        fail(
          'unexpected_save',
          'Recovery is unavailable. Your current inputs are preserved; retry or download them.',
        ),
      );
    } finally {
      this.retrying = false;
    }
  }
  private finishCopy(
    recovery: NonNullable<PlanSession['copyRecovery']>,
    receipt: SaveReceipt,
  ): void {
    this.copyRecovery = null;
    if (this.state.plan === recovery.source && this.state.generation === recovery.generation) {
      this.loadRecord(
        {
          schemaVersion: 1,
          inputs: recovery.request.inputs,
          revision: receipt.revision,
          receipt,
          updatedAt: new Date().toISOString(),
        },
        recovery.catalog,
      );
      this.publish({ notice: 'Independent copy saved. You are editing the copy.' });
    } else {
      this.publish({
        saveState:
          recovery.saveState === 'saved' && this.queue.length ? 'saving' : recovery.saveState,
        errors: [],
        notice: 'Independent copy saved. Your newer edits are retained in the source plan.',
      });
    }
  }
  async duplicate(name: string): Promise<Result<void>> {
    if (
      this.pumping ||
      this.retrying ||
      this.contextBusy ||
      this.copyRecovery ||
      this.state.saveState === 'reconciling'
    )
      return this.error(
        fail(
          'save_in_progress',
          'Wait for the current save to finish before creating a copy. You can download now.',
        ),
      );
    const { plan, catalog, generation, saveState } = this.state;
    if (!plan || !catalog) return this.error(fail('no_plan', 'Open a plan to copy.'));
    const copied = copyPlan(plan, name);
    if (!copied.ok) return this.error(copied);
    const token = ++this.contextRequest;
    try {
      const available = await this.repository.nameAvailable(copied.value.name, plan.quarterId);
      if (token !== this.contextRequest)
        return fail('superseded', 'The source changed while checking the copy name. Try again.');
      if (!available.ok) return this.error(available);
      if (!available.value)
        return this.error(fail('duplicate_name', 'Choose a different plan name.', 'name'));
      this.contextBusy = true;
      const request: CommitRequest = {
        operation: 'duplicate',
        inputs: copied.value,
        expectedRevision: null,
        mutationId: newId(),
        sessionId: this.sessionId,
        generation: 0,
        fingerprint: await fingerprint(copied.value),
        catalog: catalog.envelope,
      };
      const recovery = {
        request,
        source: plan,
        generation,
        catalog,
        saveState,
        knownAborted: false,
      };
      this.copyRecovery = recovery;
      let result = await this.attempt(() => this.repository.commit(request), 'indeterminate');
      const uncertainCommit = this.uncertain(result);
      if (uncertainCommit) {
        this.publish({ saveState: 'reconciling', errors: result.ok ? [] : result.errors });
        result = await this.attempt(() => this.repository.reconcile(request), 'indeterminate');
      }
      if (!result.ok) {
        if (uncertainCommit) {
          recovery.knownAborted = this.knownAborted(result);
          this.publish({ saveState: recovery.knownAborted ? 'save_failed' : 'reconciling' });
        } else {
          this.copyRecovery = null;
          this.publish({
            saveState: saveState === 'saved' && this.queue.length ? 'saving' : saveState,
          });
        }
        return this.error(result);
      }
      if (!this.exactReceipt(request, result.value)) return this.receiptMismatch();
      this.finishCopy(recovery, result.value);
      return ok(undefined);
    } catch {
      if (this.copyRecovery) this.publish({ saveState: 'reconciling' });
      return this.error(
        fail(
          this.copyRecovery ? 'indeterminate' : 'copy_failed',
          'The copy could not be confirmed. Your source inputs are preserved; retry recovery or download them.',
        ),
      );
    } finally {
      this.contextBusy = false;
      if (this.state.saveState === 'saving') void this.pump();
      await this.refreshPlans();
    }
  }
  async deleteCurrent(confirmedName: string, discard = false): Promise<Result<void>> {
    const guard = this.guard(discard);
    if (!guard.ok) return guard;
    const plan = this.state.plan;
    if (!plan || confirmedName !== plan.name)
      return this.error(
        fail('confirmation_required', 'Confirm deletion using the displayed plan name.'),
      );
    this.contextRequest++;
    this.contextBusy = true;
    this.deleting = true;
    try {
      if (this.baseRevision !== null) {
        const result = await this.attempt(
          () => this.repository.delete(plan.id, this.baseRevision!, newId()),
          'indeterminate',
        );
        if (!result.ok) {
          if (
            this.uncertain(result) ||
            result.errors.some((error) =>
              ['revision_conflict', 'deleted_plan'].includes(error.code),
            )
          )
            this.publish({ saveState: 'revision_conflict' });
          return this.error(result);
        }
      }
      this.detach();
      this.publish({ notice: `Deleted “${confirmedName}”.` });
      await this.refreshPlans();
      return ok(undefined);
    } finally {
      this.deleting = false;
      this.contextBusy = false;
    }
  }
  async loadNewer(confirmedDiscard: boolean): Promise<Result<void>> {
    if (!confirmedDiscard)
      return this.error(
        fail('confirmation_required', 'Confirm that the current unsaved edits will be discarded.'),
      );
    if (!this.state.plan) return fail('no_plan', 'No plan is open.');
    return this.open(this.state.plan.id, true);
  }
  async checkCatalogUpdate(): Promise<Result<void>> {
    const { plan, catalog, generation } = this.state;
    if (!plan || !catalog) return fail('no_plan', 'Open a plan first.');
    const token = this.contextRequest;
    const current = () =>
      token === this.contextRequest &&
      this.state.plan === plan &&
      this.state.catalog === catalog &&
      this.state.generation === generation;
    const changed = () =>
      fail<void>('edit_changed', 'The plan changed. Check for catalog updates again.');
    const discovered = await this.attempt(() => this.library.discover());
    if (!current()) return changed();
    if (!discovered.ok) return this.error(discovered);
    this.publish({ manifest: discovered.value });
    const loaded = await this.attempt(() => this.library.load(plan.quarterId));
    if (!current()) return changed();
    if (!loaded.ok) return this.error(loaded);
    if (sameRef(loaded.value.snapshot.ref, catalog.ref)) {
      this.publish({
        notice: loaded.value.warning ?? 'This plan uses the latest available catalog.',
        adoption: null,
      });
      return ok(undefined);
    }
    const preview = await this.attempt(async () =>
      ok(await this.library.preview(plan, generation, catalog, loaded.value.snapshot)),
    );
    if (!current()) return changed();
    if (!preview.ok) return this.error(preview);
    this.publish({
      adoption: { preview: preview.value, catalog: loaded.value.snapshot },
      olderCatalog: true,
      notice: '',
    });
    return ok(undefined);
  }
  keepCatalog(): void {
    this.publish({
      adoption: null,
      olderCatalog: true,
      notice: 'Keeping the older catalog pinned to this plan.',
    });
  }
  async applyCatalogUpdate(): Promise<Result<void>> {
    const { plan, catalog, adoption, generation } = this.state;
    if (!plan || !catalog || !adoption)
      return fail('no_preview', 'Preview a catalog update first.');
    if (
      this.pumping ||
      this.retrying ||
      this.contextBusy ||
      this.copyRecovery ||
      this.state.saveState !== 'saved'
    )
      return this.error(
        fail(
          'save_required',
          'Finish saving or resolve the current save failure before applying a catalog update.',
        ),
      );
    const token = this.contextRequest;
    const matches = () =>
      adoption.preview.planId === plan.id &&
      adoption.preview.generation === generation &&
      sameRef(adoption.preview.oldRef, catalog.ref) &&
      sameRef(adoption.preview.newRef, adoption.catalog.ref);
    if (!matches())
      return this.error(
        fail('stale_preview', 'The draft changed. Review the catalog update again.'),
      );
    const captured = await this.attempt(async () => ok(await fingerprint(plan)));
    if (
      token !== this.contextRequest ||
      this.state.plan !== plan ||
      this.state.catalog !== catalog ||
      this.state.generation !== generation ||
      this.state.adoption !== adoption
    )
      return this.error(
        fail('stale_preview', 'The draft changed. Review the catalog update again.'),
      );
    if (
      this.pumping ||
      this.retrying ||
      this.contextBusy ||
      this.copyRecovery ||
      this.state.saveState !== 'saved'
    )
      return this.error(
        fail(
          'save_required',
          'Finish saving or resolve the current save failure before applying a catalog update.',
        ),
      );
    if (!captured.ok) return this.error(captured);
    if (!matches() || adoption.preview.fingerprint !== captured.value)
      return this.error(
        fail('stale_preview', 'The draft changed. Review the catalog update again.'),
      );
    const result = adoptCatalog(plan, catalog, adoption.catalog);
    if (!result.ok) return this.error(result);
    this.undoPlan = null;
    this.publish({
      catalog: adoption.catalog,
      canUndo: false,
      olderCatalog: false,
      adoption: null,
    });
    this.accept(result.value.plan, 'replace');
    this.publish({
      notice:
        result.value.warnings.join(' ') || 'Catalog update applied. Your choices were preserved.',
    });
    return ok(undefined);
  }
  exportInput(): Result<ExportInput> {
    const { plan, catalog, assessment, assessmentStatus, saveState } = this.state;
    if (!plan || !catalog) return fail('no_plan', 'Open a plan before downloading.');
    return ok(
      clonePlain({
        plan,
        catalog: catalog.envelope,
        assessment,
        assessmentStatus,
        saveState,
        capturedAt: new Date().toISOString(),
      }),
    );
  }
  private async refreshPlans(): Promise<void> {
    try {
      const result = await this.repository.list();
      if (result.ok) this.publish({ plans: result.value });
    } catch {
      /* List refresh must not replace the current draft or save outcome. */
    }
  }
  dispose(): void {
    this.disposed = true;
    this.contextRequest++;
    this.assessmentRequest++;
    this.listeners.clear();
  }
}
