/**
 * MarkdownRenderer Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import MarkdownRendererExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "MarkdownRenderer";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "MarkdownRenderer",
    description: "Static markdown document renderer: an optional titled header with a streaming indicator, then a full markdown body (headings, lists, tables, code, links, images) or a waiting placeholder.",
    whenToUse: "Render a whole markdown document or report — headings, lists, tables, code blocks, links and images — as static formatted prose, optionally under a document title with a writing indicator while it generates. Pick when the entire markdown body is shown as a standalone document, rather than a single conversational chat reply that streams token by token.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 720, height: 560 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "title": {
                  "type": "string",
                  "title": "title",
                  "default": "Client Brief — Acme Co.",
                  "ui:field": "template"
            },
            "markdown": {
                  "type": "string",
                  "title": "markdown",
                  "default": "# Client Brief — Acme Co.\n\n## Summary\n\nAcme Co. is exploring a refreshed onboarding journey for SMB customers. The goal is to reduce time-to-activation from 11 days to under 5 days while preserving the white-glove feel of the existing process.\n\n## Goals\n\n- Shorter first-value window\n- Fewer manual handoffs between Sales and CS\n- Clearer self-serve paths for low-complexity accounts\n\n## Risks\n\n| Risk | Severity |\n| --- | --- |\n| Regulatory timing around KYC checks | High |\n| Data quality gaps in legacy CRM | Medium |\n| Change-management fatigue after Q1 | Medium |\n\n## Next Steps\n\n1. Schedule a working session with CS leadership\n2. Audit existing onboarding telemetry\n3. Draft a revised journey map for review\n\n---\n\nSee [docs](https://example.com/onboarding) for prior art.\n",
                  "ui:field": "template"
            },
            "streamingLabel": {
                  "type": "string",
                  "title": "streamingLabel",
                  "default": "Writing…",
                  "ui:field": "template"
            },
            "placeholderText": {
                  "type": "string",
                  "title": "placeholderText",
                  "default": "Waiting for document…",
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const MarkdownRendererNode = {
  definition,
  executor: MarkdownRendererExecutor,
};

export { createNodeDefinition as default };
