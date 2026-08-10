# S4 — anti-fabrication check, controlled injection test

**Run 5 August 2026.** Executes the `Validate Output` code **taken verbatim from `workflows_export/SUB-A_AI_Analysis.json`** against a hand-built AI response containing one verifiable and one fabricated finding. Harness: `code/_S4_evidence_check_harness.js`.

## Source material given to the validator

```
Taking your water tablet

Your doctor has prescribed furosemide, sometimes called a water tablet. Take one tablet each morning with a glass of water.

Tell your practice nurse if you feel dizzy when you stand up.
```

## Injected AI response — two findings

| finding_key | severity | evidence quote | present in source? |
|---|---|---|---|
| `s4-real-quote` | medium | "Take one tablet each morning with a glass of water." | **yes** |
| `s4-fabricated-quote` | **critical** | "Always double your dose if you miss a day." | **no — invented** |

The fabricated finding was deliberately made the most alarming one in the set: `critical`, confidence 0.95. Had it survived, it would have fired rule R1 and forced a critical severity onto a page that never contained the claim.

## Result — run 1, exact quote

```
valid                : true
api_error            : false
dropped_unverified   : 1
findings surviving   : 1
surviving keys       : s4-real-quote
surviving severities : medium
evidence_verified    : true
missing_items_count  : 30
errors               : []
```

## Result — run 2, same real quote with mangled whitespace

Evidence submitted as `"Take one   tablet each morning\n with a glass of water."` — doubled spaces and an injected line break.

```
valid                : true
api_error            : false
dropped_unverified   : 1
findings surviving   : 1
surviving keys       : s4-real-quote
surviving severities : medium
evidence_verified    : true
missing_items_count  : 30
errors               : []
```

## Reading

- The fabricated finding is **dropped and counted** (`dropped_unverified: 1`), not repaired and not argued over.
- `valid: true` — a fabricated quote does not invalidate the whole analysis or trigger a repair attempt. The model gets no opportunity to defend an invented quote.
- The legitimate finding survives **even when reformatted**, so the check normalises whitespace before comparing. It discriminates rather than simply being strict — a validator that dropped correctly-quoted findings over a stray line break would be its own failure mode.
- `missing_items_count: 30` — the injected response contained no instrument items, and all 30 were marked `not_assessed` rather than silently omitted from score denominators.

## Limitation of this test

This executes the node's code as exported, in an isolated Node process, not inside a live n8n execution. It proves the validator's behaviour; it does not exercise n8n's wiring around it. That wiring is evidenced separately by the S1 happy path (Day 2) and by every demo run, where `dropped_unverified` has been observed between 0 and 4 on real model output.
