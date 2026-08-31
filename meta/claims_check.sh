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
# presentation.md was a planned markdown presentation script that was never
# built - the deck is A11yAudit_presentation.pptx instead, binary, not
# something this grep-based check can usefully scan. Dropped from the list
# rather than left as a dead reference (decision_log.md D-81).
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
