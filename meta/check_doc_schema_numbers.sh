#!/bin/bash
# meta/check_doc_schema_numbers.sh — table/view COUNT claims in reader-
# facing docs must match postgres_schema.sql, the actual current schema.
#
# The most-repeated documentation-drift class in this project's whole
# history (decision_log.md D-56, D-58, D-63, D-70, D-75, D-77, D-81, and
# again in D-93's background-subagent sweep) is exactly this: a doc says
# "N tables"/"N views", the schema changes, the doc doesn't. Every prior
# fix was a manual review catching it after the fact. This is that check
# turned deterministic, applying the same principle decision_log.md D-94
# applied to the log itself ("do not rely on judgment where a
# deterministic check will do", meta/claims_check.sh's own header).
#
# DELIBERATELY SCOPED TO TABLE/VIEW COUNTS ONLY — NOT node counts, even
# though "N nodes" claims are the exact same drift shape and exist in
# capstone_proposal.md/workflow_spec.md. Checked before writing this:
# their "20 nodes" is an explicitly FROZEN claim about the graded v1.3
# submission's canvas (decision_log.md D-26), not the current `-dev`
# canvas — workflow_spec.md says so in the same breath ("the current
# Phase 2 `-dev` canvas has grown further since ... and is not the count
# graded"). A naive check comparing that number against code/'s current
# file count would flag a deliberately-frozen, correct historical claim
# as a defect — the opposite failure to the one this script exists to
# catch. Table/view counts have no such frozen-vs-current split: there
# is exactly one current postgres_schema.sql, so a claim about it is
# always a current-state claim. Do not extend this to node counts
# without solving that distinction first, not by pattern-matching alone.
#
# Usage: bash meta/check_doc_schema_numbers.sh
# Exit 0 = every table/view count claim found matches the real schema.
# Exit 1 = at least one doesn't, or none were found where expected.

set -euo pipefail
cd "$(dirname "$0")/.."

SCHEMA="postgres_schema.sql"
[ -f "$SCHEMA" ] || { echo "FAIL — $SCHEMA not found."; exit 1; }

real_tables=$(grep -c "^CREATE TABLE" "$SCHEMA")
real_views=$(grep -cE "^CREATE (OR REPLACE )?VIEW" "$SCHEMA")

echo "DOC-VS-SCHEMA NUMBER CHECK"
echo "Real schema: $real_tables tables, $real_views views (from $SCHEMA)"
echo

failed=0
found_tables=0
found_views=0

# Word-bounded on both sides: an early draft of this matched "1 table"
# inside "1 tablet" (readme.md's own dosing example) before \b was added
# on the trailing side too — checked by hand against both files before
# trusting this, not assumed safe from the leading digit-space alone.
DOCS="readme.md CLAUDE.md"

for f in $DOCS; do
  [ -f "$f" ] || continue
  # Captured to a variable and read via here-string, not piped straight
  # into `while read < <(grep ...)` — a failing/empty process
  # substitution there silently produces zero loop iterations rather
  # than a propagated error, the exact bug meta/check_decision_log_
  # completeness.sh's first version had (decision_log.md D-94). grep
  # itself exiting 1 on "no match" is expected and handled below, not
  # treated as a tool failure.
  matches=$(grep -noE '\b[0-9]+ (tables?|views?|Tabellen|Views)\b' "$f") || true

  while IFS=: read -r lineno claim; do
    [ -z "$lineno" ] && continue
    n=$(echo "$claim" | grep -oE '^[0-9]+')
    kind=$(echo "$claim" | grep -oE '(tables?|Tabellen)$' || true)
    if [ -n "$kind" ]; then
      found_tables=1
      if [ "$n" -ne "$real_tables" ]; then
        echo "FAIL — $f:$lineno claims '$claim' but $SCHEMA actually has $real_tables tables."
        failed=1
      fi
    else
      found_views=1
      if [ "$n" -ne "$real_views" ]; then
        echo "FAIL — $f:$lineno claims '$claim' but $SCHEMA actually has $real_views views."
        failed=1
      fi
    fi
  done <<< "$matches"
done

if [ "$found_tables" -eq 0 ]; then
  echo "FAIL — no table-count claim ('N tables'/'N Tabellen') found in: $DOCS. Either the wording changed (update this script's pattern) or the claim was silently removed (restore it — a reader deserves to know the schema shape without opening postgres_schema.sql)."
  failed=1
fi
if [ "$found_views" -eq 0 ]; then
  echo "FAIL — no view-count claim ('N views'/'N Views') found in: $DOCS. Same reasoning as the table-count case above."
  failed=1
fi

if [ "$failed" -eq 0 ]; then
  echo "PASS — every table/view count claim in $DOCS matches the real schema."
fi

exit $failed
