const pptxgen = require("pptxgenjs");
const path = require("path");

const SS = "/sessions/gifted-fervent-clarke/mnt/a11yaudit/screenshots/";

const INK    = "111111";
const PAPER  = "FFFFFF";
const GREY   = "767676";
const HAIR   = "DCDCDC";
const ACCENT = "C6381A";
const F      = "Avenir Next";   // geometric sans in the Montserrat family; ships with macOS

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";           // 10 x 5.625
pres.author = "Claudia Bassier";
pres.title  = "A11yAudit";

const W = 10, H = 5.625;
const M = 0.62;                         // side margin
const CW = W - 2 * M;                   // content width 8.76

let n = 0;
const TOTAL = 12;

// sheet-number motif: architectural drawing index, top-left
function sheet(s, label, dark) {
  n += 1;
  const c = dark ? "8C8C8C" : GREY;
  s.addText(String(n).padStart(2, "0") + "  " + label.toUpperCase(), {
    x: M, y: 0.3, w: CW, h: 0.24,
    fontFace: F, fontSize: 9, bold: true, color: c,
    charSpacing: 2.4, margin: 0, valign: "middle"
  });
  s.addText(String(n).padStart(2, "0") + " / " + TOTAL, {
    x: W - M - 1.2, y: H - 0.52, w: 1.2, h: 0.24,
    fontFace: F, fontSize: 8, color: c, align: "right",
    charSpacing: 1.2, margin: 0, valign: "middle"
  });
}

function slide(dark) {
  const s = pres.addSlide();
  s.background = { color: dark ? INK : PAPER };
  return s;
}

// appendix sheet: labelled, not numbered, so the deck still reads as 12 slides
function sheetAppendix(s, label) {
  s.addText("APPENDIX  " + label.toUpperCase(), {
    x: M, y: 0.3, w: CW, h: 0.24,
    fontFace: F, fontSize: 9, bold: true, color: GREY,
    charSpacing: 2.4, margin: 0, valign: "middle"
  });
  s.addText("APPENDIX", {
    x: W - M - 1.2, y: H - 0.52, w: 1.2, h: 0.24,
    fontFace: F, fontSize: 8, color: GREY, align: "right",
    charSpacing: 1.2, margin: 0, valign: "middle"
  });
}

/* ─────────────────────────── 01 · TITLE ─────────────────────────── */
{
  const s = slide(true);
  sheet(s, "Turing College · AI Capstone · Case 3", true);

  s.addText("A11yAudit", {
    x: M, y: 1.72, w: CW, h: 1.15,
    fontFace: F, fontSize: 66, bold: true, color: PAPER,
    charSpacing: -1.2, margin: 0, valign: "middle"
  });
  s.addText("AI-assisted accessibility and health-literacy\nscreening for digital health content", {
    x: M, y: 2.98, w: 6.4, h: 0.92,
    fontFace: F, fontSize: 16, color: "B4B4B4",
    lineSpacing: 24, margin: 0, valign: "top"
  });
  s.addText("The AI proposes.  Deterministic rules dispose.", {
    x: M, y: 4.18, w: 6.6, h: 0.34,
    fontFace: F, fontSize: 12, bold: true, color: ACCENT,
    charSpacing: 0.6, margin: 0, valign: "middle"
  });
  s.addText("Claudia Bassier   ·   August 2026", {
    x: M, y: H - 0.55, w: 5.0, h: 0.28,
    fontFace: F, fontSize: 10, color: "8C8C8C", margin: 0, valign: "middle"
  });
  s.addNotes("Do not read this slide aloud. Go straight to the BD sentence. If someone asks about the name: a11y is the standard numeronym for accessibility, the same construction as i18n for internationalisation, and it is pronounced ally. That reading is deliberate in the field: being an ally to disabled people.");
}

