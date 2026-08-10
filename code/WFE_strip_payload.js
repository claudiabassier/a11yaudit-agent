/**
 * WF-Error — Node 2: Strip Payload   (written Day 2, 1 Aug 2026)
 *
 * NODE:   Code node, "Run Once for All Items", between Error Trigger and
 *         "Postgres: insert error_log".
 *
 * PURPOSE (workflow_spec.md §3): retain ONLY metadata — workflow name, node
 *         name, error class, sanitised message, execution id, timestamp.
 *         Discard every trace of audited content and AI output.
 *         GDPR data minimisation: error_log must never become a back door
 *         through which page content or patient-facing text is stored.
 *
 * EXPECTED INPUT — n8n Error Trigger emits ONE item shaped roughly:
 *   {
 *     execution: { id, url, retryOf, error: { message, stack, name },
 *                  lastNodeExecuted, mode },
 *     workflow:  { id, name }
 *   }
 *   Field presence varies by n8n version and by how the error was raised,
 *   so EVERY access below is defensive. This node must never throw — an
 *   error handler that crashes loses the error it was called to record.
 *
 * OUTPUT — one item matching the error_log columns exactly:
 *   { workflow_name, node_name, error_class, error_message, execution_id }
 *   (occurred_at and error_id are defaulted by Postgres.)
 *
 * ---------------------------------------------------------------------------
 * TEST INPUT — pin this on the Error Trigger to run the node standalone:
 *
 * [{
 *   "execution": {
 *     "id": "12345",
 *     "error": { "message": "Cannot find module 'cheerio'", "name": "Error" },
 *     "lastNodeExecuted": "Automated Checks",
 *     "mode": "manual"
 *   },
 *   "workflow": { "id": "abc", "name": "WF1_Audit_Intake" }
 * }]
 *
 * Expect: workflow_name "WF1_Audit_Intake", node_name "Automated Checks",
 *         error_class "module_missing", execution_id "12345".
 * ---------------------------------------------------------------------------
 */

const MAX_MESSAGE_CHARS = 300;

// Deterministic message → error_class mapping. Ordered: first match wins.
// Deliberately conservative — anything unrecognised becomes 'unknown_error'
// rather than being guessed at, so the classes stay trustworthy.
const CLASS_PATTERNS = [
  [/no[_ ]content|content is empty|insufficient_content/i, 'no_content'],
  [/insufficient[_ ]content|too short/i,                    'insufficient_content'],
  [/bad[_ ]url|invalid url|malformed url/i,                 'bad_url'],
  [/etimedout|timeout|timed out/i,                          'http_timeout'],
  [/enotfound|econnrefused|getaddrinfo|dns/i,               'host_unreachable'],
  [/cannot find module/i,                                   'module_missing'],
  // API before the generic fetch pattern: an Anthropic 401 also matches
  // "request failed", and attributing it to the AI call is the more useful
  // of the two readings. A plain URL fetch returning 401 is possible and
  // would be misclassified here — acceptable, and noted rather than hidden.
  [/api[_ ]error|anthropic|openai|rate limit|\b(401|403|429)\b/i, 'api_error'],
  [/fetch[_ ]error|status code (4|5)\d\d|request failed/i,  'fetch_error'],
  [/validation[_ ]failed|schema|invalid json|not valid/i,   'validation_failed'],
  [/postgres|database|relation .* does not exist|ecunn/i,   'database_error'],
];

function classify(message) {
  if (!message) return 'unknown_error';
  for (const [pattern, cls] of CLASS_PATTERNS) {
    if (pattern.test(message)) return cls;
  }
  return 'unknown_error';
}

/**
 * Sanitise the error message before it is stored.
 * Three defences, in order:
 *   1. collapse whitespace  — multi-line stack fragments become one line
 *   2. redact anything key-shaped — sk-..., Bearer ..., long hex/base64 runs
 *   3. hard truncate — a backstop, not the primary defence. Known
 *      content-carrying throw sites (e.g. Node 2's bad_url, fixed
 *      10 Aug — see 02_normalize_input.js) now exclude raw content
 *      from the message at the source; truncation exists for whatever
 *      throw site hasn't had that same fix applied yet.
 */
function sanitise(raw) {
  if (!raw) return null;
  let m = String(raw).replace(/\s+/g, ' ').trim();

  m = m.replace(/\b(sk-[A-Za-z0-9_\-]{8,})/g, '[redacted-key]');
  m = m.replace(/\bBearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [redacted]');
  m = m.replace(/\b[A-Fa-f0-9]{32,}\b/g, '[redacted-hex]');
  m = m.replace(/(password|api[_-]?key|token)\s*[:=]\s*\S+/gi, '$1=[redacted]');

  if (m.length > MAX_MESSAGE_CHARS) {
    m = m.slice(0, MAX_MESSAGE_CHARS) + '… [truncated]';
  }
  return m;
}

// --- main -----------------------------------------------------------------
// Wrapped whole: if anything unexpected arrives, still write a row saying so.
let out;
try {
  const item = ($input.all()[0] || {}).json || {};

  const execution = item.execution || {};
  const workflow  = item.workflow  || {};
  const error     = execution.error || item.error || {};

  const rawMessage = error.message || error.description || null;

  out = {
    workflow_name: workflow.name || 'unknown_workflow',
    node_name:     execution.lastNodeExecuted || error.node?.name || null,
    error_class:   classify(rawMessage || error.name),
    error_message: sanitise(rawMessage),
    execution_id:  execution.id != null ? String(execution.id) : null,
  };
} catch (e) {
  out = {
    workflow_name: 'WF-Error',
    node_name:     'Strip Payload',
    error_class:   'unknown_error',
    error_message: sanitise('Strip Payload itself failed: ' + e.message),
    execution_id:  null,
  };
}

return [{ json: out }];
