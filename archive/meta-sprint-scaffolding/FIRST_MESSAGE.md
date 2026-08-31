# First message for the new Project chat

Copy everything between the lines into the new chat. Nothing else is needed — the Project files and system prompt carry the rest.

---

Start of the build phase. Read `PROJECT_STATUS.md` first — it has the current state, the 7-day schedule and the Day 0 work list.

Today is Day 0: front-loading all Code-node JavaScript so the build days become paste-and-test instead of write-and-debug.

Start with the two files Day 2 needs, in this order:

1. `code/A4_validate_output.js` — SUB-A output validation: JSON parse with code-fence stripping, schema and enum checks, confidence clamping, WCAG criterion regex, **evidence verified as a literal substring of `content_text` after whitespace normalisation** (drop the finding if not found, count it in `dropped_unverified`), instrument-item completeness diff against the required set (missing → `not_assessed`), max 25 findings keeping the most severe.
2. `code/A2_build_prompt.js` — assemble the system prompt from `workflow_spec.md` §2 plus the user message, inject `deterministic_items`, set `attempt`.

For each file:
- a header comment with the node name, expected input shape and output shape
- n8n-native code (`$input.all()`, return an array of `{json: ...}`)
- defensive against nulls and missing fields — this runs on real, messy input
- a commented test-input block at the bottom that I can pin in n8n to execute the node standalone
- plain-language explanation of what the code does, in the chat, so I can defend it in the review

One file at a time. Wait for me to confirm before moving to the next.

---

## After Day 0, the daily rhythm

**Start of each build day**, paste:

> Day N. Yesterday's gate: [passed / failed because …]. Today per `build_runbook.md` §7: [work]. Let's start with [first item].

**End of each build day**, paste:

> Day N done. Built: […]. Deviations from the spec: […]. Gate: [passed/failed]. Update `PROJECT_STATUS.md` and add decision-log entries for the deviations.

That end-of-day update is what keeps a fresh chat able to pick up seamlessly if this one gets long — and the decision-log entries are the primary evidence for evaluation criterion 2 ("understood and explained what they learned").