/* ─────────────────────── 02 · THE FINDING ───────────────────────── */
{
  const s = slide(false);
  sheet(s, "The problem, in one line of a leaflet", false);

  s.addText("“Take 1 tablet BD.”", {
    x: M, y: 0.88, w: 5.2, h: 0.7,
    fontFace: F, fontSize: 30, bold: true, color: INK,
    charSpacing: -0.5, margin: 0, valign: "middle"
  });
  s.addText([
    { text: "Latin: bis die, twice a day.\n", options: { bold: true, color: INK } },
    { text: "Nothing on the page says so.", options: { color: GREY } }
  ], {
    x: M, y: 1.66, w: 4.95, h: 0.62,
    fontFace: F, fontSize: 12, lineSpacing: 18, margin: 0, valign: "top"
  });
  s.addText([
    { text: "63%", options: { bold: true, color: ACCENT } },
    { text: " of patients with low literacy, and ", options: { color: INK } },
    { text: "38%", options: { bold: true, color: ACCENT } },
    { text: " with adequate literacy, misunderstood ordinary prescription dosing instructions. One of six named causes: implicit rather than explicit dosing intervals.", options: { color: INK } }
  ], {
    x: M, y: 2.36, w: 4.95, h: 0.92,
    fontFace: F, fontSize: 10.5, lineSpacing: 15, margin: 0, valign: "top"
  });
  s.addText("Wolf et al. 2007, Patient Educ Couns 67(3):293–300 · 395 patients", {
    x: M, y: 3.3, w: 4.95, h: 0.24,
    fontFace: F, fontSize: 8, color: GREY, margin: 0, valign: "middle"
  });
  s.addText("An accessibility checker finds real faults here. Mine found eight. But none of them is the sentence that could get someone hurt. Checkers read markup, not meaning.", {
    x: M, y: 3.62, w: 4.95, h: 0.72,
    fontFace: F, fontSize: 10.5, color: INK, lineSpacing: 15, margin: 0, valign: "top"
  });
  s.addText("CRITICAL · CONFIDENCE 0.99 · PEMAT ITEM 4 · EVIDENCE VERIFIED", {
    x: M, y: 4.46, w: 5.1, h: 0.28,
    fontFace: F, fontSize: 7.5, bold: true, color: ACCENT,
    charSpacing: 0.6, margin: 0, valign: "middle"
  });

  // ss11 1075x785 → 1.37 ; w 3.55 → h 2.59
  s.addImage({ path: SS + "ss11_review_queue.png", x: 5.86, y: 1.28, w: 3.52, h: 2.57 });
  s.addText("The finding this system produced, in the review queue.", {
    x: 5.86, y: 3.96, w: 3.52, h: 0.5,
    fontFace: F, fontSize: 9, color: GREY, lineSpacing: 13, margin: 0, valign: "top"
  });
  s.addNotes("The hook. Say the sentence, pause, then the number. Name the eight faults aloud (no image description, no page language, a heading level skipped) because the slide only says eight. Do NOT say patients read BD as bedtime. That claim is unsupported and inverted relative to ISMP; see decision_log D-43.");
}

/* ───────────────────────── 03 · THE GAP ─────────────────────────── */
{
  const s = slide(false);
  sheet(s, "Two families of tools. Neither closes the gap", false);

  s.addText("Nothing joins markup to meaning.", {
    x: M, y: 0.86, w: CW, h: 0.6,
    fontFace: F, fontSize: 30, bold: true, color: INK,
    charSpacing: -0.5, margin: 0, valign: "middle"
  });

  const col = [
    ["ACCESSIBILITY CHECKERS", "axe · WAVE · Lighthouse", "Test markup well. Reduce language to a readability grade. Cannot see that “BD” is a dosing instruction."],
    ["HEALTH-LITERACY INSTRUMENTS", "PEMAT-P (AHRQ) · CDC Clear Communication Index", "Assess language properly, item by item. Manual rubrics: a trained human rater, one document at a time."],
    ["A11YAUDIT", "This project", "Both in one automated pass, stored in Postgres so results can be compared across pages over time."]
  ];
  const cw = 2.68, gap = 0.42;
  col.forEach((c, i) => {
    const x = M + i * (cw + gap);
    const isUs = i === 2;
    if (isUs) s.addShape(pres.ShapeType.rect, { x: x - 0.22, y: 1.6, w: cw + 0.44, h: 2.42, fill: { color: "F4F4F4" }, line: { color: "F4F4F4" } });
    s.addText(c[0], {
      x, y: 1.78, w: cw, h: 0.5,
      fontFace: F, fontSize: 9.5, bold: true, color: isUs ? ACCENT : INK,
      charSpacing: 1.0, lineSpacing: 13, margin: 0, valign: "top"
    });
    s.addText(c[1], {
      x, y: 2.3, w: cw, h: 0.4,
      fontFace: F, fontSize: 10, color: GREY, lineSpacing: 14, margin: 0, valign: "top"
    });
    s.addText(c[2], {
      x, y: 2.82, w: cw, h: 1.1,
      fontFace: F, fontSize: 11, color: INK, lineSpacing: 17, margin: 0, valign: "top"
    });
  });

  s.addText("A report, not accessible content.   ·   The literacy demand of the material, not anyone’s health literacy.   ·   No conformance claim.", {
    x: M, y: 4.5, w: CW, h: 0.34,
    fontFace: F, fontSize: 9.5, color: GREY, margin: 0, valign: "middle"
  });
  s.addNotes("The bottom line repeats slide 11. If you are running long, say it here OR there, not both.");
}

