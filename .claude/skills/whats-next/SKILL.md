---
name: whats-next
description: Recommend what isotes works on next, what can run alongside it, and what needs the user first (design, decisions, bugs, housekeeping). Use when the user asks what's next, what to work on, or what can run in parallel, and after a feature's acceptance.
---

# What's next

You are the lead proposing the next iteration: one feature to tackle, one that can run alongside it, and what blocks the rest. The user decides. Budget: about 35K tokens. Obsidian MCP paths start at the vault root (`Tasks_backlog.md`); filesystem reads use `/Users/admin/repository/vault/isotes/`.

The only write is step 1's format fix. Every other change is a line you print for the user to apply.

## 1. Backlog format

Find bare lines with `grep -nE '^- ' Tasks_backlog.md | grep -vE ':- \[( |x)\] '`, and ticked lines above Done with `awk '/^## Done/{exit} /^- \[x\]/{print NR": "$0}' Tasks_backlog.md`. A bare `- note` becomes `- [ ] {note} · added {today}`; a ticked line moves under `## Done` with `· done {today}`. Change the format only, never the text. Scan each `newString` for `$` before `patch_note`.

Done when both greps print nothing.

## 2. Read the state

- **Features.** `read_multiple_notes` with `includeContent: false` on every `Feat_*_spec.md` and `Fix_*.md`, 10 per call. Keep `status` draft or in-progress. Record `blocked_by`, `design`, `schema`, `size`, `kind`, `waiting_until`, `next` and the `screen/` and `area/` tags.
- **In progress.** For each in-progress item, `get_notes_info` on its working note (implementation, else planning, else spec): 7 or more days idle with no future `waiting_until` is **stale**. Then `grep -n -A12 '^## Open checks'` on its implementation note (keep items due today or earlier, or undated) and `grep -n -A15 '^## Out of scope, flagged'` on its planning note (keep items not done).
- **Backlog.** `grep -n '^## ' Tasks_backlog.md`, then `sed -n` Critical, Bug and Workflow. Keep open Critical and Bug lines, and Workflow lines whose date or trigger has passed. For Polish, Enhancement and Refactor, count open lines per `screen/` and `area/` tag only. A tag is **orphaned** when it has open lines in those sections and no draft or in-progress spec carries it, so no coming feature will edit that screen and pick them up.
- **Sources.** `PRD.md` section 3 (the v1 goal) and section 6 (the scope table). For each v1 row, find its spec by subject. Compare the row's Design cell with the spec's `design` and with the screen's row in `Ref_claude-design` → Screen map (`grep -n`).

Done when every draft or in-progress spec has its fields recorded, and every PRD v1 row is matched to a spec or listed as **unsplit**.

## 3. Choose

A spec is **ready** when its status is draft, every `blocked_by` link is done, and `design` is ready or not applicable.

Pick **one to tackle**, by the first rule that decides:
1. An open Critical backlog item comes first, as a fix.
2. An in-progress v1 feature continues. Finish before starting.
3. The ready spec closest to the PRD section 3 goal: a real trip logged and settled on TestFlight. A gap in a section 8 flow beats polish, and the smaller size breaks a tie.

Pick **one alongside**: a ready spec or bug that shares no `screen/` or `area/` tag with the pick, and isn't blocked by it, so the two never edit the same files. At most one of the two has `schema: yes`, and at most one needs a native rebuild. Name the runner-up that lost to the pick, and why.

Done when the pick, the one alongside (or "none safe", with the clash) and the runner-up each have a one-line reason.

## 4. Report

At most 25 lines, in this shape:

    **Let's tackle:** [[Feat_x_spec]]: {reason tied to the v1 goal}. Start: {the session to open, e.g. a spec session with `/recall x`, or `/autopilot {phase}`}
    **Alongside:** [[…]]: {why it can't collide}
    **Fix first:** {Critical and Bug items, at most 3, each with its link}
    **Needs you:**
    - design: {spec}: {the board or frame to draw, from Ref_claude-design}
    - decision: {spec}: {the open question from its Notes}
    **Waiting:** {each workflow feature with its waiting_until and next}
    **Runner-up:** [[…]]: {why it lost}
    **Housekeeping:** {overdue open checks, flagged items with their feature, stale features with days idle, unsplit PRD rows, PRD drift, untagged backlog count, orphaned tags with their line counts and a suggested sweep (one small session that clears the tag's Polish and Refactor lines, or a spec when its Enhancement lines add up to a feature)}

Leave out an empty line. Where a fix needs a vault edit (a backlog line, a stale feature's status, a PRD row), print the exact line and its section. Finish with: **"Start on [[Feat_x_spec]]?"**
