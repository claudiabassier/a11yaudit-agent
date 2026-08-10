# Before / after — the demo pair

Same clinical content, rewritten. Both audited end to end through the live system.
Extracted from the generated reports in `demo_output/`; the deterministic score is not stored in the database (see decision_log.md D-32).

## Poor fixture — `report_poor.md`

These four numbers measure different things on different scales and are deliberately never combined into one figure.
| Measure | Score | Reading |
|---|---|---|
| WCAG screening score — deterministic checks only (reproducible) | 52 | severe issues found |
| WCAG screening score — including AI-proposed findings (varies between runs) | 0 | severe issues found |
| PEMAT-informed understandability | 28.6 | of applicable items passed (%) |
| PEMAT-informed actionability | 33.3 | of applicable items passed (%) |
| CCI-informed score | 22.2 | CDC interpretation: ≥90 good, ≤89 revise |

## Corrected twin — `report_corrected.md`

These four numbers measure different things on different scales and are deliberately never combined into one figure.
| Measure | Score | Reading |
|---|---|---|
| WCAG screening score — deterministic checks only (reproducible) | 100 | no issues in screened subset |
| WCAG screening score — including AI-proposed findings (varies between runs) | 38 | severe issues found |
| PEMAT-informed understandability | 92.9 | of applicable items passed (%) |
| PEMAT-informed actionability | 100 | of applicable items passed (%) |
| CCI-informed score | 88.2 | CDC interpretation: ≥90 good, ≤89 revise |

## The comparison that matters

| Measure | poor | corrected | reproducible? |
|---|---|---|---|
| **WCAG screening — deterministic checks only** | **52** — severe issues found | **100** — no issues in screened subset | **yes** |
| WCAG screening — including AI findings | 0 | 38 | no (see D-30) |
| PEMAT-informed understandability | 28.6 | 92.9 | no |
| PEMAT-informed actionability | 33.3 | 100 | no |
| CCI-informed | 22.2 | 88.2 | no |
| Routed to human review | yes | **yes** | yes |

**Quote the deterministic score: 52 to 100.** Both values were written down on 31 July in `fixtures/README.md`, computed by running the check engines standalone before the n8n pipeline existed; the assembled system reproduced them exactly, and they re-run to the same value.

**The corrected page still routes to a human.** It is well written, scores 100 deterministically, and is still medication content — so rule R7 fires and a person must look at it. The tool does not trade safety for quality.

**The combined score's verbal label is not calibrated for content findings (D-33):** both pages read "severe issues found" because AI-proposed comprehension findings are numerous even on good material. That is why the two numbers are reported separately, and why the label is not quoted as a result.