/* ─────────────────────── 04 · ARCHITECTURE ──────────────────────── */
{
  const s = slide(false);
  sheet(s, "How it works", false);

  s.addText("Twenty nodes. One AI call.", {
    x: M, y: 0.8, w: 8.6, h: 0.56,
    fontFace: F, fontSize: 24, bold: true, color: INK,
    charSpacing: -0.5, margin: 0, valign: "middle"
  });

  const steps = [
    ["FORM", "URL or pasted text"],
    ["DETERMINISTIC CHECKS", "9 WCAG criteria · no AI"],
    ["SAFETY PRESCREEN", "regex · dosing, emergency, risk"],
    ["AI ANALYSIS", "one call · temp 0 · schema-validated"],
    ["DECISION ENGINE", "4 scores · 9 hard rules"],
    ["POSTGRES → REPORT", "audits · findings · statement"]
  ];
  steps.forEach((st, i) => {
    const y = 1.52 + i * 0.48;
    const hot = i === 1 || i === 2;
    s.addText(String(i + 1), {
      x: M, y, w: 0.3, h: 0.34,
      fontFace: F, fontSize: 10, bold: true, color: hot ? ACCENT : "BFBFBF", margin: 0, valign: "middle"
    });
    s.addText(st[0], {
      x: M + 0.34, y, w: 2.1, h: 0.34,
      fontFace: F, fontSize: 9, bold: true, color: INK, charSpacing: 0.3, margin: 0, valign: "middle"
    });
    s.addText(st[1], {
      x: M + 2.42, y, w: 2.05, h: 0.34,
      fontFace: F, fontSize: 8.5, color: GREY, margin: 0, valign: "middle"
    });
  });

  // ss04 2548x1346 → 1.893 ; w 4.28 → h 2.26
  s.addImage({ path: SS + "ss04_wf1_canvas.png", x: 5.14, y: 1.42, w: 4.24, h: 2.24 });
  s.addText("WF1 - Audit Intake. Self-hosted n8n + Postgres 16 in Docker,\non local hardware. 20 nodes here, 12 in the AI subworkflow, 3 in the error handler.", {
    x: 5.14, y: 3.76, w: 4.24, h: 0.66,
    fontFace: F, fontSize: 9, color: GREY, lineSpacing: 13, margin: 0, valign: "top"
  });

  s.addText("Evidence verification: every finding must quote the page verbatim, and the quote is checked in code. A finding whose evidence cannot be located is discarded before the database, with no retry.", {
    x: M, y: 4.62, w: CW, h: 0.5,
    fontFace: F, fontSize: 9, color: INK, lineSpacing: 13, margin: 0, valign: "top"
  });
  s.addNotes("Trace the pipeline with the cursor while you speak. Land hard on this: the checks and the safety search run BEFORE the AI. That ordering is what makes slides 7 and 8 possible.");
}

/* ───────────────────── 05 · THE PRINCIPLE ───────────────────────── */
{
  const s = slide(true);
  sheet(s, "The design principle", true);

  s.addText("The AI proposes.", {
    x: M, y: 1.5, w: CW, h: 0.82,
    fontFace: F, fontSize: 38, bold: true, color: PAPER, charSpacing: -0.8, margin: 0, valign: "middle"
  });
  s.addText("Deterministic rules dispose.", {
    x: M, y: 2.32, w: CW, h: 0.82,
    fontFace: F, fontSize: 38, bold: true, color: ACCENT, charSpacing: -0.8, margin: 0, valign: "middle"
  });
  s.addText("Scoring, escalation and the routing of safety-critical content to a human reviewer are fixed rules. They fire whether or not the AI answers at all. Nothing on the safety path depends on the AI being correct.", {
    x: M, y: 3.5, w: 8.4, h: 0.9,
    fontFace: F, fontSize: 11, color: "B4B4B4", lineSpacing: 17, margin: 0, valign: "top"
  });
  s.addNotes("Slow down. This is the sentence the whole system is built to earn.");
}

