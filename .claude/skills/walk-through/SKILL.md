---
name: walk-through
description: Walk through or explain a function (or a small group of related functions) in isotes with real values, branch traces, intermediate pipeline values and a flow diagram. Use when the user asks to walk through, trace, or explain how a function works.
---

# Walking through a function

- One-line purpose per function: what it takes, what it returns, why it exists in the flow.
- A concrete example: a real input value from the codebase and the exact output value it produces.
- Trace the branches: a second example that hits the optional paths / guards / error cases.
- For pipelines (map/filter/reduce, `Object.entries`/`fromEntries`, chained transforms): show the intermediate value between every step.
- Close with a flow diagram tying the functions together: source data → each transform → final consumer.
- Use real values and names from the code, not `foo`/`bar`.

End with the short "Is this the best approach?" section the user's global instructions ask for on code explanations.
