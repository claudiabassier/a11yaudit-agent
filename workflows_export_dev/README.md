# workflows_export_dev/ — current Phase-2 canvas, kept in sync

Added 19 August 2026 (rigorous review, `decision_log.md` D-89, external
review Finding 1). **Not the same thing as `workflows_export/`**, and the
difference matters:

- `workflows_export/` is the **frozen v1.3 submission** (5 August) —
  preserved exactly as graded, a different and *older* architecture
  (predates D-55's `SUB-A_Validate` subworkflow extraction entirely, among
  other things). Correct to leave untouched, same as `archive/`'s other
  frozen snapshots.
- `workflows_export_dev/` is a **current export of the live `-dev` canvas**
  — `WF1_Audit_Intake-dev.json`, `SUB-A_AI_Analysis-dev.json`,
  `WF-Error-dev.json`, `SUB-A_Validate-dev.json` — pulled directly from
  `activeVersionId` → `workflow_history`, the table that D-80 established
  is what n8n's execution engine actually reads, not from `n8n export:workflow`
  (whose CLI output was found, empirically, to lag the true active version
  by an unexplained margin — see D-89's note on this; a real open question,
  not silently trusted).

## Why this exists

External review Finding 1 named the core risk directly: `code/`, the
exported workflow JSON, and what's actually live in n8n can all say
different things, and nothing before D-89 checked that automatically. The
`n8n-e2e` CI job (`decision_log.md` D-87) imports **this** directory, not
the frozen one — so the end-to-end test exercises the workflow structure
this project is actually iterating on, not a five-week-old snapshot.

## How to refresh this

After publishing a code change live (the `workflow_history` +
`activeVersionId` procedure D-80 established), re-run this against the
running `a11yaudit-n8n-1` container for each of the four `-dev` workflow
names:

```sql
SELECT json_build_object(
  'name', we.name, 'nodes', wh.nodes, 'connections', wh.connections,
  'pinData', COALESCE(we."pinData", '{}'::json), 'active', we.active,
  'settings', we.settings, 'versionId', we."activeVersionId",
  'meta', we.meta, 'nodeGroups', we."nodeGroups", 'id', we.id, 'tags', '[]'::json
)::text
FROM workflow_entity we JOIN workflow_history wh ON wh."versionId" = we."activeVersionId"
WHERE we.name = '<workflow name>';
```

then pretty-print the result over the matching file here. **Not yet
automated** — a natural next CI addition (compare `code/*.js`/`*.sql`
directly against these files' embedded `jsCode`/`query` fields, the way
D-89's node-by-node audit did by hand) is named but not built; see
`A11yAudit_Fahrplan.md`.
