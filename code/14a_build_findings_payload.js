/**
 * ============================================================================
 * Node 14a — Build Findings Payload (Code)   ·   Workflow: WF1
 * Added 4 Aug (Day 3/4 build) — see decision_log.md D-26. Not in the v2.1 spec.
 * ============================================================================
 *
 * PURPOSE
 *   Attach the audit_id returned by Node 13 to every merged finding and emit
 *   one JSON string, so Node 14 is a single parameterised query
 *   (`json_populate_recordset`) rather than a per-row loop.
 *
 * EXPECTED INPUT
 *   audit_id    — read via $('Upsert Audit') lookup, NOT the direct input
 *     item. UPDATE (16 Aug, Phase 2 Woche 1a): this node's direct predecessor
 *     used to be Node 13 (Upsert Audit) itself, so reading $input.all()[0]
 *     worked. Since audit_runs, Build Audit Run Payload + Insert Audit Run
 *     now sit between them on the canvas, and Insert Audit Run's own output
 *     (run_id only) is what actually reaches $input here — audit_id must be
 *     looked up explicitly instead, same $() pattern this file already uses
 *     for findings below, and the same pattern 13b_build_audit_run_payload.js
 *     uses for values that are no longer on the same item.
 *   findings    — read from $('Decision Engine') (R9 severity upgrades applied)
 *
 * OUTPUT (one item)
 *   { json: { findings_payload: "<json string>", findings_count: n, audit_id } }
 *
 * FIELD NOTES (defend these in review)
 *   evidence_verified — AI findings carry the flag set by SUB-A's A4, which
 *     verified the quote verbatim against the source. Automated findings have
 *     no such flag because their evidence is sliced directly out of the parsed
 *     HTML by the check itself; they are therefore recorded as verified.
 *   review_reason — the deterministic rule that acted on this specific
 *     finding. Only R9 acts per-finding (severity upgrade); audit-level rules
 *     live in audits.triggered_rules, not here.
 * ============================================================================
 */

let audit_id;
try { audit_id = $('Upsert Audit').first().json.audit_id; } catch (e) { audit_id = undefined; }
if (!audit_id) throw new Error('Build Findings Payload: no audit_id returned by Upsert Audit (Node 13).');

let findings = [];
try { findings = $('Decision Engine').first().json.findings || []; } catch (e) { findings = []; }

// FIX (19 Aug, external programmer review): finding_key used to be whatever
// string the AI itself proposed — shown to it only as ONE EXAMPLE VALUE in
// the schema (A2_build_prompt.js), never instructed to keep it stable across
// re-runs. Confirmed live: the same fixture, re-audited 4 times, produced 17
// findings rows, all 17 distinct finding_keys — e.g. the same emergency-
// number-context issue as "ai-find-03-111-999-no-context" on one run and
// "ai-find-03-111-999-unexplained" on the next. ON CONFLICT (audit_id,
// finding_key) can never fire when the key is never the same twice, so
// "idempotent re-runs" (workflow_spec.md line 178) was false in practice for
// every AI-sourced finding, silently accumulating rows on re-audit.
// Fixed by computing finding_key here, deterministically, from fields the
// AI already must supply correctly under the existing evidence-verification
// requirement — never from AI-invented text. Automated findings already
// carry stable, hand-crafted keys (auto-1.1.1-img-alt etc.) and are left
// untouched. For AI findings: a criterion/instrument-item prefix (human-
// readable, traces back to what was checked) plus a short hash of the
// normalised evidence quote (or title, if evidence is ever missing) as the
// uniqueness suffix — same underlying issue, same quoted text, same key,
// regardless of how the AI phrases its own slug that run; two genuinely
// different findings against the same criterion get different quotes and
// so different keys, no collision.
const crypto = require('crypto');
const stableAiKey = (f) => {
  const parts = [];
  if (f.wcag_criterion) parts.push(String(f.wcag_criterion));
  if (f.instrument) parts.push(String(f.instrument).toLowerCase() + (f.instrument_item ?? ''));
  const base = parts.length ? parts.join('-') : 'general';
  const basis = String(f.evidence || f.title || f.explanation_plain || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const hash = crypto.createHash('sha256').update(basis).digest('hex').slice(0, 10);
  return `ai-${base}-${hash}`;
};
// Computed inline in the row-building step below (not as a separate mutate-
// then-read pass over `findings`) — deliberately, after the first live
// deploy of this fix produced no observable change: a two-step mutate/read
// is more fragile across whatever process boundary n8n's Code-node runner
// uses for cross-node $() references than a single-pass computation, and
// there is no reason to prefer the two-step version.

const numOrNull = (v) => (v === null || v === undefined || Number.isNaN(v) ? null : Number(v));

// The model sometimes emits the STRING "null" instead of JSON null (observed
// 4 Aug on findings ai-010/018/019). Left unhandled, "null" reaches Postgres
// and violates findings_instrument_check / chk_instrument_pair. See D-27.
const strOrNull = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return (s === '' || s.toLowerCase() === 'null') ? null : s;
};

