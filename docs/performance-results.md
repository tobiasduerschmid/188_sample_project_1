# Browser performance results

The production app met the QR-01 and QR-02 timing thresholds in all 600 measured operations on this test host: 100 searches, 100 edits, and 100 saved-plan openings in each browser. These are empirical development results; formal acceptance on the specified four-core, 8 GB reference laptop remains outstanding.

| Browser                | Operation | Complete samples | Within threshold   | p50 (ms) | p95 (ms) | Maximum (ms) |
| ---------------------- | --------- | ---------------- | ------------------ | -------- | -------- | ------------ |
| chromium 153.0.8010.12 | search    | 100/100          | 100/100 at 1000 ms | 25.3     | 31.1     | 39.3         |
| chromium 153.0.8010.12 | edit      | 100/100          | 100/100 at 1000 ms | 601.8    | 625.6    | 633.2        |
| chromium 153.0.8010.12 | open      | 100/100          | 100/100 at 2000 ms | 703.1    | 745.0    | 760.1        |
| firefox 155.0          | search    | 100/100          | 100/100 at 1000 ms | 15.0     | 20.0     | 22.0         |
| firefox 155.0          | edit      | 100/100          | 100/100 at 1000 ms | 690.0    | 722.0    | 864.0        |
| firefox 155.0          | open      | 100/100          | 100/100 at 2000 ms | 1408.0   | 1445.0   | 1533.0       |

Percentiles use nearest rank on 100 samples; the pass condition is at least 95 of 100 searches and edits within 1,000 ms, and at least 95 of 100 openings within 2,000 ms. No failed, incomplete, or slow sample was omitted.

## Environment and reproduction

Measured September 29, 2026 PDT (Chromium completed 2026-09-30T00:28:08.019Z; Firefox completed 2026-09-30T00:35:24.255Z). Host: macOS/Darwin ARM64, Apple M4 Max, 14 logical CPUs, 36 GiB RAM. Browsers: Playwright Chromium 153.0.8010.12 and Firefox 155.0, headless, extensions disabled, 1280 × 800 CSS-pixel viewport. The Desktop Chrome/Firefox test device presets supply the recorded user-agent strings; the actual host is the macOS machine identified here. These installed test binaries are recorded explicitly rather than asserted to be the current stable acceptance releases.

The Playwright configuration builds the production app and serves its preview on port 4173. Both projects ran sequentially with one worker to avoid competing workloads. The full run exited successfully with two tests passing in 10.8 minutes. Browser trace recording was enabled by the repository's retain-on-failure configuration during the measurement.

```sh
npm run test:e2e -- performance.spec.ts --project=chromium --project=firefox --workers=1
```

Raw measured samples and environment metadata are preserved in [Chromium JSON](performance/chromium.json) and [Firefox JSON](performance/firefox.json). Future runs also attach their complete JSON report to Playwright results.

## Workload and timing endpoints

[The fixture](../tests/fixtures/workload.ts) passes the same public catalog validator and complete plan restoration boundary as the app. It contains 5,000 courses, 20,000 sections, and a 140-day quarter, including the exam week. Every section has valid weekly meeting metadata. The catalog JSON is 11,938,997 bytes.

All 20 saved plans occupy every plan capacity: 40 distinct courses, 200 selected components, 100 personal intervals, 200 coursework records, and 50 targets. The fixture expands all selected inputs into 3,800 class occurrences and 100 personal occurrences. Selected intervals are nonoverlapping and exams explicitly absent, keeping the diagnostic output bounded without reducing any capacity or applying a hidden limit. The first week contains 200 class meetings and 80 personal intervals; the remaining 20 personal intervals occur in the following week.

Setup uses real browser IndexedDB with the app's four object stores, complete schema-versioned plan records, retained catalog envelopes, name indexes, and SHA-256 fingerprints computed from the actual inputs. Setup and the first untimed open finish before sampling. Public manifest/catalog routes serve the valid synthetic envelope. Timed searches, edits, and openings use the initialized, retained catalog and require no network operation, so the network bandwidth/latency reference condition does not apply to these samples.

[The browser test](../tests/e2e/performance.spec.ts) starts its clock at the captured browser input/click event and stops after the completed DOM satisfies its checks through two animation-frame opportunities:

- Search: 100 distinct searches alternate course code, title, and instructor. The correct course, exact result count, and coherent completed diagnostic summary must be rendered.
- Edit: 100 alternating history-completeness changes retain all maximum-size plan inputs and recompute schedule and academic checks. All 40 prerequisite statuses and all 50 target statuses must change to the expected new values while the summary contains complete unit/time checks. The previous revision cannot qualify. Each autosave finishes before the next sample, and the saved acknowledgment is not substituted for the edit endpoint.
- Opening: the same complete maximum-size saved plan is opened 100 times through its actual saved-plan button. Each sample must observe the loading transition finish, all 40 complete course bundles and 200 selected component controls, the schedule grid, and the complete diagnostic summary. A loading placeholder or previously displayed summary cannot qualify.

The timing test additionally asserts the expected first-week occurrence counts before and after the opening series. Those count assertions were added after the full timing run and verified in a separate maximum-workload rendering check against each browser, without repeating the 100-sample series. The additional check passed in Chromium and Firefox (2 tests, 52.1 seconds) against the rebuilt app, verifying all 200 class and 80 personal meetings on both its initial and repeated opening.

The test does not infer physical display latency, reference-laptop performance, current stable browser acceptance, or a separate maximum-workload saved-acknowledgment timing guarantee from these results.