/* ───────────────────────── 06 · RESULTS ─────────────────────────── */
{
  const s = slide(false);
  sheet(s, "Result: the demo pair", false);

  s.addText("Same clinical content, rewritten.", {
    x: M, y: 0.84, w: CW, h: 0.56,
    fontFace: F, fontSize: 27, bold: true, color: INK, charSpacing: -0.5, margin: 0, valign: "middle"
  });

  s.addText("52", {
    x: M, y: 1.6, w: 1.6, h: 1.1,
    fontFace: F, fontSize: 76, bold: true, color: "BFBFBF", charSpacing: -2, margin: 0, valign: "middle"
  });
  s.addText("→", {
    x: M + 1.55, y: 1.6, w: 0.7, h: 1.1,
    fontFace: F, fontSize: 26, color: "BFBFBF", margin: 0, valign: "middle", align: "center"
  });
  s.addText("100", {
    x: M + 2.2, y: 1.6, w: 2.3, h: 1.1,
    fontFace: F, fontSize: 76, bold: true, color: ACCENT, charSpacing: -2, margin: 0, valign: "middle"
  });
  s.addText("DETERMINISTIC SCREENING SCORE · REPRODUCIBLE", {
    x: M, y: 2.74, w: 4.7, h: 0.28,
    fontFace: F, fontSize: 8, bold: true, color: GREY, charSpacing: 0.5, margin: 0, valign: "middle"
  });
  s.addText("Verified byte-identical across runs. Both values were written down on 31 July from standalone engine runs, before the pipeline existed; the assembled system reproduced them exactly.", {
    x: M, y: 3.14, w: 4.6, h: 1.0,
    fontFace: F, fontSize: 9.5, color: INK, lineSpacing: 14, margin: 0, valign: "top"
  });

  const rows = [
    ["", "POOR", "CORRECTED"],
    ["Automated findings", "8", "0"],
    ["Deterministic instrument items", "5 of 8 fail", "8 of 8 pass"],
    ["PEMAT-informed understandability", "28.6", "92.9"],
    ["PEMAT-informed actionability", "33.3", "100"],
    ["CCI-informed", "22.2", "88.2"]
  ];
  s.addTable(rows.map((r, i) => r.map((c, j) => ({
    text: c,
    options: {
      fontFace: F, fontSize: i === 0 ? 8 : 9.5,
      bold: i === 0, color: i === 0 ? GREY : (j === 2 ? INK : GREY),
      charSpacing: i === 0 ? 0.9 : 0,
      align: j === 0 ? "left" : "right",
      valign: "middle"
    }
  }))), {
    x: 5.28, y: 1.6, w: 4.1, colW: [2.25, 0.85, 1.0],
    rowH: 0.33, border: { type: "solid", color: HAIR, pt: 0.5 },
    margin: [2, 4, 2, 0]
  });
  s.addText("The AI-dependent subscores move with it: reported, but not called reproducible.", {
    x: 5.28, y: 3.72, w: 4.1, h: 0.44,
    fontFace: F, fontSize: 9, color: GREY, lineSpacing: 13, margin: 0, valign: "top"
  });
  s.addNotes("Quote the deterministic score: 52 to 100. Never quote the combined score's verbal label.");
}

