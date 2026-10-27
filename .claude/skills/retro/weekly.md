# Weekly retro

`/retro weekly` turns the week's usage report into a reading and proposals. The `weekly-retro` scheduled task runs it Tuesdays at 09:00 (UTC+7), after the 07:00 report. The prompt of that run starts with `[weekly-retro:scheduled]`.

It proposes and reads. It edits only the vault note `Ref_usage-report.md`, only `### This week` (rewritten whole) and new rows at the bottom of `### Decisions`. No other note, no repo file, no setting.

## Steps

1. **Call the Skill tool with `writing-for-agents`**, then `read_note` `Ref_usage-report.md` through the Obsidian MCP (load its tools with ToolSearch first if they are deferred). Paths are relative to the vault root.

2. **Read Decisions first.** A row's "Your call" cell (`accept`, `reject` or `later`, with an optional note) is the answer. A cell answer wins over anything else, including what a chat reply or an earlier retro said.

3. **Find the week.** It is the last finished week (`week_of(now - 7 days)`, as in `usage-report.md` step 2). The report for it is the `### Report` section whose first paragraph begins `Week <week> (`, and its numbers are in `~/.claude/usage/<week>.json`. With no report for that week, say so on the first line of This week and read the newest `~/.claude/usage/20*.json` instead, naming its week.

4. **Write This week**, in this order:
   - **Waiting.** Each proposal unanswered (`later`, or an empty cell) for 2 weeks or more, with its date and signal. Omit the list when there are none.
   - **Purposes and focus.** One reading per Purposes entry and per `open` Current focus entry. Each cites the numbers it rests on (cost per task, simulator cost per task, rework per task, tokens per unit) and the week they come from.
   - **Experiments.** For each `open` Current focus entry, apply the Experiments step in `SKILL.md`. For model routing, print implement's rework per task for the week next to the worst baseline week (W41 to W43), the two numbers the early-revert rule compares.
   - **Proposed action.** One item from the report's "Where to save", with its cost and the change to try. Add it to Decisions (step 5) unless Decisions already has it.
   - **Setback layers.** The tally from `SKILL.md`, over the Deviation lines of tasks written that week. The report's By phase labels line has the counts. Name the largest layer.
   - **Routing gaps.** The "Routing gaps" step in `SKILL.md`.
   - **Principle pruning.** Only when the week number is a multiple of 4. The "Principle pruning" step in `SKILL.md`.
   - **Results.** For each `accept` row with no Result and a week of data since its date, one line with the row's signal number before and after.

5. **Add Decisions rows** for each new proposal: `| <today> | <proposal> | <signal and where it comes from> | | |`. The "Your call" and Result cells stay empty. Append below the last row.

6. **Write with `patch_note`.** The This week section runs from `### This week` to the line before `### Decisions`; replace exactly that text. For Decisions, replace the last table row with itself plus the new rows. A `$` followed by a backtick in `newString` expands to the whole note, so scan it first. No `write_note`.

7. **Check.** Read the note again. `### This week` and `### Decisions` each appear once, in order, and the sections before and after them (Purposes, Current focus, Report) are unchanged.

8. **Finish** with one line: the week, the number of rows added, and the number waiting.

## Interactive `/retro`

When the user answers a proposal in chat, `read_note` first and read that row's cell. A cell that already holds an answer wins. Tell the user and write nothing. Otherwise `patch_note` the answer into the cell and nothing else in the row.
