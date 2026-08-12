#!/bin/sh
# ============================================================================
# tests/golden/run.sh
# ============================================================================
# Wrapper for the golden-test runner. Builds the dedicated test image (see
# Dockerfile — not the n8n/postgres pipeline containers, not docker-compose.yml)
# and runs it against the repo, bind-mounted read-write so --update can write
# tests/golden/expected/*.json back to the host.
#
# Usage:
#   ./tests/golden/run.sh              # run all fixtures, diff against expected/
#   ./tests/golden/run.sh --update     # regenerate expected/*.json — hand-verify
#                                       # the output before committing (see README)
#
# Must be invoked from the repo root (or any cwd — path below is script-relative).
# ============================================================================
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

docker build -t a11yaudit-golden "$SCRIPT_DIR"
docker run --rm -v "$REPO_ROOT":/repo -w /repo a11yaudit-golden node tests/golden/run.js "$@"
