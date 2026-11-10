# Phase formats

Every phase keeps its header (Demo, Covers, Blocked by, Seams), and every task keeps its tag and **Verify** line. The body depends on the phase's kind.

## UI phase

The phase mostly changes how a screen looks.

1. **Components:** the names of the components that change.
2. **Layout:** a box diagram with one box per component, labelled only with what changes the layout flow or is hard-coded: flex direction, alignment, absolute position, fixed width or height. Component content and token classes stay out; they live in the board's HTML and the spec's criteria.

   ```text
   ┌───────────────────────────────┐
   │ Header: flex-row              │
   │ ┌──────────────┐ ┌──────────┐ │
   │ │ Title: flex-1│ │ X: 44×44 │ │
   │ └──────────────┘ └──────────┘ │
   └───────────────────────────────┘
   ```

3. **Fixed sizes and missing tokens:** a table of element, value and why it has no token.

The phase's last task searches the phase's diff for `no token` and reports each hit as planned or new. A new one is the user's call: keep it, or add a token.

## Code phase

The phase changes logic or removes code. Write three levels.

- **Level 1, the phase:** its title and Demo.
- **Level 2, objectives:** for each objective, its context (where the state lives, what the code does today and why that matters), its steps in plain language, and the edges to notice. Each step becomes a task.
- **Level 3, the proposed code:** every task that changes code carries its code blocks, tests included, so the plan is one place to read the whole change. Moves and renames show the changed lines; UI tasks show the JSX with token classes. Inputs get `file:line` pointers. It is complete when `/autopilot` or companion mode could implement the task from it.

Where a step depends on an earlier phase's result, write the check and a branch for each outcome.

## Other phases

Readiness and acceptance phases keep plain tasks.
