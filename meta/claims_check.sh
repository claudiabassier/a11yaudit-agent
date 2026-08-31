#!/bin/bash
# claims_check.sh — flag externally-verifiable absolute claims in the documents.
# Applies the project's own design principle to its own prose:
# do not rely on judgment where a deterministic check will do.
#
# Usage:  bash meta/claims_check.sh
# Every hit needs one of: a citation, a hedge ("I could find"), or deletion.

PAT='\b(nothing (else )?(connects|joins|does|exists)|no other|the only [a-z]+|every [a-z]+ (on the market|passes|checker|tool)|all [a-z]+ (tools|checkers|instruments)|routinely|always [a-z]+s|never [a-z]+s|are manual|cannot see|is the first|no one|nobody)\b'

echo "CLAIMS CHECK — $(date +%Y-%m-%d)"
echo "Each hit asserts something about the world outside this repository."
echo "It needs a source, a hedge, or removal. Statements about this system are false positives."
echo
# presentation.md is real and actively maintained (the speaking script,
# deliberately kept outside this repo, same as A11yAudit_Fahrplan.md) -
# not, as an earlier pass here wrongly claimed, a planned file that was
# never built (corrected 19 August, decision_log.md D-84, after the
# author flagged the error directly). It stays out of this loop for a
# narrower reason: the file does not exist in THIS checkout at all, so
# `[ -f "$f" ]` below would just skip it silently either way - checking
# it would mean pointing this script at a path outside the repo, which
# breaks for anyone else who clones it.
for f in readme.md knowledge_base.md capstone_proposal.md workflow_spec.md; do
  [ -f "$f" ] || continue
  hits=$(grep -inE "$PAT" "$f")
  if [ -n "$hits" ]; then
    echo "── $f"
    echo "$hits" | cut -c1-200 | sed 's/^/   /'
    echo
  fi
done
echo "Reminder: the three claims this project got wrong (D-43, D-45) were all"
echo "plausible, rhetorically useful, and about something outside the repo."
