---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a cited vault note. Use when the user wants a durable, cited write-up — for a quick API answer, use the expo-rn-expert agent instead.
disable-model-invocation: true
---

Spin up a **background agent** to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it. For Expo, the primary source is the versioned docs at https://docs.expo.dev/versions/v57.0.0/ (AGENTS.md).
2. Return the findings as Markdown to the main session, citing each claim's source. The agent doesn't write files.
3. The main session writes them to the vault (`/Users/admin/repository/vault/isotes/`) via the Obsidian MCP tools, from the matching template: `Learn_{field}_{slug}` for generic knowledge (its **Seen in** names the task that asked), or `Ref_{slug}` for a reference list (API surface, comparison table). Sources go in **References**.
