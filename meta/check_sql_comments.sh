#!/bin/bash
# meta/check_sql_comments.sh — guard against the exact D-71 bug class.
#
# n8n evaluates {{ }} expressions anywhere in a Postgres node's Query text,
# including inside "--" comments (decision_log.md D-71, 18 August): a
# findings payload containing an embedded newline broke a documentation
# comment mid-query and crashed the insert. The live nodes were fixed, but
# the fix was never backported to code/*.sql — found again, independently,
# by the rigorous review on 19 August (decision_log.md D-84). This script
# is the automated version of the grep that found it the second time.
#
# Usage: bash meta/check_sql_comments.sh
# Exit 0 = clean, exit 1 = at least one "--" comment line contains {{ }}.

set -u
FOUND=0

for f in code/*.sql archive/*.sql; do
  [ -f "$f" ] || continue
  # Match a "--" comment line (leading whitespace then --) containing {{ }}.
  hits=$(grep -nE '^\s*--.*\{\{.*\}\}' "$f")
  if [ -n "$hits" ]; then
    echo "FAIL — $f has {{ }} inside a SQL comment (n8n evaluates it live, decision_log.md D-71):"
    echo "$hits" | sed 's/^/  /'
    FOUND=1
  fi
done

if [ "$FOUND" -eq 0 ]; then
  echo "PASS — no {{ }} expression found inside a SQL '--' comment in code/*.sql or archive/*.sql."
fi
exit $FOUND
