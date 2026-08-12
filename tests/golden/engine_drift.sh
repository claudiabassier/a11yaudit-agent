#!/bin/sh
# ============================================================================
# tests/golden/engine_drift.sh
# ============================================================================
# Runs engine_drift.js — compares 05_automated_checks.js (cheerio) against
# 05_automated_checks_regex.js (regex fallback) on all three fixtures and
# reports every difference. See engine_drift.js's header for what "drift"
# means here and why exit 1 is not automatically a regression.
#
# Reuses the same Docker image as run.sh (cheerio is needed for one of the
# two engines under comparison).
# ============================================================================
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

docker build -t a11yaudit-golden "$SCRIPT_DIR"
docker run --rm -v "$REPO_ROOT":/repo -w /repo a11yaudit-golden node tests/golden/engine_drift.js "$@"
