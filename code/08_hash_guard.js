/**
 * ============================================================================
 * Node 8 — Hash + Guard (Code)   ·   Workflow: WF1
 * Spec: workflow_spec.md §1 Node 8, v2.1
 * ============================================================================
 *
 * PURPOSE
 *   Last gate before analysis: reject content too short to score, truncate
 *   content too long to send, and fingerprint the content with SHA-256 so
 *   the audits table can dedupe re-runs (Node 13 upserts on content_hash).
 *
 * EXPECTED INPUT (one item, from Node 7 Merge — either branch)
 *   { json: { content_text: string, ...branch output } }
 *
 * OUTPUT (one item)
 *   { json: { ...input, content_text (possibly truncated),
 *       content_hash: 64-char hex, content_truncated: boolean } }
 *
 * RULES (spec Node 8)
 *   < 200 chars   → throw "insufficient_content" (scoring would be
 *                   meaningless; WF-Error catches it)
 *   > 30 000 chars → truncate, content_truncated = true (reported in the
 *                   limitations section)
 *   Hash is computed AFTER truncation, so the hash always identifies the
 *   text that was actually analyzed, and identical re-runs dedupe.
 *
 * NOTE ON require('crypto')
 *   Node's built-in crypto needs NODE_FUNCTION_ALLOW_BUILTIN on some n8n
 *   setups (same class of risk as cheerio). To keep this node free of any
 *   environment dependency, it tries require('crypto') and otherwise falls
 *   back to a self-contained SHA-256 implementation (FIPS 180-4). Both
 *   paths produce identical standard SHA-256 hex digests.
 * ============================================================================
 */

const MIN_CHARS = 200;
const MAX_CHARS = 30000;

// ---- SHA-256: built-in if reachable, else pure JS --------------------------
let sha256hex;
try {
  const crypto = require('crypto');
  sha256hex = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
} catch (e) {
  sha256hex = (str) => {
    // pure-JS SHA-256 (FIPS 180-4), operates on UTF-8 bytes
    const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const bytes = Array.from(new TextEncoder().encode(str));
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push((bitLen / Math.pow(2, 8 * i)) & 0xff);
    const rr = (x, n) => (x >>> n) | (x << (32 - n));
    const w = new Array(64);
    for (let off = 0; off < bytes.length; off += 64) {
      for (let i = 0; i < 16; i++) {
        w[i] = (bytes[off + 4 * i] << 24) | (bytes[off + 4 * i + 1] << 16) | (bytes[off + 4 * i + 2] << 8) | bytes[off + 4 * i + 3];
      }
      for (let i = 16; i < 64; i++) {
        const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H = [(H[0]+a)|0,(H[1]+b)|0,(H[2]+c)|0,(H[3]+d)|0,(H[4]+e)|0,(H[5]+f)|0,(H[6]+g)|0,(H[7]+h)|0];
    }
    return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  };
}

// ---- guard + hash ----------------------------------------------------------
const out = [];
for (const item of $input.all()) {
  const j = item.json || {};
  let text = (typeof j.content_text === 'string') ? j.content_text.trim() : '';

  if (text.length < MIN_CHARS) {
    throw new Error(`insufficient_content: content is ${text.length} characters; below the ${MIN_CHARS}-character minimum, scoring would be meaningless.`);
  }
  let content_truncated = false;
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
    content_truncated = true;
  }
  out.push({ json: { ...j, content_text: text, content_hash: sha256hex(text), content_truncated } });
}
return out;

/* ============================================================================
 * STANDALONE TEST INPUT — pin this on the node in n8n (Input panel → Pin data).
 * The text below is ~330 characters. Expected:
 *   - content_hash: 64-character hex string
 *   - content_truncated: false
 *   - re-running with the SAME text yields the SAME hash (dedupe basis)
 * Also try: shorten the text below 200 chars → node fails
 *   "insufficient_content" (correct; WF-Error catches it).
 * Also try: paste > 30 000 chars → content_truncated true, text cut to 30 000.

[
  {
    "json": {
      "source_type": "text",
      "content_language": "en",
      "content_text": "Take one tablet every morning with water, ideally at the same time each day. If you miss a dose, do not take a double dose to make up for it; simply continue with the next scheduled dose. Contact your GP surgery if you are unsure. Store the tablets in a dry place below 25 degrees and keep them out of reach of children at all times.",
      "is_very_short": true,
      "automated_checks_skipped": true
    }
  }
]

 * ========================================================================== */
