# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# No direct file edits

Do not modify files directly unless the user explicitly asks for the change. Propose the change (diff, explanation, or plan) and wait for confirmation first.

# Logging minor issues

When a minor issue gets resolved through discussion (not big enough for its own doc), log it briefly in `documentation/encountered_errors.md` using the existing template — **Problem / Explanation / Solution**, kept short — with a `(YYYY-MM-DD)` timestamp in the heading.

Scale the entry to the issue:
- **Syntax/concept-level** (e.g. language or API semantics, not tied to this codebase's specific files): write it generically, without file names, component names, or project-specific types — it should read the same in any codebase.
- **Codebase-specific/complex** (a real bug, a library quirk, a design decision): keep concrete references — file paths, component/type names, code snippets — since the fix only makes sense in that context.
