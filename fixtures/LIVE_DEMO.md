# Live demo: what to paste into the form

**Written 5 August 2026.** For use only if a reviewer asks to see the system run. The scripted talk does not include a live audit, and there is a good reason for that. See *The trap*, below.

---

## The trap, read this first

**Pasted text produces a deterministic screening score of 100, always.** There is no HTML to check, so the nine code checks find nothing, so nothing is wrong, so the score is 100.

That is the D-36 defect showing itself. On *bad* content it looks like the tool is broken. A reviewer sees a score of 100 above a list of serious problems and stops trusting the screen.

**So: only ever paste content that genuinely deserves a 100 on markup.** Which means the well-written fixture below, not a bad one. If you want to demonstrate a bad page, use the URL route instead, which runs the real checks.

---

## Option A: the safe one. Paste this.

This is `bp-meds-short.html` as plain text: 128 words, well written, already tested as **S5** on 5 August (`decision_log.md` D-37).

### Form fields

| Field | Value |
|---|---|
| `page_url` | *leave empty* |
| `pasted_content` | the text block below |
| `page_title` | `Water tablet leaflet (live demo)` |
| `content_language` | `en` |
| `audience` | `patients and family members` |
| `eaa_scope` | leave unticked |
| `auditor_note` | `live demo during capstone presentation` |

### The text to paste

```
Taking your water tablet

Your doctor has prescribed furosemide, sometimes called a water tablet. It helps your body get rid of extra fluid, so you may notice that you pass urine more often for a few hours after taking it. Take one tablet each morning with a glass of water. Taking it in the morning rather than at night means you are less likely to be woken up during the night.

Tell your practice nurse if you feel dizzy when you stand up, if you become very thirsty, or if your ankles are still swollen after a week. If you feel faint or your heartbeat does not feel normal, this needs to be checked the same day. Call 111 for advice, or 999 if you feel very unwell.
```

### What you will get, and what you can promise

**Say these. They are deterministic and were verified on 5 August:**

- **Safety terms found: `111`, `999`, `tablet`.** The prescreen catches all three.
- **R7 fires.** The page routes to human review.
- **Deterministic screening score: 100.** Honest here, because this content really is well written.
- **PEMAT items 8, 9 and 11 come back `not_applicable`**, because AHRQ exempts very short material.

**Do not promise these. They come from the AI and they move:**

- The **combined** screening score. It came out **42, then 72, then 65** on three identical runs. Whatever appears, do not read it as a property of the page.
- The number of findings.
- Which CCI items fail. (CCI 8 and 9 will probably still fail, because the CDC Index has no short-material exemption. That is correct behaviour, not a bug. See D-37.)

### What to say while it runs

> "This is a well-written leaflet. Short, plain language, tells you what to do and when to get help. I would expect it to score well, and it does: 100 on the reproducible measure.
>
> But watch the status. It still goes to a human, because the safety check found *111*, *999* and *tablet* before the AI was ever called. That's the whole design in one run."

If the combined score comes out low, say so plainly: *"and there's the calibration problem I mentioned: the combined number isn't calibrated for content findings, which is why I quote the deterministic one."* You have already told them this at 8:05, so it lands as consistency rather than an excuse.

---

## Option B: the URL route. Only if Docker is already running well.

This runs the real HTML checks, so the deterministic score means something. More moving parts.

**Setup, before the presentation:**

```
cd <repo-root>/fixtures
python3 -m http.server 8080
```

Leave that terminal window open. Then in the form:

| Field | Value |
|---|---|
| `page_url` | `http://host.docker.internal:8080/bp-meds-poor.html` |
| `pasted_content` | *leave empty* |
| `page_title` | `BP meds, poor page (live demo)` |
| `content_language` | `en` |
| `audience` | `patients and family members` |

**`localhost` will not work.** Inside the n8n container, `localhost` means the container itself, not your Mac. It has to be `host.docker.internal`.

**Expected:** 8 automated findings, deterministic score **52**, R7 fires. Swap `bp-meds-poor.html` for `bp-meds-good.html` and it becomes 0 findings, score **100**, and R7 still fires. That is the before/after live.

---

## Rules for doing this at all

**Only if asked.** The talk does not need it and the deck already carries the evidence.

**Say how long it takes before you press the button.** The AI call is not instant. Silence while a screen does nothing is the worst part of any live demo. *"This takes a few seconds: one call to the model, and it has to come back in a fixed format or my code rejects it."*

**Never re-run the same page to show consistency.** It will not be consistent. That is your slide 9.

**If it fails, say what you told them at 5:45:** the system is built to fail safe. Then open `demo_output/05_report_e11_fallback.md`, which is a complete audit produced with the AI entirely dead. A failure you have already documented is not an embarrassment.

**Two minutes maximum.** Then back to the deck.