/* ──────────────── 07 · STILL ROUTES TO A HUMAN ──────────────────── */
{
  const s = slide(false);
  sheet(s, "The result that matters", false);

  s.addText("It scores 100. It is well written.\nIt still goes to a human.", {
    x: M, y: 0.88, w: 8.7, h: 1.1,
    fontFace: F, fontSize: 29, bold: true, color: INK,
    charSpacing: -0.6, lineSpacing: 37, margin: 0, valign: "middle"
  });

  // ss10 2192x219 → 10.01 ; w 8.76 → h 0.875
  s.addImage({ path: SS + "ss10_audit_row.png", x: M, y: 2.42, w: CW, h: 0.875 });
  s.addText("The corrected page’s database row: understandability 92.9, actionability 100, CCI-informed 88.2, and status  needs_review  anyway.", {
    x: M, y: 3.38, w: CW, h: 0.3,
    fontFace: F, fontSize: 9, color: GREY, margin: 0, valign: "middle"
  });

  s.addText([
    { text: "Because it is still medication content. ", options: { color: INK } },
    { text: "Rule R7 fires from the safety prescreen, which is regular expressions, and which runs before the AI is ever called. ", options: { color: INK } },
    { text: "A good score cannot buy a page out of review.", options: { color: ACCENT, bold: true } }
  ], {
    x: M, y: 3.86, w: 8.6, h: 0.86,
    fontFace: F, fontSize: 11, lineSpacing: 17, margin: 0, valign: "top"
  });
  s.addText("The tool discriminates on quality, and does not trade safety for quality.", {
    x: M, y: 4.84, w: CW, h: 0.3,
    fontFace: F, fontSize: 9, bold: true, color: GREY, margin: 0, valign: "middle"
  });
  s.addNotes("Never cut this slide. It is the single best moment in the talk.");
}

/* ──────────────────── 08 · WHEN THE AI DIES ─────────────────────── */
{
  const s = slide(false);
  sheet(s, "Failure path: E11, AI unreachable", false);

  s.addText("I made the AI unreachable.\nThe audit completed anyway.", {
    x: M, y: 0.84, w: 5.7, h: 1.06,
    fontFace: F, fontSize: 23, bold: true, color: INK,
    charSpacing: -0.4, lineSpacing: 31, margin: 0, valign: "middle"
  });

  s.addText("732", {
    x: 6.5, y: 0.86, w: 2.9, h: 0.86,
    fontFace: F, fontSize: 62, bold: true, color: ACCENT, charSpacing: -2,
    margin: 0, valign: "middle", align: "right"
  });
  s.addText("MILLISECONDS, INVALID API KEY", {
    x: 6.5, y: 1.74, w: 2.9, h: 0.26,
    fontFace: F, fontSize: 8, bold: true, color: GREY, charSpacing: 0.9,
    margin: 0, valign: "middle", align: "right"
  });

  // ss17 2546x239 → 10.65 ; w 8.76 → h 0.82
  s.addImage({ path: SS + "ss17_e11_fallback.png", x: M, y: 2.26, w: CW, h: 0.82 });
  s.addText("R2 and R7 firing with the AI dead · instrument subscores null · completed_at empty.", {
    x: M, y: 3.16, w: CW, h: 0.3,
    fontFace: F, fontSize: 9, color: GREY, margin: 0, valign: "middle"
  });

  s.addText([
    { text: "It recorded that the AI had failed, fired R2, and routed to human review. It also fired ", options: { color: INK } },
    { text: "R7", options: { color: ACCENT, bold: true } },
    { text: ", because the prescreen runs before the AI and identified the dosing and emergency language by itself.\n", options: { color: INK } },
    { text: "With the model entirely dead, the system still refused to pass medication content through unreviewed.", options: { color: INK, bold: true } }
  ], {
    x: M, y: 3.62, w: 8.7, h: 1.2,
    fontFace: F, fontSize: 10.5, lineSpacing: 16, margin: 0, valign: "top"
  });
  s.addNotes("Two runs on one slide: the AI killed (732 ms, still escalated), then the three-run variation on slide 9. Do not rush the second one. It is the honesty.");
}

