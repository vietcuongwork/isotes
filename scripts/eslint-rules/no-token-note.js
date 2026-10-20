// Every arbitrary [Npx] class needs a "no token" note nearby (AGENTS.md "No-token styles")
const ARBITRARY_PX = /(^|[\s"'`:])(-?[a-z][a-z0-9-]*-\[[0-9.]+px\])/;
const NOTE = /no token/i;
// The note may sit up to 2 lines above the tag, e.g. with a second comment line between
const LINES_ABOVE = 2;

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require a no-token note next to arbitrary px classes",
    },
    messages: {
      missing:
        'Arbitrary "{{value}}" with no no-token note. Why: AGENTS.md "No-token styles" keeps fallbacks greppable until a token exists. Fix: a comment containing "no token" within 2 lines above the element, naming what is missing and what you fell back to.',
    },
    schema: [],
  },
  create(context) {
    const { sourceCode } = context;
    const notes = sourceCode
      .getAllComments()
      .filter((comment) => NOTE.test(comment.value));

    return {
      JSXAttribute(node) {
        const name = typeof node.name.name === "string" ? node.name.name : "";
        if (!/[cC]lassName$/.test(name) || !node.value) return;

        // Reads the attribute's source text, so classes inside cn(…) count too
        const match = sourceCode.getText(node.value).match(ARBITRARY_PX);
        if (!match) return;

        const from = node.parent.loc.start.line - LINES_ABOVE;
        const to = node.loc.start.line;
        const hasNote = notes.some(
          (comment) =>
            comment.loc.end.line >= from && comment.loc.end.line <= to,
        );
        if (!hasNote) {
          context.report({
            node,
            messageId: "missing",
            data: { value: match[2] },
          });
        }
      },
    };
  },
};
