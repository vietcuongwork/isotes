# Setup Guide: Claude Code + Obsidian Vault Workflow

This guide explains how to set up a **structured AI-assisted development workflow** using Claude Code and Obsidian as the documentation layer. The setup creates a system where Claude Code acts as a CEO coordinating specialized AI agents, with Obsidian as the persistent knowledge base across sessions.

---

## Table of Contents

1. [Overview — What This Setup Does](#1-overview--what-this-setup-does)
2. [Prerequisites](#2-prerequisites)
3. [Step 1 — Create the Obsidian Vault](#step-1--create-the-obsidian-vault)
4. [Step 2 — Connect Claude Code to Obsidian via MCP](#step-2--connect-claude-code-to-obsidian-via-mcp)
5. [Step 3 — Create the Global CLAUDE.md](#step-3--create-the-global-claudemd)
6. [Step 4 — Create the Project CLAUDE.md](#step-4--create-the-project-claudemd)
7. [Step 5 — Create Agent Definition Files](#step-5--create-agent-definition-files)
8. [Step 6 — Create Rules Files](#step-6--create-rules-files)
9. [Step 7 — Create Slash Commands](#step-7--create-slash-commands)
10. [Step 8 — Set Up the Memory System](#step-8--set-up-the-memory-system)
11. [Step 9 — Configure Permissions](#step-9--configure-permissions)
12. [Step 10 — Install Plannotator (review gates)](#step-10--install-plannotator-review-gates)
13. [How It All Works Together](#how-it-all-works-together)
14. [Customization Guide](#customization-guide)
15. [Troubleshooting](#troubleshooting)

---

## 1. Overview — What This Setup Does

This system gives Claude Code:

- **Persistent memory across sessions** — via diary entries and documentation in Obsidian. Without this, every new Claude Code conversation starts from zero. With this, Claude reads the last few diary entries and knows exactly where you left off.
- **Structured workflows** — features go through Spec → Planning → Implementation with approval gates, so Claude doesn't run ahead and build the wrong thing.
- **Human review gates via Plannotator** — every spec, planning, solution, and fix document is opened in Plannotator's annotation UI. Claude acts on your annotations and only moves to the next stage once you approve.
- **Specialized agents** — instead of one generic AI, you get domain-expert agents (e.g. Cloudflare, Next.js, Azure, Sitecore) that verify against official docs and produce specific deliverables.
- **A single source of truth** — all project documentation lives in an Obsidian vault with a consistent naming convention, so both you and Claude can find anything quickly.
- **Context preservation** — when Claude's context window fills up (~90%), it saves progress to the diary before compaction and reads it back after, so nothing is lost during long sessions.
- **Token efficiency** — rules that prevent Claude from wasting context on unnecessary agent spawns, verbose responses, or blind iteration.

### The Architecture

```
┌─────────────────────────────────────────────────┐
│                Claude Code                       │
│                                                  │
│  ~/.claude/CLAUDE.md          (Global rules)     │
│  ~/.claude/agents/*.md        (Agent definitions)│
│  ~/.claude/commands/*.md      (Slash commands)   │
│  ~/.claude/projects/.../memory/ (Memory)         │
│  project/CLAUDE.md            (Project rules)    │
│  project/.claude/rules/*.md   (Coding rules)     │
│                                                  │
│   ┌──────────┐   ┌──────────┐   ┌─────────────┐  │
│   │ Obsidian │   │ ADO MCP  │   │ Plannotator │  │
│   │ MCP      │   │(optional)│   │ (plugin)    │  │
│   └────┬─────┘   └──────────┘   └─────────────┘  │
│        │  ◄── .mcp.json                          │
└────────┼─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────┐
│   Obsidian Vault         │
│   ~/Vault/{project}/     │
│                          │
│   Diary_*.md             │
│   Feat_*_spec.md         │
│   Feat_*_planning.md     │
│   Investigate_*.md       │
│   Solution_*.md          │
│   Fix_*.md               │
│   Ref_*.md               │
│   templates/             │
│   ...                    │
└──────────────────────────┘
```

### Components Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| **Obsidian Vault** | `~/Vault/{project-name}/` | Persistent documentation — diaries, feature specs, task breakdowns, investigations |
| **Vault Templates** | `~/Vault/{project-name}/templates/` | Reusable templates for each note type |
| **MCP Config** | `{project}/.mcp.json` | Connects Claude Code to the Obsidian vault (and optionally Azure DevOps) via MCP servers |
| **Global CLAUDE.md** | `~/.claude/CLAUDE.md` | Vault conventions, file naming, frontmatter — applies to ALL projects |
| **Project CLAUDE.md** | `{project}/CLAUDE.md` | Project-specific rules, agent roster, workflows — applies to THIS project |
| **Agent Files** | `~/.claude/agents/*.md` | Domain-expert agent definitions (shared across projects) |
| **Rules Files** | `{project}/.claude/rules/*.md` | Coding standards, architecture rules, checklists — auto-loaded by Claude Code |
| **Slash Commands** | `~/.claude/commands/*.md` | Custom slash commands (`/preserve`, `/recall`) — shared across projects |
| **Plannotator** | Claude Code plugin + `plannotator` CLI | Annotation UI used as the review gate for spec/planning/solution/fix docs |
| **Memory System** | `~/.claude/projects/{path}/memory/` | Persistent learnings — feedback, project context, user preferences |
| **Permissions** | `{project}/.claude/settings.local.json` | Pre-approved tool permissions so Claude doesn't ask every time |

---

## 2. Prerequisites

1. **Claude Code CLI** installed and working
   ```bash
   # Install Claude Code if you haven't
   npm install -g @anthropic-ai/claude-code
   ```

2. **Obsidian** installed on your machine (for viewing/editing vault files with a nice UI)
   - Download from https://obsidian.md
   - You don't strictly *need* Obsidian installed — the vault is just a folder of markdown files — but the Obsidian app gives you graph view, search, and a great editing experience

3. **Node.js** installed (for the MCP server via npx)

4. **A project directory** where you'll be running Claude Code

5. **Plannotator** — the review-gate tool (see [Step 10](#step-10--install-plannotator-review-gates))

6. *(Optional)* **Azure DevOps MCP** — `npm install -g @azure-devops/mcp` if you want Claude to read pipelines, PRs, and work items

---

## Step 1 — Create the Obsidian Vault

### What is it?

The vault is just a folder of markdown files that acts as the **single source of truth** for all project documentation. Claude Code reads and writes to it via MCP tools (not filesystem tools), which means the Obsidian app can also be open simultaneously without conflicts.

### Why a separate folder?

The vault is intentionally **outside** the project codebase. This keeps documentation separate from source code — you don't want diary entries and feature specs cluttering your git repo or showing up in code searches.

### Steps

1. Create the vault directory structure:
   ```bash
   mkdir -p ~/Vault/{your-project-name}/templates
   ```

2. Open Obsidian and add this folder as a vault:
   - Open Obsidian → "Open folder as vault" → select `~/Vault/{your-project-name}`
   - This creates a `.obsidian/` config folder inside (you can ignore it)

3. The vault uses a **flat file structure** with prefix-based naming. No subfolders (except `templates/`) — everything is at the root level. File types are distinguished by their prefix:

   | Prefix | Format | Purpose |
   |--------|--------|---------|
   | `Diary_` | `Diary_YYYY-MM-DD.md` | Daily work summary — what was done, decisions, next steps |
   | `Feat_` | `Feat_{slug}.md` | Feature overview and details |
   | `Debug_` | `Debug_{slug}.md` | Debugging investigation notes |
   | `Tasks_` | `Tasks_{slug}.md` | Task breakdown to achieve a feature or goal |
   | `Test_` | `Test_{slug}.md` | Verification steps for a feature |
   | `Investigate_` | `Investigate_{slug}.md` | Issue investigation — root cause analysis |
   | `Solution_` | `Solution_{slug}.md` | Proposed fix/approach for an investigated issue |
   | `Fix_` | `Fix_{slug}.md` | Task breakdown to implement an issue fix |
   | `Ref_` | `Ref_{slug}.md` | Reference docs — e.g. a repo's folder-structure map, read before traversing that repo |

   Slugs should be lowercase, hyphen-separated (e.g., `Feat_user-auth.md`, `Debug_memory-leak.md`).

   Features use two suffixed `Feat_` files, one per workflow stage: `Feat_{slug}_spec.md` and `Feat_{slug}_planning.md`.

4. Create templates in the `templates/` folder. These are read by Claude on demand when creating new files. Example templates:

   **`templates/Diary_template.md`:**
   ```markdown
   # Diary — YYYY-MM-DD

   ### Session 1
   **Time:** HH:MM

   **Accomplished:**
   -

   **Decisions:**
   -

   **Next Steps:**
   -

   **Blockers:**
   -
   ```

   **`templates/Feat_template.md`:**
   ```markdown
   # Feature — {title}

   ## Overview


   ## Requirements


   ## Progress

   - [ ]

   ## Notes

   ```

   **`templates/Tasks_template.md`:**
   ```markdown
   # Tasks — {title}

   ## Goal


   ## Task List

   - [ ]

   ## Notes

   ```

   **`templates/Debug_template.md`:**
   ```markdown
   # Debug — {title}

   ## Problem


   ## Investigation


   ## Root Cause


   ## Resolution

   ```

   **`templates/Test_template.md`:**
   ```markdown
   # Test — {title}

   ## Feature


   ## Prerequisites


   ## Test Steps

   - [ ]

   ## Expected Results


   ## Actual Results

   ```

   **Recommended — templates for the issue-resolution and reference notes.** The five above are the minimum. The issue workflow produces `Investigate_`/`Solution_`/`Fix_` notes more often than any other type, so give them templates too:

   **`templates/Investigate_template.md`:**
   ```markdown
   # Investigate — {title}

   ## Issue Summary


   ## Affected Files


   ## Execution Flow


   ## Root Cause


   ## Impact

   ```

   **`templates/Solution_template.md`:**
   ```markdown
   # Solution — {title}

   See [[Investigate_{slug}]]

   ## Proposed Fix


   ## Edge Cases


   ## Tradeoffs / Alternatives Considered

   ```

   **`templates/Fix_template.md`:**
   ```markdown
   # Fix — {title}

   See [[Solution_{slug}]]

   ## Tasks

   - [ ] Task 1 — {one small, non-breaking, revertible change} — `path/to/file`

   ## Notes

   ```

   **`templates/Ref_template.md`:**
   ```markdown
   # Ref — {title}

   ## Scope


   ## Structure / Details

   ```

5. **Frontmatter on every note.** Every vault note carries frontmatter. Claude sets it through the `frontmatter` parameter of `write_note`:

   | Field | Required | Values | Notes |
   |-------|----------|--------|-------|
   | `created` | All files | `YYYY-MM-DD` | Date the note was created |
   | `tags` | All files | `string[]` | Component/topic tags (e.g. `dmw`, `cloudflare`, `pipeline`) |
   | `status` | Non-diary files | `draft`, `in-progress`, `done`, `archived` | Current state of the work |
   | `related` | Non-diary files | Wiki-link string | Cross-reference (e.g. `"[[Feat_user-auth]]"`) |

   Diary files need only `created` and `tags`. With `status` in place, Obsidian search or Dataview can list, say, every `in-progress` investigation.

### Why flat structure?

- Simpler for AI to navigate — no nested paths to get wrong
- Prefix-based naming makes it easy to search and filter
- Obsidian's search and graph view work great with flat structures

### Why templates in the vault?

Templates are stored in the vault (not embedded in CLAUDE.md) to keep the global instructions lean. Claude reads them on demand when creating a new file. This means you can update templates without touching CLAUDE.md, and the templates don't consume context window space unless they're actually needed.

### Wiki-Links (Graph View)

One of Obsidian's most powerful features is the **Graph View** — it visualizes connections between notes as an interactive node graph. To enable this, use `[[wiki-links]]` instead of plain text references when cross-referencing notes.

**How it works:**
- Write `[[Feat_user-auth]]` (without `.md`) to create a clickable link to that note
- Obsidian automatically creates **backlinks** — if Note A links to Note B, opening Note B shows that Note A references it
- The **Graph View** draws lines between linked notes, so you can see how features, investigations, fixes, and diaries connect

**Example chain:**
```
Diary_2026-03-21 → links to [[Investigate_auth-token-spam]]
                 → links to [[Solution_auth-token-spam]]
                 → links to [[Fix_auth-token-spam]]
                 → links to [[Feat_auth-rework]]
```

In the graph view, you'd see these notes connected in a chain — making it easy to trace the full history of an issue from discovery to fix.

**Rule for Claude:** In the global CLAUDE.md, we tell Claude to use `[[Note Name]]` syntax (without `.md`) when referencing other vault documents. This ensures all cross-references become actual Obsidian links.

---

## Step 2 — Connect Claude Code to Obsidian via MCP

### What is MCP?

MCP (Model Context Protocol) lets Claude Code communicate with external tools. In this case, we use an Obsidian MCP server that gives Claude Code tools to read, write, search, and manage notes in your vault — without touching the filesystem directly.

### Why MCP instead of filesystem?

- MCP tools are designed for Obsidian's format (frontmatter, note linking, etc.)
- They prevent Claude from accidentally corrupting vault files
- The Obsidian app and Claude Code can work on the vault simultaneously
- It enforces a clean separation: code files via filesystem tools, documentation via MCP tools

### Steps

1. Create `.mcp.json` in your **project root** (not in the vault, not in `~/.claude`):

   ```json
   {
     "mcpServers": {
       "obsidian": {
         "type": "stdio",
         "command": "npx",
         "args": [
           "-y",
           "@mauricio.wolff/mcp-obsidian",
           "/absolute/path/to/your/Vault/{your-project-name}"
         ],
         "env": {}
       },
       "azure-devops": {
         "type": "stdio",
         "command": "node",
         "args": [
           "/absolute/path/to/npm/node_modules/@azure-devops/mcp/dist/index.js",
           "{your-ado-organization}"
         ],
         "env": {}
       }
     }
   }
   ```

   **Important:** Use the **absolute path** to your vault. Replace `/absolute/path/to/your/Vault/{your-project-name}` with the actual path. On Windows use forward slashes, e.g. `C:/Users/john/Vault/MyProject`.

   **The server name sets the tool names.** A server called `obsidian` exposes tools named `mcp__obsidian__<tool>`. If you pick a different name, use that same name everywhere a tool is mentioned: the permissions in Step 9, CLAUDE.md, and the agent files.

   **`azure-devops` is optional.** Drop that entry if you don't use Azure DevOps. The global npm root in the path comes from `npm root -g`.

2. Verify it works by starting Claude Code in your project directory:
   ```bash
   cd /path/to/your/project
   claude
   ```

   Then ask Claude: "List the files in my Obsidian vault"

   Claude should use `mcp__obsidian__list_directory` and show you the vault contents. If it asks which MCP server to enable, select `obsidian`.

### Available MCP Tools

Once connected, Claude Code gets these tools:

| Tool | Purpose |
|------|---------|
| `mcp__obsidian__list_directory` | List files and folders in the vault |
| `mcp__obsidian__read_note` | Read a single note |
| `mcp__obsidian__read_multiple_notes` | Read up to 10 notes at once |
| `mcp__obsidian__write_note` | Create or overwrite a note (with `frontmatter`) |
| `mcp__obsidian__patch_note` | Append to or modify part of a note |
| `mcp__obsidian__delete_note` | Delete a note |
| `mcp__obsidian__search_notes` | Search notes by content |
| `mcp__obsidian__manage_tags` | Add/remove tags |
| `mcp__obsidian__get_frontmatter` | Read note metadata |
| `mcp__obsidian__update_frontmatter` | Update note metadata |
| `mcp__obsidian__get_notes_info` | Get metadata for several notes at once |
| `mcp__obsidian__move_note` / `move_file` | Move/rename a note or file |
| `mcp__obsidian__get_vault_stats` | Get vault statistics |

---

## Step 3 — Create the Global CLAUDE.md

### What is it?

`~/.claude/CLAUDE.md` contains instructions that apply to **every project** you work on with Claude Code. This is where you put the Obsidian integration rules, session protocols, and file naming conventions — things that are project-agnostic.

### Why global?

You want the same diary workflow, the same session protocols, and the same file naming conventions regardless of which project you're working on. Putting these in the global file means you don't have to duplicate them in every project.

### Steps

1. Create the file:
   ```bash
   mkdir -p ~/.claude
   ```

2. Write `~/.claude/CLAUDE.md` with the following content. **Read the comments (marked with `<!-- -->`) to understand each section, then remove them:**

   ```markdown
   # Claude Code — Obsidian Vault Integration

   ## Vault Convention

   Each project has its own Obsidian vault located at `~/Vault/{project-name}/`.
   The vault uses a **flat file structure** with prefix-based naming to distinguish file types.

   ## File Types & Naming

   | Prefix | Format | Purpose |
   |--------|--------|---------|
   | `Diary_` | `Diary_YYYY-MM-DD.md` | Daily work summary for the project |
   | `Feat_` | `Feat_{slug}.md` | Feature overview and details |
   | `Debug_` | `Debug_{slug}.md` | Debugging investigation notes |
   | `Tasks_` | `Tasks_{slug}.md` | Task breakdown to achieve a feature or goal |
   | `Test_` | `Test_{slug}.md` | Verification steps for a feature |
   | `Investigate_` | `Investigate_{slug}.md` | Issue investigation — root cause analysis |
   | `Solution_` | `Solution_{slug}.md` | Proposed fix/approach for an investigated issue |
   | `Fix_` | `Fix_{slug}.md` | Task breakdown to implement an issue fix |
   | `Ref_` | `Ref_{slug}.md` | Reference docs (e.g. repo structure maps) |

   Slugs should be lowercase, hyphen-separated (e.g., `Feat_user-auth.md`, `Debug_memory-leak.md`).

   <!-- TEMPLATES: Stored in the vault, not inline here. This keeps the global CLAUDE.md
        lean and means templates don't consume context window space unless needed. -->
   ## Templates

   Templates are stored in the vault at `~/Vault/{project-name}/templates/`. Read them on demand when creating a new file — do not memorize them.

   <!-- FRONTMATTER: Makes notes filterable by status/tag in Obsidian. -->
   ## Frontmatter Convention

   All vault notes must include frontmatter. Use the `frontmatter` parameter when calling `write_note`.

   | Field | Required | Values | Notes |
   |-------|----------|--------|-------|
   | `created` | All files | `YYYY-MM-DD` | Date the note was created |
   | `tags` | All files | `string[]` | Component/topic tags (e.g. `dmw`, `cloudflare`, `pipeline`) |
   | `status` | Non-diary files | `draft`, `in-progress`, `done`, `archived` | Current state of the work |
   | `related` | Non-diary files | Wiki-link string | Cross-reference (e.g. `"[[Feat_user-auth]]"`) |

   Diary files only need `created` and `tags`. All other file types use all four fields.

   ## General Rules

   - Always use the Obsidian MCP tools to read/write vault files — never use filesystem tools for vault content
   - Keep diary entries concise but informative — focus on what matters for future context
   - When multiple sessions happen in one day, number them sequentially and keep each session's notes self-contained
   - Cross-reference related files using Obsidian wiki-links (e.g., "See [[Feat_user-auth]]") so connections appear in the graph view and backlinks panel
   ```

### What each section does:

- **Vault Convention** — tells Claude where to find the vault and how it's organized
- **File Types & Naming** — the prefix system so all files are consistently named
- **Templates** — points to the vault's `templates/` folder instead of embedding templates inline (keeps this file lean)
- **Frontmatter Convention** — consistent metadata so notes can be filtered by status and tag
- **General Rules** — enforces MCP tools over filesystem, cross-referencing, and conciseness

### Why no startup protocol?

An earlier version of this setup ran a 6-step startup protocol on every session: list vaults, ask which project, read 3 days of diaries, summarize, then ask "ready?". It wasted tokens every time, because most of the time you already know what you want to work on. There is deliberately **no** startup section and **no** `SessionStart` hook forcing vault reads. Jump straight in, and pull context when you need it with `/recall` or by asking directly.

Diaries follow the same principle: write one only when meaningful work was done (implementation, debugging, planning), usually via `/preserve`. Skip them for quick questions.

---

## Step 4 — Create the Project CLAUDE.md

### What is it?

`{project-root}/CLAUDE.md` contains instructions specific to **this project**. This is where you define:
- What the project is
- Token efficiency rules
- The agent roles and roster
- Development workflows (feature delivery, issue resolution, e2e testing)
- Project-specific rules

### Why separate from global?

Global CLAUDE.md handles the Obsidian integration mechanics. Project CLAUDE.md handles **how work gets done** on this specific project. Different projects might have different tech stacks, different team structures, different workflows.

### Steps

1. Create `CLAUDE.md` in your project root directory.

2. Below is a **template** you should adapt for your project. The example below shows the structure — replace the project details, tech stack, and agent definitions with your own:

   ```markdown
   # {Project Name} — Project Rules

   ## Token Efficiency Rules

   <!-- These rules prevent Claude from wasting context on unnecessary work.
        They are learned from experience — each one addresses a real problem. -->

   - **Never spawn agents for simple edits** — if the task is find-and-replace, color changes, or modifying < 10 lines across files, do it directly with Edit tool
   - **Use Edit over Write** — only use Write for new files. For modifications, always use Edit with the smallest possible old_string/new_string
   - **Research agents must be concise** — when spawning research agents, include "Return a concise summary under 500 words" in the prompt
   - **Check structure docs before traversing** — before exploring a repo's folder layout, read its structure reference doc from the Obsidian vault first (e.g. `[[Ref_{repo}-structure]]`). This saves tokens on directory listing and glob discovery. When spawning agents, include the relevant structure doc path in the prompt so they start oriented.
   - **Investigate before fixing** — never attempt more than 2 fixes for the same issue without stopping to investigate the root cause first
   - **No blind iteration** — if a fix doesn't work, STOP. Explain what you tried and why it failed. Ask the user before trying another approach

   ## Project Overview

   {Describe your project in 2-3 sentences. What is it? Who is it for?}

   - **Monorepo structure:** (or however your project is organized)
     - `{folder}` — {description} ({tech stack})
     - `{folder}` — {description} ({tech stack})
   - **Database:** {your database}
   - **Cache:** {your cache, if any}
   - **Infrastructure:** {where it's deployed}
   - **Notifications:** {notification channels, if any}

   ## Role

   <!-- Define Claude's role and list your agents. Adjust the roster to match your project. -->

   You are a **Chief Executive Officer** coordinating a team of specialized agents to deliver features for this project. Your agents are:

   | Agent | Role | Agent File | Expertise |
   |---|---|---|---|
   | **{Agent 1}** | {Role} | `{path-to-agent-file}` | {One-line expertise} |
   | **{Agent 2}** | {Role} | `{path-to-agent-file}` | {One-line expertise} |

   As CEO, you connect these agents to achieve project goals — delegating research, design, implementation, and testing to the right agent at the right time.

   ## Development Workflow

   <!-- Define how different types of work should be handled in your project.
        The structure below is a recommended starting point — adapt it to your needs.
        The key principles are:
        - Features go through phases with STOP gates for your review
        - Bugs follow an investigation-first approach
        - Small tasks skip the ceremony and just get done -->

   All output files are written to the **Obsidian vault** using wiki-links for cross-referencing.

   ### Work Classification

   | Work Type | What to do |
   |-----------|------------|
   | **Feature** (new capability) | Spec → Planning → Implement |
   | **Bug fix** (issue resolution) | Investigate → Solution → Fix |
   | **Small task** (config, typo, one-file edit) | Just do it |

   <!-- PLANNOTATOR GATE: every document below marked "Review with Plannotator" goes
        through this same loop. Define it once, reference it per step. -->
   ### Plannotator Review Gate

   After writing a gated document, run `plannotator annotate <absolute-path-to-doc>` and act on the result:
   - **Approved** → acknowledge and STOP (do not start the next stage without explicit user go-ahead)
   - **Dismissed** (empty / closed) → acknowledge and STOP; ask whether to proceed
   - **Annotated** → address every annotation, update the doc, then re-run Plannotator until approved or dismissed

   ### Feature Workflow

   **Step 1 — Spec** → `Feat_{slug}_spec.md`
   - Agents: relevant experts
   - Single document covering both business (requirements, user stories, edge cases, acceptance criteria) and technical aspects (architecture, data model changes, API contracts, integration points)
   - Must be created BEFORE any implementation begins
   - **Review with Plannotator**, then STOP

   **Step 2 — Planning** → `Feat_{slug}_planning.md`
   - Break into small, non-breaking, revertible tasks covering the full scope
   - **Review with Plannotator**, then STOP

   **Step 3 — Implement**
   - Follow the task breakdown — one task at a time
   - Do NOT start without a verified planning file

   ### Issue Resolution Workflow

   **Step 1 — Clarify** — ask the user if anything is unclear
   **Step 2 — Investigate** → `Investigate_{slug}.md` — issue summary, affected files, execution flow, root cause, impact. STOP for review
   **Step 3 — Propose Solution** → `Solution_{slug}.md` — design fix with edge cases and tradeoffs. **Review with Plannotator**, then STOP
   **Step 4 — Task Breakdown** → `Fix_{slug}.md` — small, non-breaking, revertible tasks, each naming the file(s) to change. **Review with Plannotator**, then STOP
   **Step 5 — Implement** — assign each task to the relevant expert agent, one task at a time

   ## Context Preservation

   When the context window approaches ~90% capacity:
   1. **Before compaction**: Update today's `Diary_YYYY-MM-DD.md` in the Obsidian vault with current progress — what's been accomplished, current task in progress, decisions made, and next steps
   2. **After compaction**: Read the latest diary entry from the Obsidian vault to restore context and continue seamlessly
   3. **At natural milestones**: Also update the diary during long sessions, not only at session end or compaction

   ## Error Recovery

   When something breaks: **STOP.** Assess whether you can fix it (low-risk, obvious fix) or need to ask the user (architectural issue, unclear requirements, data risk). If the planning doc no longer matches reality, update the plan first — never silently deviate. For critical issues (data corruption, security, production risk), alert the user and do NOT attempt a fix without approval.

   ## No Assumptions Policy

   **ASSUMPTIONS ARE FORBIDDEN.** If confidence about any aspect of a feature, requirement, or task is below 90%, you or any agent MUST stop and ask the user for clarification before proceeding. Never fill in gaps with guesses — always ask.

   ## Task Creation Rules

   - Before implementing any feature, a planning `.md` file with ALL tasks MUST exist.
   - If a directory/location is not provided, MUST ask for that location.
   - Tasks should be detailed and small — each task does ONLY 1 thing.
   - When asked to create a plan or task list, STOP after creating the artifact. Do NOT proceed with implementation unless explicitly verified.
   ```

### Key Concepts Explained:

**Why Token Efficiency Rules?**
Without these, Claude wastes context by spawning agents for trivial edits, using Write instead of Edit (sending the entire file instead of a diff), or blindly retrying fixes. These rules are learned from real usage — each one addresses a pattern that wasted time or tokens.

**Why the CEO role?**
Without a clear role, Claude tries to do everything itself in one shot. The CEO role makes it delegate to specialized agents, which means each agent has focused instructions and produces specific deliverables. It also creates natural approval gates — the CEO stops after each phase to check with you.

**Why phased workflows with STOP gates?**
This prevents the classic AI mistake of jumping straight to code. Phased workflows (Spec → Planning → Implement) ensure features are well-understood before implementation begins. Each STOP gate forces Claude to show you its work and wait for approval. Without these, Claude will happily write a plan and immediately start coding — often the wrong thing.

**Why Plannotator instead of "present for review"?**
Reviewing a long spec in the terminal means pasting feedback back as free text. Plannotator opens the document in an annotation UI where you comment on specific lines. Claude receives structured annotations, fixes each one, and re-opens the doc until you approve. That makes the STOP gate an explicit approve / annotate / dismiss decision instead of a vague "looks good?".

**Why structure docs in the vault?**
Exploring a large repo with `ls`/Glob costs many tokens every session. One `Ref_{repo}-structure.md` note, read at the start of an investigation (and passed to spawned agents), orients Claude in a single read.

**Why "STOP after creating artifacts"?**
Without this rule, Claude will create a planning doc and immediately start implementing. The STOP rule forces it to show you the plan first and wait for your approval. This is crucial for maintaining control.

**Why "No Assumptions"?**
AI will happily fill in gaps with plausible-sounding guesses. This rule forces it to ask you instead, which prevents it from building the wrong thing.

---

## Step 5 — Create Agent Definition Files

### What are agents?

Agents are markdown files in `~/.claude/agents/` (global) or `{project}/.claude/agents/` that define specialized roles. When Claude Code runs in "agent mode," it reads the agent file and follows those specific instructions. Each agent has:
- A role description
- Context (which files to read before starting)
- Responsibilities (what it does during planning vs implementation)
- Rules (constraints it must follow)
- Output format (what deliverable it produces)

### Why agents?

A single AI trying to be a business analyst, frontend developer, backend developer, and QA engineer simultaneously will produce mediocre results in all areas. Specialized agents:
- Have focused, domain-specific instructions
- Produce consistent deliverable formats
- Follow role-appropriate rules (a BA thinks about user stories, a developer thinks about code architecture)
- Can be invoked independently or in sequence

### Steps

1. Create the agents directory — either at **project level** or **global level**:
   ```bash
   # Project-level (only available in this project)
   mkdir -p {project-root}/.claude/agents

   # OR global (available across all projects)
   mkdir -p ~/.claude/agents
   ```

   Use project-level for project-specific roles. Use global for agents you want across all projects. **This setup keeps all agents global** (`~/.claude/agents/`): domain experts such as Cloudflare or Azure are useful in every project. Project-specific context comes from the project's `CLAUDE.md` and `.claude/rules/`, which Claude Code loads automatically.

2. Create agent files. Each file starts with **YAML frontmatter**. Claude Code uses it to list the agent as a `subagent_type`, and the `description` is what makes Claude pick it:

   ```markdown
   ---
   name: cloudflare-expert
   description: |
     Senior Cloudflare engineer with deep expertise in Workers, KV, Cache API,
     edge caching, wrangler, and security. Use for any Cloudflare question,
     implementation, debugging, architecture decision, or code review.
     Always verifies against latest official docs before answering.
   tools: Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch
   model: opus
   skills:
     - cloudflare
     - wrangler
   ---

   # Cloudflare Expert Agent
   ...
   ```

   - `tools` — restrict to what the role needs. A pure researcher might get only `WebSearch, WebFetch, Read, Grep, Glob`
   - `model` — optional. Pin a stronger model for expert agents
   - `skills` — optional. Preloads installed skills the agent should lean on

3. The body follows one of two styles.

   **Domain-expert style (used in this setup).** The agent is a senior engineer for one technology, and its most important rule is *verify against the latest official docs before answering*. That rule matters because model knowledge of fast-moving platforms goes stale. Typical sections: *Your expertise*, *How you work* (docs-first, cite sources), *Rules*, *Output*.

   **Role style (BA / FE / BE / QA).** Useful when you want delivery roles rather than technology experts. Template:

### Agent Template (role style)

```markdown
# {Role Title} — {Specialization}

## Role

You are a {seniority} {role} specializing in {domain/tech stack}.

## Context

- Project location: `{path}/`
- Read `{path}/CLAUDE.md` for coding rules before writing any code
- Read the relevant spec/planning docs from the Obsidian vault before starting

## Tech Stack

- **Framework:** {e.g., Next.js, NestJS, Django}
- **Language:** {e.g., TypeScript, Python}
- {Add more as relevant to the role}

## Responsibilities

### During Planning
- {What this agent contributes to planning phase}

### During Implementation
- {What this agent does during implementation}

## Reasoning Process

1. {Step-by-step thinking process the agent should follow}
2. {Find existing patterns in the codebase first}
3. {Implement following those patterns}
4. {Verify the work}

## Rules

- Each task = one small, non-breaking, revertible change
- STOP after creating planning artifacts. Do NOT implement unless explicitly asked.
- {Add role-specific rules}

## Self-Verification Checklist

- [ ] {Checks the agent runs before finalizing work}
- [ ] {e.g., TypeScript compiles, tests pass, no hardcoded strings}
```

### Example Agents

Here are some common agent roles — pick the ones relevant to your project:

| Agent | File | Good for |
|-------|------|----------|
| Frontend Developer | `fe-dev.md` | React/Next.js/Vue component work, UI implementation |
| Backend Developer | `be-dev.md` | API design, database, server-side logic |
| Business Analyst | `ba.md` | Requirements, user stories, acceptance criteria |
| QA Engineer | `qa.md` | Test documentation, e2e test planning |
| Investigator | `investigator.md` | Bug investigation, root cause analysis |
| Designer | `designer.md` | Design system, mockups, visual consistency |
| DevOps | `devops.md` | Infrastructure, CI/CD, deployment |
| Cloudflare Expert | `cloudflare-expert.md` | Workers, edge caching, WAF |
| Next.js Expert | `nextjs-expert.md` | SSR, ISR, App Router, caching |
| Azure Expert | `azure-expert.md` | ADO Pipelines, App Service, FrontDoor |
| Sitecore Expert | `sitecore-expert.md` | XM Cloud, Content SDK, CLI, serialization |

You don't need all of these. Start with the roles that match your team's actual work — you can always add more later.

### Research pipeline agents (scout → analyst)

For deep research topics, split the work across two agents:

- **Scout** (e.g. `cf-cache-scout.md`) — online research only, never writes files. Tools: `WebSearch, WebFetch, Read, Grep, Glob`
- **Analyst** (e.g. `cf-cache-analyst.md`) — receives the scout's condensed findings and writes a fully-referenced report. Tools: `Write, Read`. Never invoked directly for research

Both share two protocol files in the same folder, which the agents read (they are not agents themselves):

- `PROTOCOL.md` — the research protocol. Online-first (never training data), ask when confidence < 90%, fetch at most 3 URLs per topic, summarize immediately. Phases: context gathering → online research → confidence check → hand-off
- `OUTPUT.md` — the report format: file naming, and a mandatory inline reference on every claim

Keeping the raw fetched pages inside the scout means the analyst, and your main context, only see the condensed findings.

### Tips

- **Be specific about context** — tell agents which files to read before starting, where the codebase lives, and what tech stack to use
- **Include a reasoning process** — step-by-step thinking produces better results than just listing responsibilities
- **Add self-verification checklists** — agents will actually check their own work against these before finishing
- **Write the `description` for selection** — say *when* to use the agent ("Use for any X question, debugging, code review"), not just what it knows
- **Reference them in your project CLAUDE.md** — list your agents in a roster table so the CEO role knows who to delegate to

---

## Step 6 — Create Rules Files

### What are rules?

Rules files in `.claude/rules/` are **automatically loaded** by Claude Code whenever it starts a session in your project. Unlike agent files (which are loaded on demand), rules are always active. This makes them ideal for coding standards, architecture conventions, and checklists that should apply to every interaction.

### Why separate from CLAUDE.md?

Rules files let you organize coding standards by domain (e.g., architecture rules, code style, post-implementation checklists) without bloating the main CLAUDE.md. They're also easier to update independently.

### Steps

1. Create the rules directory:
   ```bash
   mkdir -p {project-root}/.claude/rules
   ```

2. Create rule files for your project. Each file should focus on one domain. Examples:

### Architecture Rules (`{project-name}-architecture.md`)

Define your architectural patterns and conventions:

```markdown
# Architecture: Server-First

- **Server Components by default** — only add `'use client'` when needed
- **Data fetching in Server Components** — use server-side helpers directly
- **All API requests include `X-Platform: {platform}`** — handled by the API helper

# Data Fetching

### Server Components (primary pattern)
{code examples showing the established pattern}

### Caching
{code examples showing caching patterns}

# Mutations — Server Actions Only
{code examples showing mutation patterns}
```

### Code Style (`{project-name}-code-style.md`)

Define your coding standards:

```markdown
# React Patterns

- **No synchronous setState inside useEffect** — causes cascading renders
  - Valid alternatives: useMemo, event handlers, direct prop usage
  - Only valid use: setState inside async callbacks (fetch, subscriptions)

# Code Style

- **TypeScript** — no `any` type without justification
- **i18n** — all user-facing strings use translation keys
- **Forms** — use {your form library}
- **Styling** — {your CSS approach} + CSS variable tokens for dark mode
```

### Post-Implementation Checklist (`{project-name}-checklist.md`)

Define checks that must happen after every code change:

```markdown
# Post-Implementation Checklist

- **Verify all callers on function changes**: When modifying a function's return type, search for ALL callers
- **Run TypeScript check after changes**: `npx tsc --noEmit`
- **No hardcoded user-facing text**: ALL user-facing text MUST use translation keys
- **Verify BE response shape before wiring FE**: `curl` the endpoint to confirm fields exist
```

### Key Points

- Rules files are auto-loaded — no need to reference them from CLAUDE.md
- Keep each file focused on one domain
- Use concrete code examples where possible
- These rules apply to **all** agent interactions in the project

### Grow rules from real incidents

Over time the rules files become the project's hard-won knowledge base, and most entries come from `/preserve`'s "review session lessons" step. For an entry to still be trustworthy months later, write it in this shape:

- **Bold one-line rule** stating the constraint or pattern
- **The mechanism** — *why* it happens, not just what to do
- **The tell** — how to recognise the failure when you hit it again (exact error text, the asymmetry that gives it away)
- **How to apply** — the concrete fix or check
- **Provenance** — `Verified YYYY-MM-DD` / `Origin: <file>`, plus a `[[wiki-link]]` to the vault Investigate/Solution note that holds the full write-up

Keep the long root-cause narrative in the vault and only the actionable rule in `.claude/rules/`. Rules are loaded on every session, so every line costs tokens.

---

## Step 7 — Create Slash Commands

### What are slash commands?

Slash commands are custom shortcuts defined in `~/.claude/commands/` (global) or `{project}/.claude/commands/` that you can invoke by typing `/command-name` in Claude Code. They execute a predefined prompt — useful for frequently repeated workflows.

### Why slash commands?

Instead of typing "save context to diary, check if vault docs need updating, review session lessons" every time you finish working, you just type `/preserve`. Instead of typing "read recent diaries and related docs to catch me up on topic X", you type `/recall topic`.

### Steps

1. Create the commands directory. This setup keeps `/preserve` and `/recall` **global**, because they only depend on the vault convention, which is the same in every project:
   ```bash
   # Global (used in this setup)
   mkdir -p ~/.claude/commands

   # OR project-level, for project-specific commands
   mkdir -p {project-root}/.claude/commands
   ```

2. Create command files. Each file's content becomes the prompt that runs when the command is invoked.

### `/preserve` — Save session context (`preserve.md`)

This command saves your current session's work to the vault:

```markdown
Save the current session context to the Obsidian vault.

Follow these steps:

1. **Create or update today's `Diary_YYYY-MM-DD.md`** in the vault:
   - If the file already exists, append a new session section — do NOT overwrite earlier entries
   - Use session headers like `### Session 1`, `### Session 2`, etc.
   - Read the diary template from `templates/Diary_template.md` if creating a new file
   - Include: what was accomplished, decisions made, next steps, blockers

2. **Check if any vault documents need updating** — if progress was made on a feature, investigation, or task list, tell the user which documents you'd like to update and what changes you'd make. **Wait for permission before writing.**

3. **Review session lessons** — reflect on mistakes, surprises, or patterns learned during the session. For each lesson, decide where it belongs:
   - **Rules** (`.claude/rules/`) — coding patterns, technical constraints, conventions that apply to future code
   - **Memory** (`memory/`) — user preferences, workflow feedback, tool usage quirks
   - **Obsidian vault** — project-specific knowledge, investigation findings, decisions tied to a specific feature
   - **Skip** — if the fix is already in the code and won't recur, don't save it anywhere
   Present the lessons and proposed destinations to the user. **Wait for confirmation before writing.**

4. Confirm what was saved.
```

### `/recall` — Restore context (`recall.md`)

This command pulls up context for a specific topic:

```markdown
Recall context for: $ARGUMENTS

Follow these steps:

1. Read the 3 most recent `Diary_*` files from the Obsidian vault (use `search_notes` to find them, sorted by date descending)
2. Search the vault for high-level documents related to the topic — look for `Feat_*`, `Investigate_*`, `Solution_*`, and `Tasks_*` files that match the subject
3. Read only the matching documents (skip implementation-level files like `Fix_*` or `Test_*` unless they seem directly relevant)
4. Summarize what you found:
   - Recent activity from diaries
   - Related feature/investigation docs and their current status
   - Any open tasks or blockers
5. Ask: **"Anything else you'd like me to pull up?"**

Keep it concise. Do not read more than 5-6 documents total. Use parallel reads where possible.
```

### How to use

- `/preserve` — run at the end of a session or before switching topics
- `/recall auth` — pulls up context related to authentication work
- `/recall` (no args) — reads recent diaries and gives a general status update

### Adding more commands

You can create commands for any repeated workflow:
- `/review` — code review checklist
- `/deploy` — deployment checklist
- `/standup` — generate a standup summary from recent diaries

Each command is just a markdown file with the prompt. The `$ARGUMENTS` placeholder captures any text after the command name.

Installed plugins can also add commands. Plannotator (Step 10) adds `/plannotator-annotate`, `/plannotator-review`, and `/plannotator-last`.

---

## Step 8 — Set Up the Memory System

### What is it?

Claude Code has a built-in auto-memory system that persists information across conversations. It stores memories as markdown files with frontmatter metadata, indexed by a `MEMORY.md` file.

### Why do you need it?

Without memory, every conversation starts from scratch. Memory stores:
- **Feedback** — corrections you've given Claude ("don't do X", "always do Y")
- **Project context** — structural information about the codebase
- **User preferences** — how you like to work
- **References** — where to find things in external systems

### How it works

The memory directory is at:
```
~/.claude/projects/{encoded-project-path}/memory/
```

The `{encoded-project-path}` is your project's absolute path with `/` replaced by `-`. For example:
- Project at `/Users/john/projects/MyApp` → memory at `~/.claude/projects/-Users-john-projects-MyApp/memory/`
- On Windows, `:` and `\` are replaced too: `C:\Users\john\works` → `~/.claude/projects/C--Users-john-works/memory/`

Memory is scoped to the directory you launch `claude` from. Launch from the workspace root (e.g. `works/`) rather than from individual repos, so every repo shares one memory and one set of rules.

### Steps

1. The memory directory is **created automatically** by Claude Code. You don't need to create it manually.

2. **To seed initial memories**, you can tell Claude things like:
   - "Remember that we always use Obsidian MCP tools for project docs, never filesystem tools"
   - "Remember to always verify import paths with grep/glob, never assume file locations"
   - "Remember that our commit messages should be short with no co-author tag"

   Claude will create memory files automatically.

3. **Key memories to establish early** (tell Claude these in your first few sessions):
   - Use Obsidian MCP tools for docs (not filesystem)
   - Write diary before context compaction
   - Never assume — ask if confidence < 90%
   - Verify import paths with grep/glob, never assume file locations
   - Your commit style preferences
   - Never push to git remote without explicit approval

4. Over time, Claude will also save memories on its own when it learns things about the project or receives corrections from you.

### Memory File Format

Each memory file looks like this:

```markdown
---
name: use-obsidian-for-docs
description: Always use Obsidian MCP tools (not filesystem) to read/write project documentation
metadata:
  type: feedback
---

Always use Obsidian MCP tools to read and edit project documents — never use filesystem tools for vault content.

**Why:** The Obsidian vault is the source of truth for project documentation.

**How to apply:** When reading or editing any project documentation, use mcp__obsidian__read_note, write_note, patch_note, etc. See also [[verify-agent-claims]].
```

- `name` is a short kebab-case slug. Other memories link to it with `[[name]]`
- `type` sits under `metadata:`
- **Every memory file needs a one-line pointer in `MEMORY.md`** (`- [Title](file.md) — hook`). `MEMORY.md` is the only memory file loaded each session, so a memory file with no index line is never recalled. After Claude saves a memory, check that the pointer was added.

### Memory Types

| Type | Purpose | Example |
|------|---------|---------|
| `user` | Who the user is, their preferences | "User is a senior engineer, prefers terse responses" |
| `feedback` | Corrections and validated approaches | "Don't mock the database in integration tests" |
| `project` | Ongoing work context, decisions | "Auth rework is driven by NextAuth limitation" |
| `reference` | Pointers to external resources | "Bugs tracked in Linear project INGEST" |

### Structure Maps — keep them in the vault, not memory

A **structure map** is a directory listing of a repo's key folders, with a line on what each one holds. It lets Claude know where files are without searching every time.

This setup stores structure maps as **`Ref_{repo}-structure.md` notes in the vault**, not as memory files:
- Memory is loaded (via `MEMORY.md`) on every session, while a `Ref_` note is read only when that repo is being worked on
- A `Ref_` note can be passed by path to spawned agents, so they start oriented
- It shows up in the Obsidian graph next to the Feat/Investigate notes that depend on it

Tell Claude: *"Map the folder structure of `{repo}` and save it as `Ref_{repo}-structure` in the vault."* The **Check structure docs before traversing** rule (Step 4) then makes Claude read it before exploring. Update the note when the layout changes.

---

## Step 9 — Configure Permissions

### What is it?

Claude Code asks for permission every time it uses a tool. The permissions file pre-approves certain tools so you don't have to click "allow" constantly.

### Steps

1. The first time Claude uses each MCP tool, it will ask for permission. Click "Allow" and optionally select "Always allow" to persist the permission.

2. Alternatively, create `{project-root}/.claude/settings.local.json` to pre-configure permissions:

   ```json
   {
     "permissions": {
       "allow": [
         "mcp__obsidian__list_directory",
         "mcp__obsidian__search_notes",
         "mcp__obsidian__read_note",
         "mcp__obsidian__read_multiple_notes",
         "mcp__obsidian__write_note",
         "mcp__obsidian__patch_note",
         "mcp__obsidian__delete_note",
         "mcp__obsidian__get_vault_stats",
         "mcp__obsidian__manage_tags",
         "mcp__obsidian__get_frontmatter",
         "mcp__obsidian__update_frontmatter",
         "mcp__obsidian__move_note"
       ]
     },
     "enableAllProjectMcpServers": true,
     "enabledMcpjsonServers": [
       "obsidian"
     ]
   }
   ```

   You can add more bash command permissions as you work — Claude will ask, and you can choose to persist them. Over time, this file grows with permissions like `"Bash(npx tsc:*)"`, `"Bash(git add:*)"`, etc.

### Key Settings Explained

- **`permissions.allow`** — list of pre-approved tools/commands
- **`enableAllProjectMcpServers`** — automatically enable MCP servers defined in `.mcp.json`
- **`enabledMcpjsonServers`** — explicitly name which MCP servers to enable. Add `"azure-devops"` here if you configured it

### Keep the allowlist tidy

Answering "always allow" writes the **exact** command into the file, one-off paths and all (`Bash(mv /some/specific/file ...)`). Every few weeks, delete the one-offs and keep only reusable patterns such as `Bash(npx tsc:*)` or `WebFetch(domain:developers.cloudflare.com)`. The `/fewer-permission-prompts` skill can build a clean allowlist from your transcripts.

---

## Step 10 — Install Plannotator (review gates)

### What is it?

[Plannotator](https://github.com/backnotprop/plannotator) opens a markdown file in a browser annotation UI. You highlight lines and leave comments, then **Approve**, **Annotate** (send comments back), or close it. Claude receives the outcome and your annotations as structured feedback. The workflows in Step 4 use it as the review gate for every spec, planning, solution, and fix document.

### Steps

1. **Install the Claude Code plugin.** Add the marketplace and enable the plugin in `~/.claude/settings.json`:
   ```json
   {
     "extraKnownMarketplaces": {
       "plannotator": {
         "source": { "source": "github", "repo": "backnotprop/plannotator" }
       }
     },
     "enabledPlugins": {
       "plannotator@plannotator": true
     }
   }
   ```
   You can also run `/plugin` inside Claude Code and install it from there.

2. **Install the `plannotator` CLI** by following the project README, and make sure `plannotator` is on your `PATH`. The workflow calls `plannotator annotate <absolute-path>` directly.

3. **Verify:** run `plannotator annotate /absolute/path/to/any.md`. A browser tab should open with the document.

### Notes

- **Always pass an absolute path.** For vault notes that means the real filesystem path, e.g. `C:/Users/{you}/Vault/{project}/Feat_x_spec.md`. Plannotator reads the file directly, not through MCP
- **Plannotator blocks until you respond.** The Claude turn waits while the UI is open, so this is the one place the workflow deliberately pauses
- **Other skills it adds:** `/plannotator-review` (review the current diff) and `/plannotator-last` (annotate Claude's last message)

---

## How It All Works Together

### Starting a Session

1. You open a terminal and run `claude` in your project directory
2. Claude reads:
   - `~/.claude/CLAUDE.md` (global rules — vault conventions, naming, frontmatter)
   - `{project}/CLAUDE.md` (project rules — CEO role, agent roster, workflows)
   - `{project}/.claude/rules/*.md` (coding standards — auto-loaded)
   - `~/.claude/projects/{path}/memory/MEMORY.md` (persistent learnings)
3. Claude greets you and asks what you'd like to work on — no automatic vault reads
4. If you need context, type `/recall` or `/recall {topic}` to pull up recent diaries and related docs

### Working on a Feature

1. You say: "Let's build user notifications"
2. Claude (as CEO) classifies this as a feature → follows the Feature Workflow you defined
3. **Spec** → Claude produces `Feat_user-notifications_spec.md` → opens it in Plannotator → you annotate or approve → STOPS
4. **Planning** → Claude produces `Feat_user-notifications_planning.md` → Plannotator → STOPS
5. **Implement** → after your go-ahead, Claude follows the task list, one task at a time

In the **Obsidian graph view**, you'd see the chain:
```
Feat_user-notifications_spec → Feat_user-notifications_planning
```

### Fixing a Bug

1. You say: "The dashboard is showing wrong numbers"
2. Claude follows the Issue Resolution Workflow you defined
3. **Investigate** → produces `Investigate_dashboard-wrong-numbers.md` → STOPS for your review
4. **Solution** → produces `Solution_dashboard-wrong-numbers.md` → Plannotator → STOPS for approval
5. **Fix** → produces `Fix_dashboard-wrong-numbers.md` → Plannotator → STOPS
6. **Implement** → after your go-ahead, each task goes to the relevant expert agent, one at a time

### Saving Context

- **End of session:** Type `/preserve` — saves diary, checks vault docs, reviews lessons learned
- **Need context:** Type `/recall auth` — pulls up recent diaries and auth-related docs
- **Before compaction:** Claude proactively writes a diary entry when context window is ~90% full

### Context Window Management

During long sessions, when the context window fills up:
1. Claude proactively writes a diary entry capturing current progress
2. Context gets compacted (older messages are summarized)
3. Claude reads the diary entry back to restore full context
4. Work continues seamlessly

---

## Customization Guide

### Adapting for Your Project

1. **Change the file prefixes** — if your workflow doesn't include investigation/fixing, remove those prefixes. Add new ones if needed (e.g., `RFC_` for design proposals, `Sprint_` for sprint planning).

2. **Add/remove agents** — you might not need a BA if you write requirements yourself. You might need a Designer agent or a second FE Dev for a different frontend. Adjust the roster in `CLAUDE.md` and create/remove files in `~/.claude/agents/`.

3. **Add rules files** — create `.claude/rules/{domain}.md` files for coding standards specific to your stack. These are auto-loaded and always active.

4. **Add slash commands** — create `~/.claude/commands/{name}.md` (or project-level) for any repeated workflow. The `$ARGUMENTS` placeholder captures input.

5. **Add sub-project CLAUDE.md files** — if your frontend or backend has specific coding rules, create `proj-fe/CLAUDE.md` and `proj/CLAUDE.md` with coding standards, patterns, and conventions. Reference them from the agent files.

### Adding a Business Overview

Optionally create a `Business Overview.md` in your Obsidian vault that describes your product. Agents can read this for context before starting work. Include:
- What the product does
- Who the users are
- Key modules/features already built
- Business rules and constraints

### Multiple Projects

The global `~/.claude/CLAUDE.md` supports multiple projects. Each project gets:
- Its own vault at `~/Vault/{project-name}/`
- Its own `.mcp.json` pointing to that vault
- Its own `CLAUDE.md` with project-specific rules
- Its own `.claude/rules/`
- Its own memory space (automatically scoped by project path)

Agents and slash commands in `~/.claude/` are shared by all projects. When you switch projects, Claude reads the new project's rules and context.

### Workspace with several repos

If one product spans several git repos (e.g. `works/Arc/<repo-a>`, `works/Arc/<repo-b>`), put `.mcp.json`, `CLAUDE.md`, and `.claude/rules/` at the **workspace root** (`works/`) and launch `claude` from there. Every repo then shares one vault, one rule set, and one memory. Point Claude at a repo with a `Ref_{repo}-structure` note rather than by relaunching inside the repo.

---

## Troubleshooting

### "Claude isn't using the Obsidian MCP tools"

- Check that `.mcp.json` exists in the project root (not in `~/.claude/` or in the vault)
- Check that the vault path in `.mcp.json` is an absolute path
- Run `/mcp` inside Claude Code and check that `obsidian` is listed as connected
- Check `settings.local.json` has `"enabledMcpjsonServers": ["obsidian"]`
- Check that the server name in `.mcp.json` matches the tool names in your permissions (`obsidian` → `mcp__obsidian__*`)

### "Claude reads diaries automatically at startup"

- Check `settings.local.json` and `~/.claude/settings.json` for a `SessionStart` hook that echoes startup instructions. A leftover one from an earlier setup will force vault reads on every session. Remove it
- Check that `~/.claude/CLAUDE.md` has no startup protocol section
- Use `/recall` when you actually need context

### "Plannotator doesn't open / Claude skips the review"

- Run `plannotator annotate <absolute-path>` yourself. If the command isn't found, the CLI is not on `PATH`
- Check that the path is absolute and points at the real vault file on disk
- Check that the project CLAUDE.md has the Plannotator Review Gate section and that each gated step says "Review with Plannotator"

### "A memory isn't being recalled"

- Check that the memory file has a line in `MEMORY.md`. A file with no index line is never loaded

### "Claude jumps straight to implementation"

- Check that your project CLAUDE.md has the STOP rules
- Check that agent files have "STOP after creating planning artifacts"
- Add a feedback memory: "STOP after creating artifacts. Never implement without explicit approval."

### "MCP server fails to start"

- Make sure Node.js is installed and `npx` is available
- Try running the MCP server manually to see errors:
  ```bash
  npx -y @mauricio.wolff/mcp-obsidian /path/to/your/vault
  ```
- Check that the vault path exists and is accessible

### "Permissions keep popping up"

- Add frequently-used tools to `.claude/settings.local.json` in the `permissions.allow` array
- Use patterns for bash commands: `"Bash(git add:*)"` allows all git add variations

### "Claude wastes tokens on simple tasks"

- Verify your project CLAUDE.md has the Token Efficiency Rules section
- Add a feedback memory: "Never spawn agents for simple edits — do it directly with Edit tool"

---

## Quick Start Checklist

- [ ] Install Claude Code CLI
- [ ] Install Obsidian
- [ ] Create vault folder: `mkdir -p ~/Vault/{project-name}/templates`
- [ ] Open vault in Obsidian
- [ ] Create vault templates (Diary, Feat, Tasks, Debug, Test — plus Investigate, Solution, Fix, Ref)
- [ ] Create `.mcp.json` in project root with vault path (server name `obsidian`; optionally `azure-devops`)
- [ ] Create `~/.claude/CLAUDE.md` with file conventions, templates, and frontmatter convention
- [ ] Create `{project}/CLAUDE.md` with project rules, agent roster, workflows, and the Plannotator gate
- [ ] Create `~/.claude/agents/` with agent definition files (with YAML frontmatter)
- [ ] Create `{project}/.claude/rules/` with coding standards and checklists
- [ ] Create `~/.claude/commands/` with `preserve.md` and `recall.md`
- [ ] Create `{project}/.claude/settings.local.json` with MCP permissions
- [ ] Install Plannotator (plugin + CLI) and verify `plannotator annotate` opens a file
- [ ] Start Claude Code, verify vault connection works (`/mcp`)
- [ ] Create a `Ref_{repo}-structure` note for each repo you'll work in
- [ ] (Optional) Create `Business Overview.md` in the vault
- [ ] (Optional) Seed initial memories (verify-imports, no-assumptions, commit-style, no-push-without-permission)
- [ ] Start working — the system builds up context naturally from here

---

## File Tree Summary

After setup, your project should have these new files:

```
~/
├── .claude/
│   ├── CLAUDE.md                          # Global rules (naming, templates, frontmatter)
│   ├── settings.json                      # Plannotator plugin + marketplace
│   ├── agents/                            # Agents — shared across projects
│   │   ├── {tech}-expert.md               # Domain experts (Cloudflare, Next.js, Azure, ...)
│   │   ├── {topic}-scout.md               # (Optional) research scout
│   │   ├── {topic}-analyst.md             # (Optional) report writer
│   │   ├── PROTOCOL.md                    # (Optional) shared research protocol
│   │   └── OUTPUT.md                      # (Optional) shared report format
│   └── commands/                          # Slash commands — shared across projects
│       ├── preserve.md                    # /preserve — save session context
│       └── recall.md                      # /recall — restore context
│
├── Vault/
│   └── {project-name}/                    # Obsidian vault (separate from code)
│       ├── .obsidian/                     # Obsidian app config (auto-created)
│       ├── templates/                     # File templates
│       │   ├── Diary_template.md
│       │   ├── Feat_template.md
│       │   ├── Tasks_template.md
│       │   ├── Debug_template.md
│       │   ├── Test_template.md
│       │   ├── Investigate_template.md
│       │   ├── Solution_template.md
│       │   ├── Fix_template.md
│       │   └── Ref_template.md
│       ├── Ref_{repo}-structure.md        # One structure map per repo
│       └── Business Overview.md           # (Optional) Product context for agents
│
└── {your-workspace}/                      # Launch `claude` here
    ├── .mcp.json                          # MCP servers → vault (+ optional ADO)
    ├── CLAUDE.md                          # Project rules, agents, workflows
    └── .claude/
        ├── settings.local.json            # Pre-approved permissions
        └── rules/                         # Coding standards (auto-loaded)
            ├── {project}-architecture.md  # Architecture patterns
            ├── {project}-code-style.md    # Code style rules
            └── {project}-checklist.md     # Post-implementation checklist
```

The memory system (`~/.claude/projects/{path}/memory/`) is created automatically by Claude Code as you work.