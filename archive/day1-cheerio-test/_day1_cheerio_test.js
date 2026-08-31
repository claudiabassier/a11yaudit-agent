/**
 * DAY 1 — cheerio reachability test. Manual Trigger → Code node → Execute.
 * Takes two minutes. Run it BEFORE building anything that depends on cheerio.
 *
 * PASS  → { cheerio_available: true, ... , h1: "It works" }
 *         Use code/05_automated_checks.js.
 *
 * FAIL  → the node shows an error containing "Cannot find module 'cheerio'"
 *         or the output says cheerio_available: false.
 *         → 30 MINUTES MAXIMUM on configuration (check that
 *           NODE_FUNCTION_ALLOW_EXTERNAL=cheerio is really in the running
 *           container: `docker compose exec n8n env | grep NODE_FUNCTION`,
 *           and that the container was recreated, not just restarted:
 *           `docker compose up -d --force-recreate n8n`).
 *         → then switch permanently to code/05_automated_checks_regex.js,
 *           add one line to decision_log.md, and move on. The fallback is
 *           verified byte-identical; nothing is lost. Do not spend the
 *           afternoon on this.
 *
 * The same test covers Node 8's crypto dependency.
 */

const result = { cheerio_available: false, crypto_available: false, errors: [] };

try {
  const cheerio = require('cheerio');
  const $ = cheerio.load('<html><body><h1>It works</h1><img src="x.png"></body></html>');
  result.cheerio_available = true;
  result.h1 = $('h1').text();
  result.img_without_alt = $('img').filter((_, el) => $(el).attr('alt') === undefined).length;
} catch (e) {
  result.errors.push('cheerio: ' + e.message);
}

try {
  const crypto = require('crypto');
  result.crypto_available = true;
  result.sha256_of_abc = crypto.createHash('sha256').update('abc', 'utf8').digest('hex');
  // must equal ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
  result.sha256_correct = result.sha256_of_abc === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
} catch (e) {
  result.errors.push('crypto: ' + e.message + ' (harmless — Node 8 falls back to its own SHA-256)');
}

result.verdict = result.cheerio_available
  ? 'PASS — use 05_automated_checks.js'
  : 'FAIL — 30 min max, then use 05_automated_checks_regex.js and log it';

return [{ json: result }];
