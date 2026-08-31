#!/usr/bin/env python3
"""
tools/review_dashboard.py — a single static HTML page a reviewer can open
without writing SQL.

Closes external review Finding 3 as it was actually meant, not the
adjacent gap D-83's v_pipeline_health closed instead (decision_log.md
D-92): "wer prüfen soll, muss SQL schreiben" was about reading a report
and working the review queue, not about pipeline health. v_review_queue
is still a raw DB view and audits.report_md is still a text field — this
script is the "one command instead of hand-written SQL" answer, not a
new always-on service. Deliberately NOT a webhook: the intake form
already has no auth (readme.md "What it is not"), and a second
unauthenticated HTTP surface exposing audit content would compound that
risk rather than fix an unrelated one. This stays a local, on-demand
script — same trust boundary as before (DB access required), one
command instead of hand-written SQL.

Usage:
    python3 tools/review_dashboard.py [--db a11yaudit_dev] [--out FILE]

Requires: the Postgres container running (docker exec into it), Python 3
standard library only — no new dependency for a script this narrow.
"""
import argparse
import html
import json
import re
import subprocess
import sys
from datetime import datetime, timezone

CONTAINER = "a11yaudit-postgres-1"


def run_sql(db, query):
    """Run one SQL statement via docker exec, return the raw stdout text."""
    proc = subprocess.run(
        ["docker", "exec", CONTAINER, "psql", "-U", "n8n", "-d", db, "-t", "-A", "-q", "-c", query],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        sys.exit(f"psql failed (db={db}):\n{proc.stderr}")
    return proc.stdout


def fetch_queue(db):
    """One row per audit in the review queue, findings nested as JSON."""
    query = """
    SELECT json_agg(row_to_json(a)) FROM (
      SELECT
        q.audit_id, q.page_url, q.page_title, q.audience,
        q.screening_score, q.screening_label,
        q.pemat_understandability, q.pemat_actionability, q.cci_score,
        q.legally_relevant, q.triggered_rules, q.safety_terms_found,
        aa.created_at,
        (SELECT json_agg(json_build_object(
            'finding_key', f2.finding_key, 'severity', f2.severity,
            'title', f2.title, 'status', f2.status,
            'instrument', f2.instrument, 'wcag_criterion', f2.wcag_criterion
          ) ORDER BY CASE f2.severity
              WHEN 'critical' THEN 1 WHEN 'high' THEN 2
              WHEN 'medium' THEN 3 ELSE 4 END)
         FROM findings f2 WHERE f2.audit_id = q.audit_id
           AND f2.human_review_required AND f2.status = 'open'
        ) AS open_findings
      FROM (SELECT DISTINCT audit_id, page_url, page_title, audience,
              screening_score, screening_label, pemat_understandability,
              pemat_actionability, cci_score, legally_relevant,
              triggered_rules, safety_terms_found
            FROM v_review_queue) q
      JOIN audits aa ON aa.audit_id = q.audit_id
      ORDER BY aa.created_at DESC
    ) a;
    """
    raw = run_sql(db, query).strip()
    if not raw or raw == "":
        return []
    return json.loads(raw) or []


def fetch_report(db, audit_id):
    query = f"SELECT report_md FROM audits WHERE audit_id = '{audit_id}';"
    return run_sql(db, query).rstrip("\n")


# ---- minimal markdown -> HTML, scoped to what 18_generate_report.js emits --
# (headers, **bold**, pipe tables, blockquotes, bullet lists, hr, plain text)
def md_to_html(md):
    lines = md.split("\n")
    out = []
    i = 0
    in_list = False

    def inline(s):
        s = html.escape(s)
        s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
        s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
        return s

    while i < len(lines):
        line = lines[i]
        if line.startswith("#"):
            if in_list:
                out.append("</ul>"); in_list = False
            m = re.match(r"^(#{1,6})\s*(.*)$", line)
            level = len(m.group(1))
            out.append(f"<h{level}>{inline(m.group(2))}</h{level}>")
        elif line.strip() == "---":
            out.append("<hr>")
        elif line.startswith("| "):
            if in_list:
                out.append("</ul>"); in_list = False
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append(lines[i]); i += 1
            i -= 1
            cells = [r.strip("|").split("|") for r in rows]
            cells = [c for c in cells if not re.match(r"^\s*:?-+:?\s*(\|\s*:?-+:?\s*)*$", "|".join(c))]
            if cells:
                out.append("<table>")
                out.append("<tr>" + "".join(f"<th>{inline(c.strip())}</th>" for c in cells[0]) + "</tr>")
                for row in cells[1:]:
                    out.append("<tr>" + "".join(f"<td>{inline(c.strip())}</td>" for c in row) + "</tr>")
                out.append("</table>")
        elif line.startswith("> "):
            out.append(f"<blockquote>{inline(line[2:])}</blockquote>")
        elif re.match(r"^[-*]\s+", line):
            if not in_list:
                out.append("<ul>"); in_list = True
            item_text = re.sub(r"^[-*]\s+", "", line)
            out.append(f"<li>{inline(item_text)}</li>")
        elif line.strip() == "":
            if in_list:
                out.append("</ul>"); in_list = False
        else:
            if in_list:
                out.append("</ul>"); in_list = False
            out.append(f"<p>{inline(line)}</p>")
        i += 1
    if in_list:
        out.append("</ul>")
    return "\n".join(out)


SEVERITY_COLOR = {"critical": "#b3261e", "high": "#c05621", "medium": "#946200", "low": "#4b5563"}


def render(rows, db):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    parts = [f"""<!doctype html><html><head><meta charset="utf-8">
<title>A11yAudit — Review Queue</title>
<style>
body {{ font-family: -apple-system, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }}
h1 {{ font-size: 1.5rem; }}
h2 {{ margin-top: 2.5rem; border-top: 2px solid #ddd; padding-top: 1rem; }}
table {{ border-collapse: collapse; width: 100%; margin: 0.5rem 0; }}
th, td {{ border: 1px solid #ddd; padding: 0.4rem 0.6rem; text-align: left; font-size: 0.9rem; }}
.queue-table th {{ background: #f5f5f5; }}
.badge {{ display: inline-block; padding: 0.1rem 0.5rem; border-radius: 3px; color: white; font-size: 0.8rem; }}
.report {{ background: #fafafa; border: 1px solid #eee; border-radius: 6px; padding: 1rem 1.5rem; margin-top: 0.5rem; }}
blockquote {{ border-left: 3px solid #ccc; margin: 0.3rem 0; padding-left: 0.8rem; color: #555; }}
.meta {{ color: #666; font-size: 0.85rem; }}
</style></head><body>
<h1>A11yAudit — Review Queue</h1>
<p class="meta">Generated {now} · tools/review_dashboard.py · {len(rows)} audit(s) needing review · no live pipeline data changes when you open this file</p>
"""]

    if not rows:
        parts.append("<p><strong>Queue is empty.</strong> Nothing currently needs human review.</p>")
    else:
        parts.append('<table class="queue-table"><tr><th>Page</th><th>Score</th><th>Rules</th><th>Legal</th><th>Open findings</th></tr>')
        for r in rows:
            label = r.get("page_title") or r.get("page_url") or "(pasted text)"
            anchor = f"audit-{r['audit_id']}"
            rules = ", ".join(r.get("triggered_rules") or [])
            legal = "⚠ yes" if r.get("legally_relevant") else "no"
            n_open = len(r.get("open_findings") or [])
            parts.append(
                f'<tr><td><a href="#{anchor}">{html.escape(label)}</a></td>'
                f'<td>{r.get("screening_score", "—")}</td><td>{html.escape(rules)}</td>'
                f'<td>{legal}</td><td>{n_open}</td></tr>'
            )
        parts.append("</table>")

        for r in rows:
            anchor = f"audit-{r['audit_id']}"
            label = r.get("page_title") or r.get("page_url") or "(pasted text)"
            parts.append(f'<h2 id="{anchor}">{html.escape(label)}</h2>')
            parts.append(f'<p class="meta">audit_id: {r["audit_id"]} · created: {r.get("created_at")}</p>')
            findings = r.get("open_findings") or []
            if findings:
                parts.append("<table><tr><th>Severity</th><th>Title</th><th>Reference</th><th>Status</th></tr>")
                for f in findings:
                    color = SEVERITY_COLOR.get(f["severity"], "#666")
                    ref = f.get("wcag_criterion") or (f"{f.get('instrument','')} {f.get('instrument_item','') or ''}".strip()) or "—"
                    parts.append(
                        f'<tr><td><span class="badge" style="background:{color}">{f["severity"]}</span></td>'
                        f'<td>{html.escape(f["title"])}</td><td>{html.escape(str(ref))}</td><td>{f["status"]}</td></tr>'
                    )
                parts.append("</table>")
            report_md = fetch_report(db, r["audit_id"])
            parts.append('<div class="report">')
            parts.append(md_to_html(report_md) if report_md else "<p><em>No report text stored yet.</em></p>")
            parts.append("</div>")

    parts.append("</body></html>")
    return "\n".join(parts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="a11yaudit_dev")
    ap.add_argument("--out", default="review_dashboard.html")
    args = ap.parse_args()

    rows = fetch_queue(args.db)
    html_out = render(rows, args.db)
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(html_out)
    print(f"Wrote {args.out} — {len(rows)} audit(s) in the review queue.")


if __name__ == "__main__":
    main()
