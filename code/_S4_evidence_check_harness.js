const fs = require('fs');
const code = fs.readFileSync('/tmp/validate_output.js', 'utf8');

const CONTENT = "Taking your water tablet\n\nYour doctor has prescribed furosemide, sometimes called a water tablet. Take one tablet each morning with a glass of water.\n\nTell your practice nurse if you feel dizzy when you stand up.";

const aiResponse = {
  schema_version: "2.0",
  analysis_status: "ok",
  summary: "S4 injection test: one verifiable finding and one fabricated finding.",
  findings: [
    { finding_key: "s4-real-quote", wcag_criterion: "3.1.3", wcag_level: "AAA",
      category: "understandable", instrument: "PEMAT", instrument_item: 4,
      severity: "medium", confidence: 0.9,
      title: "Real quote - should survive",
      explanation_plain: "This finding quotes the source material verbatim.",
      recommendation: "Keep this finding.",
      evidence: "Take one tablet each morning with a glass of water." },
    { finding_key: "s4-fabricated-quote", wcag_criterion: "3.1.3", wcag_level: "AAA",
      category: "understandable", instrument: "PEMAT", instrument_item: 4,
      severity: "critical", confidence: 0.95,
      title: "Fabricated quote - should be dropped",
      explanation_plain: "This finding quotes text that does not appear in the source.",
      recommendation: "This finding must not reach the database.",
      evidence: "Always double your dose if you miss a day." }
  ],
  instrument_items: [],
  positive_observations: []
};

// Contract updated 12 Aug 2026 (Sprint-Schritt 4-5): A4 no longer resolves
// content_text/deterministic_items/attempt via $('Build Prompt') — it was
// extracted into its own subworkflow (SUB-A_Validate-dev) and now takes
// everything as explicit input on the same item as the AI response, the
// same way the canvas Set-node "Prep Validate Input" assembles it before
// the real Execute-Workflow call. No $ shim is needed anymore at all.
const item = Object.assign({}, aiResponse, {
  content_text: CONTENT,
  deterministic_items: {},
  attempt: 1,
  allow_repair: true,
});

const $input = { all: () => [{ json: item }] };

const runner = new Function('$input', code + '\n');
const out = runner($input);
const r = Array.isArray(out) ? out[0].json : out.json;

console.log('valid                :', r.valid);
console.log('api_error            :', r.api_error);
console.log('next_action          :', r.next_action);
console.log('dropped_unverified   :', r.dropped_unverified);
console.log('findings surviving   :', r.analysis.findings.length);
console.log('surviving keys       :', r.analysis.findings.map(f => f.finding_key).join(', ') || '(none)');
console.log('surviving severities :', r.analysis.findings.map(f => f.severity).join(', ') || '(none)');
console.log('evidence_verified    :', r.analysis.findings.map(f => f.evidence_verified).join(', '));
console.log('missing_items_count  :', r.missing_items_count);
console.log('errors               :', JSON.stringify(r.errors));
