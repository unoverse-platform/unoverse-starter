/**
 * Default values for MarkdownRenderer component
 * Used only in Storybook for demos
 */

export const MarkdownRendererDefaults = {
  title: "",
  markdown: "",
  streamingState: "complete" as const,
};

export const MarkdownRendererLongDocDefaults = {
  title: "Client Brief — Acme Co.",
  markdown: `# Client Brief — Acme Co.

## Summary

Acme Co. is exploring a refreshed onboarding journey for SMB customers. The goal
is to reduce time-to-activation from 11 days to under 5 days while preserving
the white-glove feel of the existing process.

## Goals

- Shorter first-value window
- Fewer manual handoffs between Sales and CS
- Clearer self-serve paths for low-complexity accounts

## Risks

- Regulatory timing around KYC checks
- Data quality gaps in legacy CRM
- Change-management fatigue following the Q1 rollout

## Next Steps

1. Schedule a working session with CS leadership
2. Audit existing onboarding telemetry
3. Draft a revised journey map for review

---

See [docs](https://example.com/onboarding) for prior art.
`,
  streamingState: "complete" as const,
};

export const MarkdownRendererEdgeCasesDefaults = {
  title: "Edge cases",
  markdown: `## Code

\`\`\`ts
function hello(name: string): string {
  return \`Hello, \${name}\`;
}
\`\`\`

## Table

| Column A | Column B |
| -------- | -------- |
| foo      | bar      |
| baz      | qux      |

## Links

Visit [gravity](https://example.com) for details.

## Inline HTML

<em>emphasised</em> and <strong>strong</strong> still render.
`,
  streamingState: "complete" as const,
};
