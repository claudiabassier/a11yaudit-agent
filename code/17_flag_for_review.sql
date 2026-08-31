-- ===========================================================================
-- Node 17 — Flag for Review   ·   Workflow: WF1
-- Postgres node, operation "Execute Query".
-- Query Parameters (Options): audit_id from the Upsert Audit node -- bound via the node's own Query Parameters option, NOT evaluated here (decision_log.md D-71).
--
-- Spec Node 17: audits.status = 'needs_review'; the reviewer works the
-- v_review_queue view. Node 13 already sets this status on insert, so this
-- node is belt-and-braces: it guarantees the flag regardless of how the row
-- was created, and marks the human handoff explicitly on the canvas.
-- Deliberately does NOT touch completed_at — the audit is not finished.
-- ===========================================================================
UPDATE audits
   SET status     = 'needs_review',
       updated_at = now()
 WHERE audit_id = $1::uuid
RETURNING audit_id, status, human_review_required, triggered_rules;
