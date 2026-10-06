---
name: prototype
description: Offer — don't start — a throwaway logic prototype when a spec or Solution note has an open state-model or business-logic question (e.g. how splits behave across edge cases). Build it only after the user agrees.
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

## Pick a branch

Identify which question is being answered, using the user's prompt, the surrounding code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** → [LOGIC.md](LOGIC.md). Build a single shareable HTML file (free-play buttons plus tabbed guided walkthroughs) that pushes the state machine through cases that are hard to reason about on paper.
- **"What should this look like?"** → out of scope for this skill in isotes: sketch options in chat or in Figma instead.

## Rules

1. **Throwaway from day one, and outside the repo.** Write the HTML to `$TMPDIR/prototype-{slug}.html` and open it (`open <path>`). Nothing lands in `src/`.
2. **Trivial to run.** A single HTML file the user double-clicks (or that you `open`). No thinking required to start it.
3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE, wipe me" name.
4. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast.
5. **Surface the state.** After every action, print or render the full relevant state so the user can see what changed.
6. **Capture it when done.** Record the question, the verdict, and the decision-rich part of the logic module (trimmed, not a working demo) in the Technical section of the `Feat_{slug}_spec` or `Solution_{slug}` note, marked "from prototype". Fold the validated decision into the real code through the normal workflow. The HTML file itself is disposable.
