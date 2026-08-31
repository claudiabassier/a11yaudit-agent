#!/bin/bash
# meta/check_decision_log_completeness.sh — decision_log.md's own header
# claims completeness ("D-01 to D-NN, no missing numbers, no duplicates");
# this checks that claim is actually true of the document body, instead of
# trusting it the way this project trusted it for eleven entries in a row
# (decision_log.md D-82 through D-92, found only by a fifth rigorous review
# and documented as D-93/D-94).
#
# Applies this project's own stated design principle to the log itself:
# "do not rely on judgment where a deterministic check will do"
# (meta/claims_check.sh's header) — every commit from D-82 to D-92 updated
# the changelog line but never appended the full body entry the document's
# own format requires, and nothing caught it until someone went looking.
#
# What it checks: the **Completeness:** line names the expected range
# (D-01 to D-NN). Every number in that range must have EXACTLY ONE
# "## D-XX — ..." heading in the body — no missing number, no duplicate,
# and no heading beyond NN that the completeness line doesn't know about
# (the mirror-image mistake: a body entry added without updating the claim).
# Each entry's own body must also clear a minimum length (400 chars,
# calibrated against the shortest genuine entry on file, D-09 at 580) —
# a heading with one throwaway sentence and no real Context/Rationale is
# the same failure this check exists for, one step short of a missing
# heading entirely, and just as easy to write under the same time
# pressure that produced the original D-82..D-92 gap. The one legitimate
# exception is D-12's own placeholder ("number not used") — exempted by
# name, not by being short, so a *new* short entry cannot hide behind it.
#
# What this does NOT and CANNOT check: that an entry's content is true,
# that it was actually verified the way it claims, or that its evidence
# is real — same limit every other structural check in this project has
# (claims_check.sh, check_broken_links.sh). A long, confident, invented
# entry passes this exactly as easily as a short one fails it. This is a
# completeness-and-substance check, not a fact-checker.
#
# Usage: bash meta/check_decision_log_completeness.sh
# Exit 0 = the document's own completeness claim is true. Exit 1 = it isn't.

set -euo pipefail
cd "$(dirname "$0")/.."

FILE="decision_log.md"
[ -f "$FILE" ] || { echo "FAIL — $FILE not found."; exit 1; }

line=$(grep -m1 '^\*\*Completeness:\*\*' "$FILE" || true)
if [ -z "$line" ]; then
  echo "FAIL — no **Completeness:** line found in $FILE. This check has nothing to verify against."
  exit 1
fi

end=$(echo "$line" | grep -oE 'D-[0-9]+ to D-[0-9]+' | head -1 | grep -oE '[0-9]+' | tail -1)
if [ -z "$end" ]; then
  echo "FAIL — could not parse an 'D-01 to D-NN' range out of: $line"
  exit 1
fi

echo "DECISION LOG COMPLETENESS CHECK"
echo "Completeness line claims: D-01 to D-$end"
echo

failed=0
missing=""
dup=""
stub=""
MIN_CHARS=400

for ((i=1; i<=end; i++)); do
  num=$(printf "%02d" "$i")
  count=$(grep -c "^## D-$num " "$FILE" || true)
  if [ "$count" -eq 0 ]; then
    missing="$missing D-$num"
    failed=1
  elif [ "$count" -gt 1 ]; then
    dup="$dup D-$num"
    failed=1
  fi
done

# Substance check: each entry's own body (between its heading and the
# next "## D-" heading, or EOF) must clear MIN_CHARS — except D-12's
# named placeholder, exempted explicitly rather than by being short.
#
# awk's output is captured to a variable and its own exit status checked
# explicitly — NOT piped straight into `while read < <(...)`, because
# that pattern swallows a failing awk silently (a syntax error inside
# the process substitution does not propagate; the loop just sees zero
# lines and the script fell through to a false PASS the first time this
# was written and tested here). Same BSD-vs-GNU tooling gap
# meta/check_broken_links.sh already hit once (decision_log.md D-85) —
# macOS's non-gawk awk doesn't support the GNU-only match()-with-array
# form; rewritten below to plain field-splitting ($2), which is POSIX
# and portable, but the explicit exit-status check stays regardless,
# since a silently-swallowed tool failure is the more dangerous half of
# that bug, not the portability gap itself.
entry_lengths=$(awk '
  /^## D-[0-9]+/{
    if (name != "") print name, length(buf)
    name = $2; buf = ""
    next
  }
  { buf = buf $0 }
  END { if (name != "") print name, length(buf) }
' "$FILE")
awk_status=$?
if [ "$awk_status" -ne 0 ]; then
  echo "FAIL — the substance-length check's own awk pass failed (exit $awk_status). Not treating that as PASS."
  exit 1
fi

while IFS= read -r result; do
  [ -z "$result" ] && continue
  n="${result%% *}"
  len="${result#* }"
  if [ "$n" = "D-12" ]; then
    continue
  fi
  if [ "$len" -lt "$MIN_CHARS" ]; then
    stub="$stub $n(${len}c)"
    failed=1
  fi
done <<< "$entry_lengths"

# Mirror-image check: a body heading beyond what the completeness line
# claims — an entry added without updating the claim itself.
maxheading=$(grep -oE '^## D-[0-9]+' "$FILE" | grep -oE '[0-9]+' | sort -n | tail -1)
maxheading=$((10#$maxheading))
if [ "$maxheading" -gt "$end" ]; then
  echo "FAIL — body contains ## D-$(printf '%02d' "$maxheading") but the Completeness line only claims up to D-$end. Update the Completeness line and the Changelog line together with the new entry, not after."
  failed=1
fi

if [ -n "$missing" ]; then
  echo "FAIL — these numbers are claimed complete but have NO body entry ('## D-XX —' heading):$missing"
  echo "  (This is exactly the D-82..D-92 gap D-93 found and fixed. Write the full entry, not just the changelog line.)"
fi
if [ -n "$dup" ]; then
  echo "FAIL — these numbers have more than one body entry, which the completeness claim ('no duplicates') rules out:$dup"
fi
if [ -n "$stub" ]; then
  echo "FAIL — these entries exist but are under $MIN_CHARS characters, too short to be a real Decision/Context/Rationale entry:$stub"
  echo "  (A heading with a one-line stub is the same gap D-93 found, one step short of missing entirely — write the full entry.)"
fi

if [ "$failed" -eq 0 ]; then
  echo "PASS — D-01 to D-$end each have exactly one substantive body entry (>= $MIN_CHARS chars, D-12 exempted), matching the file's own completeness claim."
fi

exit $failed
