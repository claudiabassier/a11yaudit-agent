#!/bin/bash
# meta/check_broken_links.sh — every repo-relative file path mentioned in
# backticks in the "living" docs must actually exist somewhere in the repo.
#
# Would have caught a share of the 19 August doc-drift findings
# automatically (decision_log.md D-81/D-82/D-83/D-84): a deleted
# regex-fallback file, demo_audit_report.md never built (found by this
# very script — see build_runbook.md's packaging table, D-84/D-85).
# presentation.md is NOT an example of this — it is real, kept outside
# this repo like A11yAudit_Fahrplan.md, and this script does not scan it
# for exactly that reason (see meta/claims_check.sh's own note).
#
# Deliberately narrow, twice over:
#   1. Only scans "living" docs — everything except archive/ and
#      demo_output/. Both are intentionally frozen historical record
#      (this project's own established policy, see meta/README.md and
#      demo_output/README.md): they correctly name files that were moved,
#      renamed, or deleted since, on purpose, and are not bugs.
#   2. A candidate only counts as a real path if it contains a "/" AND a
#      recognised extension, OR is a bare filename with a recognised
#      extension (e.g. `README.md`) — filters out MIME types
#      (`multipart/form-data`), example data (`112/70`), and n8n/JS
#      expressions and code identifiers that happen to contain a dot.
#      Resolution searches the whole repo (excluding archive/,
#      demo_output/, .git/) for a matching basename, not just the
#      referencing doc's own directory — this project routinely refers to
#      files by bare name assuming the reader knows which directory,
#      which a doc-relative-only search cannot resolve.
#
# Usage: bash meta/check_broken_links.sh
# Exit 0 = every referenced path resolves, exit 1 = at least one does not.

set -u
shopt -s extglob
FOUND=0
EXT_RE='\.(md|js|sql|sh|yml|yaml|json|txt|pptx|pdf|env)$'

# Build the searchable file index once: basename -> full paths (living tree only).
INDEX=$(mktemp)
find . \( -path ./.git -o -path ./archive -o -path ./demo_output \) -prune -o -type f -print \
  | sed 's|^\./||' > "$INDEX"

while IFS= read -r -d '' mdfile; do
  rel=${mdfile#./}
  # decision_log.md is append-only history, same reasoning as archive/ and
  # demo_output/: past entries correctly name files as they existed at the
  # time, many since renamed, moved, or deleted on purpose. Not a bug.
  case "$rel" in archive/*|demo_output/*|decision_log.md) continue ;; esac

  candidates=$(awk '
    /^```/ { infence = !infence; next }
    !infence { print }
  ' "$mdfile" | grep -oE '`[A-Za-z0-9._/-]+`' | tr -d '`' | sort -u)

  while IFS= read -r path; do
    [ -z "$path" ] && continue
    [[ "$path" =~ $EXT_RE ]] || continue
    case "$path" in
      http*|*'{{'*|*'*'*|*'('*|*'$'*|*' '*) continue ;;
    esac
    base=$(basename "$path")
    # Resolve: exact repo-relative path, or any file anywhere in the
    # living tree sharing that basename. -E (not BRE's \|), since BSD
    # grep (macOS default) does not treat \| as alternation the way GNU
    # grep does — silently never matched anything before this fix.
    if [ -e "$path" ] || grep -qxF "$path" "$INDEX" 2>/dev/null || grep -Eq "/${base}\$|^${base}\$" "$INDEX"; then
      continue
    fi
    echo "FAIL — $rel references \`$path\`, no file named \`$base\` found anywhere in the living tree."
    FOUND=1
  done <<< "$candidates"
done < <(find . -name "*.md" -not -path "./.git/*" -print0)

rm -f "$INDEX"

if [ "$FOUND" -eq 0 ]; then
  echo "PASS — every repo-relative path referenced in backticks across the living docs resolves."
fi
exit $FOUND
