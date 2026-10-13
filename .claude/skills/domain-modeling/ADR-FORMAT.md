# ADR format

One file per decision in `documentation/adr/`, named `NNNN-slug.md`: the next free
four-digit number, then a short hyphenated slug. Every ADR gets a row in
`documentation/adr/README.md`.

## Template

```md
# NNNN — {Short title of the decision}

- **Status:** accepted
- **Date:** {YYYY-MM-DD}
- **Area:** {data | money | state | sheets | tooling}

**Decision**
{What we chose, stated plainly.}

**Why**
{The reasoning, framed around what we're preventing.}

**Alternatives considered**
{What else was on the table and why it lost.}

**Revisit when**
{The condition that would make this worth reconsidering.}
```

Name the concept and the module that owns it, not line numbers: the decision should
still read true after a refactor. Add a new area only when none of the five fits.

## Changing a decision

Never rewrite an accepted ADR's body. Write a new ADR, then edit only the old one's
`Status` line:

- Replaced → `superseded by NNNN`, and move its index row to the Superseded table.
- Narrowed or extended → `accepted, amended by NNNN`.

A fact in the body that went stale without the decision changing (a renamed symbol)
gets a dated line under the header: `- **Note (YYYY-MM-DD):** …`.

## When to offer an ADR

All three of these must be true:

1. **Hard to reverse**: the cost of changing your mind later is meaningful
2. **Surprising without context**: a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off**: there were genuine alternatives and you picked one for specific reasons

If a decision is easy to reverse, skip it: you'll just reverse it. If it's not surprising, nobody will wonder why. If there was no real alternative, there's nothing to record beyond "we did the obvious thing."

If any test fails, the choice goes in the implementation note's Design choices line or the feature spec, not here.

### What qualifies

- **Architectural shape.** "We're using a monorepo." "The write model is event-sourced, the read model is projected into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth provider, deployment target. Not every library: just the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only." The explicit no-s are as valuable as the yes-s.
- **Deliberate deviations from the obvious path.** "We're using manual SQL instead of an ORM because X." Anything where a reasonable reader would assume the opposite. These stop the next engineer from "fixing" something that was deliberate.
- **Constraints not visible in the code.** "We can't use AWS because of compliance requirements." "Response times must be under 200ms because of the partner API contract."
- **Rejected alternatives when the rejection is non-obvious.** If you considered GraphQL and picked REST for subtle reasons, record it; otherwise someone will suggest GraphQL again in six months.