/* ────────────────── 09 · MEASURED AI VARIANCE ───────────────────── */
{
  const s = slide(false);
  sheet(s, "The measurement that cost me a claim", false);

  s.addText("Same page. Three runs. Temperature 0.", {
    x: M, y: 0.84, w: CW, h: 0.56,
    fontFace: F, fontSize: 27, bold: true, color: INK, charSpacing: -0.5, margin: 0, valign: "middle"
  });

  ["42", "72", "65"].forEach((v, i) => {
    const x = M + i * 1.62;
    s.addText(v, {
      x, y: 1.56, w: 1.45, h: 1.0,
      fontFace: F, fontSize: 62, bold: true, color: ACCENT, charSpacing: -2, margin: 0, valign: "middle"
    });
    s.addText("RUN " + (i + 1), {
      x, y: 2.54, w: 1.45, h: 0.24,
      fontFace: F, fontSize: 8, bold: true, color: GREY, charSpacing: 0.9, margin: 0, valign: "middle"
    });
  });

  s.addText("COMBINED SCREENING SCORE · BYTE-IDENTICAL CONTENT", {
    x: M, y: 2.92, w: 5.0, h: 0.26,
    fontFace: F, fontSize: 8, bold: true, color: GREY, charSpacing: 0.9, margin: 0, valign: "middle"
  });
  s.addText("Rule R4 fires below 70. It fired, did not fire, then fired again. The drift is large enough to move a page across a deterministic threshold.", {
    x: M, y: 3.24, w: 4.75, h: 0.8,
    fontFace: F, fontSize: 10, color: INK, lineSpacing: 15, margin: 0, valign: "top"
  });

  s.addShape(pres.ShapeType.rect, { x: 5.5, y: 1.5, w: 3.88, h: 2.42, fill: { color: "F4F4F4" }, line: { color: "F4F4F4" } });
  s.addText("WHAT DID NOT MOVE", {
    x: 5.74, y: 1.72, w: 3.4, h: 0.26,
    fontFace: F, fontSize: 8.5, bold: true, color: ACCENT, charSpacing: 1.0, margin: 0, valign: "middle"
  });
  s.addText([
    { text: "Deterministic score: 100, all three runs.", options: { breakLine: true, bullet: true } },
    { text: "Safety prescreen returned the same terms.", options: { breakLine: true, bullet: true } },
    { text: "Routed to a human every single time.", options: { bullet: true } }
  ], {
    x: 5.74, y: 2.04, w: 3.42, h: 1.15,
    fontFace: F, fontSize: 9.5, color: INK, lineSpacing: 14, paraSpaceAfter: 4, margin: 0, valign: "top"
  });
  s.addText("So I cannot claim reproducible AI analysis, and I don’t.", {
    x: 5.74, y: 3.32, w: 3.42, h: 0.46,
    fontFace: F, fontSize: 9.5, bold: true, color: INK, lineSpacing: 13, margin: 0, valign: "top"
  });

  s.addText("The measurement weakened the claim and improved the system: the score is now reported as two numbers, one reproducible and one not, labelled as such in every report.", {
    x: M, y: 4.34, w: CW, h: 0.44,
    fontFace: F, fontSize: 10, color: GREY, lineSpacing: 15, margin: 0, valign: "top"
  });
  s.addNotes("Never cut. This is the honesty the whole project rests on.");
}