const rows = findings.map((f) => ({
  audit_id,
  finding_key: f.source === 'ai' ? stableAiKey(f) : f.finding_key,
  source: f.source,
  wcag_criterion: strOrNull(f.wcag_criterion),
  wcag_level: strOrNull(f.wcag_level),
  instrument: strOrNull(f.instrument),
  instrument_item: numOrNull(f.instrument_item),
  category: f.category,
  severity: f.severity,
  confidence: numOrNull(f.confidence) ?? 1,
  title: f.title,
  explanation_plain: f.explanation_plain,
  recommendation: f.recommendation,
  evidence: f.evidence ?? null,
  evidence_verified: f.evidence_verified ?? (f.source === 'automated'),
  human_review_required: !!f.severity_upgraded_by || f.severity === 'critical',
  review_reason: f.severity_upgraded_by ?? null,
  original_severity: f.original_severity ?? null,
  severity_upgraded_by: f.severity_upgraded_by ?? null,
}));

// FIX (rigorous review, 19 Aug, after D-80): stableAiKey() can collide
// WITHIN a single run's own payload — reproduced with two distinct AI
// findings, no instrument mapping, same wcag_criterion, quoting the
// identical evidence sentence for two different reasons (e.g. one sentence
// naming two separate unexplained terms, each its own finding under 3.1.3).
// Left alone, both rows reach Insert Findings with the same
// (audit_id, finding_key) in one INSERT, and Postgres's
// ON CONFLICT DO UPDATE throws "cannot affect row a second time" —
// failing the whole findings insert for the audit, not just the duplicate
// row. Disambiguated by a hash of the finding's own title, not by array
// position, so a future run producing the same two titles lands on the
// same disambiguated key again rather than a fresh one each time; the
// common (non-colliding) case is untouched, keeping stableAiKey()'s
// evidence-only cross-run convergence exactly as before.
const seenAiKeys = new Set();
for (const r of rows) {
  if (r.source !== 'ai') continue;
  if (!seenAiKeys.has(r.finding_key)) { seenAiKeys.add(r.finding_key); continue; }
  const base = r.finding_key;
  const tieBreak = crypto.createHash('sha256').update(String(r.title || '').toLowerCase().trim()).digest('hex').slice(0, 6);
  let candidate = `${base}-${tieBreak}`;
  let n = 1;
  while (seenAiKeys.has(candidate)) candidate = `${base}-${tieBreak}-${++n}`;
  r.finding_key = candidate;
  seenAiKeys.add(candidate);
}

// schema constraint chk_instrument_pair: instrument and item must both be set
// or both null. Fail loudly here rather than as an opaque Postgres error.
for (const r of rows) {
  if ((r.instrument === null) !== (r.instrument_item === null)) {
    throw new Error(`Build Findings Payload: finding "${r.finding_key}" names an instrument without an item (or vice versa); violates chk_instrument_pair.`);
  }
}

return [{ json: { findings_payload: JSON.stringify(rows), findings_count: rows.length, audit_id } }];
