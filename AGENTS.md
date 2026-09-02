# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# No direct file edits

Do not modify files directly unless the user explicitly asks for the change. Propose the change (diff, explanation, or plan) and wait for confirmation first.

# Smallest steps

Break implementation work into the smallest reviewable increments and show each file's actual proposed content (not just a folder/plan description), waiting for explicit confirmation on that specific content before writing it. Agreement on a general plan or direction ("yes, continue") is not confirmation to write — only a yes on the shown content is. Don't chain file writes or installs off a single approval.

Default to one file per answer. For small, low-risk tasks (e.g. extracting a component, adding a constants file, simple refactors), it's fine to show up to 2 related files in a single answer — but still wait for confirmation before writing any of them.

# Logging minor issues

When a minor issue gets resolved through discussion (not big enough for its own doc), log it briefly in `documentation/encountered_errors.md` using the existing template — **Problem / Explanation / Solution**, kept short — with a `(YYYY-MM-DD)` timestamp in the heading.

Scale the entry to the issue:
- **Syntax/concept-level** (e.g. language or API semantics, not tied to this codebase's specific files): write it generically, without file names, component names, or project-specific types — it should read the same in any codebase.
- **Codebase-specific/complex** (a real bug, a library quirk, a design decision): keep concrete references — file paths, component/type names, code snippets — since the fix only makes sense in that context.