/* ───────────── 10 · WHAT THE TESTS DID NOT CATCH ────────────────── */
{
  const s = slide(false);
  sheet(s, "What I learned", false);

  s.addText("Every test passed. Three defects\nturned up anyway.", {
    x: M, y: 0.8, w: 8.6, h: 1.0,
    fontFace: F, fontSize: 25, bold: true, color: INK,
    charSpacing: -0.5, lineSpacing: 33, margin: 0, valign: "middle"
  });
  s.addText("All three were found by reading the output, not by a test failing.", {
    x: M, y: 1.86, w: 8.0, h: 0.28,
    fontFace: F, fontSize: 11.5, color: ACCENT, bold: true, margin: 0, valign: "middle"
  });

  const items = [
    ["A misclassified error label", "n8n discards everything before the first colon in a Code-node error message."],
    ["A score of 100 on an unexamined page", "No markup to check, AI dead: zero checks found zero problems."],
    ["A prescreen that knew 112 and 911", "But not the UK’s 999 and 111. Invisible to every test I had written."]
  ];
  items.forEach((it, i) => {
    const y = 2.28 + i * 0.78;
    s.addText(String(i + 1).padStart(2, "0"), {
      x: M, y, w: 0.4, h: 0.28,
      fontFace: F, fontSize: 10.5, bold: true, color: "BFBFBF", margin: 0, valign: "middle"
    });
    s.addText(it[0], {
      x: M + 0.42, y, w: 3.85, h: 0.28,
      fontFace: F, fontSize: 11, bold: true, color: INK, margin: 0, valign: "middle"
    });
    s.addText(it[1], {
      x: M + 0.42, y: y + 0.28, w: 3.85, h: 0.42,
      fontFace: F, fontSize: 9, color: GREY, lineSpacing: 12, margin: 0, valign: "top"
    });
  });

  // decision-log density panel: replaces scrolling the file live
  s.addShape(pres.ShapeType.rect, { x: 5.28, y: 2.2, w: 4.1, h: 2.4, fill: { color: "F4F4F4" }, line: { color: "F4F4F4" } });
  s.addText("DECISION LOG: 45 ENTRIES", {
    x: 5.5, y: 2.36, w: 3.7, h: 0.22,
    fontFace: F, fontSize: 8, bold: true, color: ACCENT, charSpacing: 1.0, margin: 0, valign: "middle"
  });
  const log = [
    ["D-02", "Deterministic checks in addition to AI", 0],
    ["D-06", "Safety prescreen runs before the AI call", 0],
    ["D-11", "Claims corrected during design", 1],
    ["D-18", "Pre-build review: 8 defects in my own code", 1],
    ["D-20", "Schedule slip: all Tier 2 scope cut", 0],
    ["D-30", "Two identical runs are not identical", 1],
    ["D-32", "The headline score was mostly AI opinion", 1],
    ["D-34", "The documents described a feature never built", 1],
    ["D-36", "Score said 100 for an unassessed page", 1],
    ["D-37", "Reading the report found a gap no test had", 1],
    ["D-39", "What a full sweep of the folder found", 1],
    ["D-41", "A claim that was one word too strong", 1],
    ["D-43", "The opening line was wrong, and inverted", 1],
    ["D-45", "A fourth false claim, and a check to catch the next", 1]
  ];
  const runs = [];
  log.forEach((l, i) => {
    runs.push({ text: l[0] + "  ", options: { bold: true, color: l[2] ? ACCENT : "9A9A9A" } });
    runs.push({ text: l[1], options: { color: l[2] ? INK : GREY, breakLine: true } });
  });
  runs.push({ text: "…and 31 more", options: { color: "9A9A9A", italic: true } });
  s.addText(runs, {
    x: 5.5, y: 2.62, w: 3.7, h: 1.82,
    fontFace: F, fontSize: 7.2, lineSpacing: 9.4, margin: 0, valign: "top"
  });

  s.addText("Tests confirm what you thought to specify. They are silent about what you didn’t.", {
    x: M, y: 4.74, w: CW, h: 0.3,
    fontFace: F, fontSize: 11, bold: true, color: INK, margin: 0, valign: "middle"
  });
  s.addNotes("The panel on the right replaces scrolling the decision log live. The point is how dense it is, not reading it. Red entries are claims I had to correct. Say: 'forty-three entries; the ones in red are claims I had to take back.'");
}

/* ───────────────────── 11 · WHAT IT IS NOT ──────────────────────── */
{
  const s = slide(false);
  sheet(s, "The limits, stated plainly", false);

  s.addText("What it is not.", {
    x: M, y: 0.84, w: CW, h: 0.56,
    fontFace: F, fontSize: 27, bold: true, color: INK, charSpacing: -0.5, margin: 0, valign: "middle"
  });

  const lim = [
    ["No conformance claim", "A listed subset of WCAG 2.2. Colour contrast, keyboard operation, focus order, media and JavaScript-rendered content are out of scope."],
    ["An unvalidated adaptation", "PEMAT-informed and CCI-informed, never a PEMAT score. Built for trained human raters. Neither AHRQ nor CDC endorses this tool."],
    ["Accuracy is unmeasured", "No comparison against expert human auditors was run. The database is structured so a false-positive rate can be derived. That is the next project."],
    ["A known defect I chose not to fix", "Pasted text plus a dead AI means nothing is screened, and the score reads 100. Documented as D-36. Safety never depended on it."]
  ];
  lim.forEach((l, i) => {
    const x = M + (i % 2) * 4.52;
    const y = 1.56 + Math.floor(i / 2) * 1.44;
    s.addText(l[0], {
      x, y, w: 4.24, h: 0.3,
      fontFace: F, fontSize: 12.5, bold: true, color: i === 3 ? ACCENT : INK, margin: 0, valign: "middle"
    });
    s.addText(l[1], {
      x, y: y + 0.32, w: 4.24, h: 0.86,
      fontFace: F, fontSize: 10.5, color: GREY, lineSpacing: 16, margin: 0, valign: "top"
    });
  });

  s.addText("Raised here rather than left to be found. These limits are part of the design, not gaps in it.", {
    x: M, y: 4.62, w: CW, h: 0.3,
    fontFace: F, fontSize: 9.5, bold: true, color: INK, margin: 0, valign: "middle"
  });
  s.addNotes("Never cut. Naming your own limits first is what makes the rest credible.");
}

