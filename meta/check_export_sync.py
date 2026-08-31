#!/usr/bin/env python3
"""
meta/check_export_sync.py — code/*.js and code/*.sql must match the
jsCode/query embedded in workflows_export_dev/*.json, node for node.

The automated version of the node-by-node audit done by hand in
decision_log.md D-89, which found real live drift no earlier check
caught — a privacy leak (Normalize Input), a missing security mitigation
(Build Prompt's prompt-injection defense), and a dead code branch
(Generate Report). This script exists so that class of drift is caught
automatically going forward, on every push, instead of only when someone
asks "is this actually fixed?" by hand (decision_log.md D-92).

Compares against workflows_export_dev/, the current -dev canvas export
(see that directory's own README for how it's refreshed) — never
workflows_export/, the frozen v1.3 submission, which is a different,
older architecture on purpose.

Usage: python3 meta/check_export_sync.py
Exit 0 = every mapped node matches, exit 1 = at least one differs.
"""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
EXPORT_DIR = REPO / "workflows_export_dev"

# node name -> code file. Kept in one place, not duplicated per script —
# see also decision_log.md D-89 where this mapping was first established.
MAPPING = {
    "Normalize Input": "code/02_normalize_input.js",
    "Automated Checks": "code/05_automated_checks.js",
    "Prepare Text": "code/06_prepare_text.js",
    "Hash + Guard": "code/08_hash_guard.js",
    "Safety Prescreen": "code/09_safety_prescreen.js",
    "Merge Findings": "code/11_merge_findings.js",
    "Decision Engine": "code/12_decision_engine.js",
    "Build Audit Payload": "code/13a_build_audit_payload.js",
    "Upsert Audit": "code/13_upsert_audit.sql",
    "Build Audit Run Payload": "code/13b_build_audit_run_payload.js",
    "Build Findings Payload": "code/14a_build_findings_payload.js",
    "Insert Findings": "code/14_insert_findings.sql",
    "Build Instrument Items Payload": "code/15a_build_instrument_items_payload.js",
    "Flag for Review": "code/17_flag_for_review.sql",
    "Generate Report + Statement": "code/18_generate_report.js",
    "Save Report": "code/19_save_report.sql",
    "Build Prompt": "code/A2_build_prompt.js",
    "Validate": "code/A4_validate_output.js",
    "Fallback.": "code/A5_fallback.js",
    "Strip Payload": "code/WFE_strip_payload.js",
}

EXPORT_FILES = [
    "WF1_Audit_Intake-dev.json",
    "SUB-A_AI_Analysis-dev.json",
    "WF-Error-dev.json",
    "SUB-A_Validate-dev.json",
]


def main():
    if not EXPORT_DIR.is_dir():
        sys.exit(f"FAIL — {EXPORT_DIR} does not exist.")

    seen = set()
    failed = False

    for fname in EXPORT_FILES:
        fpath = EXPORT_DIR / fname
        if not fpath.is_file():
            print(f"FAIL — {fpath} does not exist.")
            failed = True
            continue
        with open(fpath, "rb") as f:
            wf = json.loads(f.read().decode("utf-8"))
        for node in wf.get("nodes", []):
            name = node.get("name")
            if name not in MAPPING:
                continue
            seen.add(name)
            code_file = REPO / MAPPING[name]
            params = node.get("parameters", {})
            field = "jsCode" if "jsCode" in params else ("query" if "query" in params else None)
            if not field:
                print(f"FAIL — {name} in {fname} has neither jsCode nor query.")
                failed = True
                continue
            live = params[field]
            if not code_file.is_file():
                print(f"FAIL — {MAPPING[name]} does not exist (referenced by {name} in {fname}).")
                failed = True
                continue
            with open(code_file, encoding="utf-8") as f:
                local = f.read()
            if live.rstrip("\n") != local.rstrip("\n"):
                print(f"FAIL — {name} ({fname}) does not match {MAPPING[name]} "
                      f"(live={len(live)} chars, local={len(local)} chars).")
                failed = True

    missing = set(MAPPING) - seen
    if missing:
        print(f"FAIL — these mapped nodes were never found in any export file: {sorted(missing)}")
        failed = True

    if not failed:
        print(f"PASS — all {len(MAPPING)} mapped nodes match between code/ and workflows_export_dev/.")

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
