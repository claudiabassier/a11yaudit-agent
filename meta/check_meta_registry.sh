#!/bin/bash
# meta/check_meta_registry.sh — every check script in meta/ must be BOTH
# documented in meta/README.md's own file table AND wired into
# .github/workflows/checks.yml. Neither direction guaranteed by anything
# until now.
#
# Why this exists: meta/README.md's table went stale in exactly this way
# three separate times — decision_log.md D-82 fixed it once, D-93 fixed
# it again (missing check_broken_links.sh/check_export_sync.py/
# check_sql_comments.sh, all added after D-82's own fix), and it was
# found stale a THIRD time on 1 September, in direct response to being
# asked "was fehlt noch?" — missing check_decision_log_completeness.sh/
# check_doc_schema_numbers.sh/hooks/pre-commit, all added the same
# session as D-93's own fix and missed by it. Three recurrences of the
# identical drift shape is not bad luck, it's a missing check — the same
# principle this project keeps applying everywhere except, until now,
# here (decision_log.md D-94's own header: "do not rely on judgment
# where a deterministic check will do").
#
# What it checks:
#   1. Every meta/*.sh and meta/*.py file (top level only — build_deck.js
#      is excluded by extension, meta/hooks/pre-commit by directory) has
#      its bare filename appearing backtick-quoted somewhere in
#      meta/README.md.
#   2. The same set of files each appear somewhere in
#      .github/workflows/checks.yml — a script that exists but was never
#      wired in would otherwise sit there silently doing nothing, the
#      exact "declared but not actually enforced" shape decision_log.md
#      D-94 named as a known-open gap when it was written.
#   3. meta/hooks/pre-commit specifically is documented in the README
#      table (checked separately — it is invoked via a git hook, not
#      directly from checks.yml, so it is exempted from check #2).
#
# Usage: bash meta/check_meta_registry.sh
# Exit 0 = meta/'s own file registry is complete in both places.

set -euo pipefail
cd "$(dirname "$0")/.."

README="meta/README.md"
CHECKS_YML=".github/workflows/checks.yml"
[ -f "$README" ] || { echo "FAIL — $README not found."; exit 1; }
[ -f "$CHECKS_YML" ] || { echo "FAIL — $CHECKS_YML not found."; exit 1; }

echo "META REGISTRY CHECK"
echo

failed=0

for f in meta/*.sh meta/*.py; do
  [ -f "$f" ] || continue
  name=$(basename "$f")

  if ! grep -qF "\`$name\`" "$README"; then
    echo "FAIL — $f exists but '\`$name\`' does not appear in $README's file table."
    failed=1
  fi
  if ! grep -qF "$name" "$CHECKS_YML"; then
    echo "FAIL — $f exists but is never referenced in $CHECKS_YML — a check that exists but doesn't run."
    failed=1
  fi
done

if [ -f meta/hooks/pre-commit ]; then
  if ! grep -qF '`hooks/pre-commit`' "$README"; then
    echo "FAIL — meta/hooks/pre-commit exists but '\`hooks/pre-commit\`' does not appear in $README's file table."
    failed=1
  fi
fi

if [ "$failed" -eq 0 ]; then
  echo "PASS — every meta/*.sh, meta/*.py, and meta/hooks/pre-commit is documented in $README and (where applicable) wired into $CHECKS_YML."
fi

exit $failed