/* ───────────────────────── 12 · CLOSE ───────────────────────────── */
{
  const s = slide(true);
  sheet(s, "Close", true);

  s.addText("The prompt is the least\nimportant part.", {
    x: M, y: 1.22, w: 8.6, h: 1.3,
    fontFace: F, fontSize: 34, bold: true, color: PAPER,
    charSpacing: -0.7, lineSpacing: 43, margin: 0, valign: "middle"
  });
  s.addText("What matters is the layering around an unreliable component: prescreen before, evidence verification after, deterministic rules that hold when the AI is absent. So that when the clever part fails, the system is still correct.", {
    x: M, y: 2.82, w: 8.6, h: 0.96,
    fontFace: F, fontSize: 11.5, color: "B4B4B4", lineSpacing: 18, margin: 0, valign: "top"
  });

  s.addText("Thank you.", {
    x: M, y: 4.06, w: 3.0, h: 0.42,
    fontFace: F, fontSize: 16, bold: true, color: ACCENT, margin: 0, valign: "middle"
  });
  s.addText("readme.md  ·  decision_log.md, 41 entries  ·  demo_output/  ·  screenshots/", {
    x: M, y: 4.62, w: 8.4, h: 0.3,
    fontFace: F, fontSize: 9.5, color: "8C8C8C", margin: 0, valign: "middle"
  });
  s.addNotes("Mention: the AI is in the product AND in the build; the system prompt is published in meta/. Then stop and take questions.");
}

/* ─────────────────── APPENDIX · GLOSSARY ────────────────────────── */
{
  const s = slide(false);
  sheetAppendix(s, "Glossary");

  s.addText("Glossary", {
    x: M, y: 0.78, w: CW, h: 0.5,
    fontFace: F, fontSize: 24, bold: true, color: INK,
    charSpacing: -0.5, margin: 0, valign: "middle"
  });
  s.addText("Not presented. The health and accessibility terms only, since the rest needs no introduction here.", {
    x: M, y: 1.24, w: CW, h: 0.24,
    fontFace: F, fontSize: 9, color: GREY, margin: 0, valign: "middle"
  });

  // alphabetical, read down the left column then down the right
  const terms = [
    ["a11y", "Accessibility. The letter a, eleven letters, then y. Pronounced ally."],
    ["AHRQ · CDC", "US Agency for Healthcare Research and Quality · US Centers for Disease Control and Prevention."],
    ["BD", "bis die. Latin for twice a day. The abbreviation on slide 2, and the reason this project exists."],
    ["CCI", "Clear Communication Index, from the CDC. A scored checklist for health information. CDC reads 90 or above as good."],
    ["EAA · BFSG", "European Accessibility Act, and the German law implementing it. Why this content has to be accessible at all."],
    ["PEMAT-P", "Patient Education Materials Assessment Tool, Printable. A scored checklist from AHRQ, applied by trained human raters."],
    ["R1 to R9", "My nine hard rules. R2 the AI failed · R4 score under 70 · R7 safety content found."],
    ["WCAG 2.2", "Web Content Accessibility Guidelines, from the W3C. The standard this screens a listed subset of."]
  ];
  const colW = 4.14, gap = 0.48;
  terms.forEach((t, i) => {
    const col = Math.floor(i / 4), row = i % 4;
    const x = M + col * (colW + gap);
    const y = 1.74 + row * 0.78;
    s.addText(t[0], {
      x, y, w: colW, h: 0.22,
      fontFace: F, fontSize: 10, bold: true, color: ACCENT, margin: 0, valign: "middle"
    });
    s.addText(t[1], {
      x, y: y + 0.21, w: colW, h: 0.36,
      fontFace: F, fontSize: 8.5, color: GREY, lineSpacing: 11, margin: 0, valign: "top"
    });
  });

  s.addNotes("Appendix. Do not present it. It is here so the deck can be read without you, and so you never have to define PEMAT or CCI out loud.");
}

pres.writeFile({ fileName: process.argv[2] || "A11yAudit.pptx" })
  .then(f => console.log("WROTE " + f + "  · slides: " + n));
