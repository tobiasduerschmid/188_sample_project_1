# AI agents and generative collaborators

> **Provenance boundary - modern extension beyond the book:** Generative models, tool-using agents, probabilistic outputs, model evaluation, and AI governance postdate the book. This reference applies classic RDD roles, responsibilities, collaborations, trust, control, contracts, and reliability reasoning to those systems. The AI-specific mappings and controls are original extensions and must not be attributed to Wirfs-Brock and McKean.

Read [modern-systems.md](modern-systems.md) first. Read [services-distributed-offline.md](services-distributed-offline.md) for remote tool/model operations and [observability.md](observability.md) for trajectory and outcome evidence.

## Separate role from realization

Separate the following:

- **Role:** the stable obligation clients need fulfilled.
- **Agent runtime:** planning loop, memory, tool router, state, and control mechanism.
- **Model provider/model:** a replaceable probabilistic collaborator used by the runtime.
- **Prompt, policy, examples, and retrieval:** realization artifacts that constrain or inform behavior.
- **Tools:** collaborators with their own authority, contracts, failures, and side effects.
- **Human authority:** the person or role that approves, corrects, or accepts consequences.

“The AI agent decides everything” is not a responsibility assignment. Decompose it into bounded obligations such as interpret intent, propose a plan, retrieve evidence, classify risk, select an allowed tool, draft an action, verify a result, explain uncertainty, or escalate.

Treat a generative model as a probabilistic and potentially untrusted collaborator unless task-specific evidence justifies narrower assumptions. The participant using it owns validation appropriate to consequence.

## AI responsibility record

`agent role | client | intended outcome | allowed decisions | prohibited decisions | evidence inputs | model/provider role | tools and authority | memory owner | output schema | quality threshold | uncertainty/abstention | validation owner | approval gate | side-effect budget | cost/latency budget | audit evidence | correction/escalation`

## AI-specific design responsibilities

Assign who:

- defines the goal and evaluates whether it was achieved;
- supplies authoritative context and separates it from untrusted content;
- controls tool permissions, credentials, scopes, and spend;
- checks factuality, policy compliance, and side-effect preconditions;
- resolves prompt injection, data exfiltration, and instruction conflicts at trust boundaries;
- decides when confidence is insufficient and abstention is required;
- approves irreversible, high-impact, person-directed, or externally visible actions;
- detects model, prompt, retrieval, or tool regressions;
- records the decision-relevant trajectory without retaining forbidden data;
- handles partial tool execution, retries, duplicate actions, and ambiguous outcomes;
- corrects outputs and feeds validated lessons into governed memory or evaluation data.

## AI control styles

- A **central supervisor** can keep policy and goal state visible, but can become omniscient and brittle.
- **Delegated specialist agents** can own coherent sub-outcomes, but need explicit handoff contracts and an integration owner.
- **Dispersed multi-agent behavior** can explore broadly, but must not obscure who accepts the final result or controls side effects.

Use deterministic code or a conventional service for obligations that require exact calculation, atomic enforcement, or invariant preservation. Use a generative collaborator where interpretation, synthesis, or uncertain search justifies variability. A mixed participant may use the model to propose and deterministic machinery to validate and commit.

## AI collaboration stories

In addition to the normal scenario, test:

- missing, conflicting, stale, or adversarial context;
- unsupported claims and unverifiable citations;
- model refusal or malformed output;
- tool timeout, partial success, duplicate execution, or changed remote state;
- same tool-operation replay versus a distinct concurrent action;
- a stale tool action or an action arriving before its causal prerequisite;
- operation-ID reuse with changed arguments or intent;
- unauthorized or over-broad requested action;
- budget exhaustion and degraded-provider operation;
- escalation and human correction;
- replay with a changed model, prompt, policy, or retrieval corpus.

Record whether evaluation evidence supports the claimed role. A persuasive transcript is not sufficient validation for a consequential responsibility.

## AI-agent review

- Is the stable role distinct from model, runtime, prompt, memory, tool, and provider choices?
- Are allowed and prohibited decisions bounded at the responsibility level?
- Are authoritative context and untrusted instructions separated?
- Does each side-effecting tool call have operation identity, validation, approval, and outcome verification proportional to consequence?
- Are uncertainty, abstention, correction, escalation, and human authority explicit?
- Can model, prompt, retrieval, tool, or policy regressions be detected with governed evaluations?
- Does trajectory evidence support audit and recovery without exposing forbidden data?
- Is deterministic enforcement used where probabilistic behavior cannot responsibly preserve an invariant?
