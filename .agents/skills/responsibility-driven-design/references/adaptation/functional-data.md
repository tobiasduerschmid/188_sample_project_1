# Functional and data-oriented realizations

> **Provenance boundary - modern extension beyond the book:** The book's examples are object-oriented. This reference applies its responsibility, role, stereotype, collaboration, and information-hiding concepts to functional, immutable-data, actor, reducer, state-machine, and pipeline realizations. Those mappings are original extensions and must not be attributed to Wirfs-Brock and McKean.

Read [modern-systems.md](modern-systems.md) first for the conceptual/realization distinction.

## Functions and data-oriented realizations

RDD does not require every participant to become a mutable class instance. A role can be realized by:

- a pure function with an explicit input/output contract;
- a module that owns related functions and invariants;
- an immutable value plus the operations that can validly construct or transform it;
- a reducer or state transition function;
- an actor or process owning state;
- a pipeline stage with an outcome-oriented contract; or
- a repository or capability that controls access to authoritative data.

Raw data does not become responsible merely because behavior is represented separately. Identify the module, function family, state machine, or capability that owns valid construction, interpretation, decisions, and transitions. Keep policies close to the information they govern, even if “close” means one cohesive module rather than one object.

### Classic stereotype prompts for function/data systems

| RDD stereotype | Function/data-oriented prompt |
| --- | --- |
| Information holder | Which value, state owner, or access capability supplies authoritative information and prevents invalid representation? |
| Structurer | Which index, relation module, graph operation, or collection abstraction owns relationship meaning and navigation? |
| Service provider | Which function or module performs the coherent computation, and which policies does it require? |
| Coordinator | Which reducer, pipeline driver, workflow function, or process reacts to the initiating input and delegates sub-results? |
| Controller | Which decision function or state machine chooses among consequential alternatives, and does it own the necessary knowledge? |
| Interfacer | Which parser, encoder, adapter, or boundary function translates representations and validates external assumptions? |

Avoid both extremes: do not wrap every function in a class to look object-oriented, and do not scatter one participant's coherent responsibility across unrelated utility functions and ungoverned records.

## Functional/data review

- Is responsibility ownership visible even when state and behavior use separate language constructs?
- Are invalid states prevented or rejected by a named construction or transition owner?
- Do pure functions state meaningful preconditions, results, and invariants rather than merely types?
- Are state transitions centralized only where their policy genuinely coheres?
- Does a pipeline stage offer an outcome-oriented contract, or merely expose incidental data movement?
- Are utility modules hiding an unrecognized domain participant or interfacer?
- Has the realization preserved roles and information hiding without manufacturing class wrappers?
