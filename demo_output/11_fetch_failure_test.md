# Fetch-failure path — production-mode test, four cases

**Run 13 August 2026, against `WF1 - Audit Intake-dev` / `a11yaudit_dev`** (not the original — per this sprint's own data-separation rule, D-51). README previously stated the fetch-failure path was "wired but untested." This is the missing proof, in the same style as the existing failure-path records (E1, E11, S5, S4).

All four cases were submitted through the real production form (`http://localhost:5678/form/7769bc3d-...`), not simulated — each is a genuine `Fetch Page` (HTTP Request node) execution against a real target, verified against `execution_entity`/`error_log` in Postgres, not read off the editor's green checkmarks.

## Deviation, noted rather than hidden

The plan called for a public HTTP-500 test endpoint (`httpbin.org/status/500`). Two real attempts against it failed to produce the intended case: the first returned **503** (httpbin's own service, not the requested 500); the resubmission **timed out entirely** (`ECONNABORTED` after 15s) — httpbin was genuinely unreliable at test time, twice in a row. Rather than depend on flaky third-party infrastructure for what is supposed to be a deterministic regression check, case 3 was switched to a disposable local stub container (`python:3-alpine`, on the same Docker network as n8n, removed immediately after the test) that returns a real, guaranteed 500. Both failed httpbin attempts are included in the table below for completeness — they are real evidence too, just not the case originally planned.

## Results

| Case | Target | Result | Failing node | Error class / message | Audit written? |
|---|---|---|---|---|---|
| 1. Unroutable address (RFC 5737) | `https://203.0.113.1/test-timeout` | Aborted, ~15.1s | `Fetch Page` | `ECONNABORTED` — "The connection was aborted, perhaps the server is offline" | No |
| 2. Unresolvable host (RFC 2606 `.invalid`) | `https://this-domain-does-not-exist-a11yaudit-test.invalid/` | Aborted, ~43ms | `Fetch Page` | `ENOTFOUND` — "The connection cannot be established, this usually occurs due to an incorrect host (domain) value" | No |
| *(deviation, not counted)* `httpbin.org/status/500`, attempt 1 | `https://httpbin.org/status/500` | Aborted, ~0.5s | `Fetch Page` | `503` — httpbin's own "Service Temporarily Unavailable" | No |
| *(deviation, not counted)* `httpbin.org/status/500`, attempt 2 | `https://httpbin.org/status/500` | Aborted, ~15.0s | `Fetch Page` | `ECONNABORTED` — timeout, same as case 1 | No |
| 3. Reachable host, HTTP 500 (local stub) | `http://a11yaudit-test500:8080/` | Aborted, ~17ms | `Fetch Page` | `500` — "The service was not able to process your request" | No |
| 4. Reachable host, no usable content | `http://a11yaudit-test-empty:8080/` (real HTTP 200, empty `<body>`) | Aborted, ~55ms | `Hash + Guard` | `insufficient_content` — "content is 0 characters; below the 200-character minimum, scoring would be meaningless." [line 95] | No |

**`audits` table in `a11yaudit_dev`: 2 rows before, 2 rows after all six executions (four documented cases plus two deviation attempts).** No partial or junk row was ever written, in any of the six real runs — including case 4, where the failure happens three nodes *after* the point where content starts being processed (`Fetch Page` → `Automated Checks` → `Merge` → `Hash + Guard`), the closest any of these cases came to writing something.

**`WF-Error-dev` fired automatically for every single failure, 6/6, one execution each**, immediately following the failing `WF1-dev` run (verified by matching `execution_entity` timestamps, not assumed from the error-workflow setting existing). Every logged `error_log` row is content-free: no target URL, no domain name, no page content appears in any `error_message` — only the generic client/library-level message and the failing node's name, consistent with the project's documented GDPR data-minimisation design.

## Reading

- **The system fails safe on all four cases, not just the ones that were designed for.** Case 1–3 fail at `Fetch Page` itself (Node 4), which has no `Continue On Fail` — confirmed as as-built behaviour in `workflow_spec.md` (D-24), not assumed. Case 4 is different in kind: the fetch itself *succeeds* (a real 200), and the failure only surfaces three nodes later at `Hash + Guard`'s minimum-content guard (`MIN_CHARS = 200`, `code/08_hash_guard.js`) — proving the guard catches a technically-successful-but-useless fetch, not just a network-level failure.
- **All four error classes currently log as the generic `unknown_error`** in `error_log.error_class` — not a defect (`WF-Error`'s job is metadata-only capture, not classification), but worth noting: a future reader of `error_log` cannot currently distinguish a DNS failure from a content-length failure by `error_class` alone, only by reading `error_message`.
- **The deviation itself is evidence of the same design principle the rest of the project follows**: when the real world didn't cooperate (a flaky public test service), the response was to say so and switch to something deterministic — not to quietly substitute a different result and call it the planned one.

## Limitation of this test

All four targets are either RFC-reserved test addresses/domains (5737, 2606) or fully disposable local containers created and destroyed for this test — no third-party production system was targeted except the two abandoned `httpbin.org` attempts, which is itself a public test-endpoint service, not a real site. This test proves the failure *path* (routing, error logging, no partial writes); it does not, and is not intended to, exercise every possible HTTP failure mode.
