import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import { PdfRenderExecutor } from "./executor";

export const NODE_TYPE = "PdfRender";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "PDF Render",
    description: "Renders a design system print component to PDF using headless Chrome",
    whenToUse: "Produce a downloadable PDF FILE as the final deliverable — render a laid-out report, form, or printable page to PDF via headless Chrome. Use it to GENERATE a new PDF from a designed layout (not to display an existing PDF, and not for fixed-template branded assets). Pair it with an upstream design-system print component, whose componentSpec it renders.",
    category: "Documents",
    color: "#DC2626",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1771073087/gravity/icons/pdf.png",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Component spec from a print node (PoliceReport, etc.)",
        required: true,
      },
    ],

    outputs: [
      {
        name: "output",
        type: NodeInputType.OBJECT,
        description: "PDF output with pdfBase64, contentType, filename, pages, size",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        componentSpec: {
          type: "object",
          title: "Component Spec",
          description: "The componentSpec from the upstream print node.",
          default: "",
          "ui:field": "template",
        },
        pageSize: {
          type: "string",
          title: "Page Size",
          description: "PDF page size",
          enum: ["letter", "a4", "tabloid"],
          enumNames: ["Letter (8.5×11)", "A4 (210×297mm)", "Tabloid (11×17)"],
          default: "letter",
        },
        orientation: {
          type: "string",
          title: "Orientation",
          description: "Page orientation",
          enum: ["portrait", "landscape"],
          enumNames: ["Portrait", "Landscape"],
          default: "portrait",
        },
        filename: {
          type: "string",
          title: "Filename",
          description:
            "Output PDF filename. Supports {{signal.policereport1.componentSpec.type}} syntax. Leave empty for auto-generated.",
          "ui:field": "template",
          default: "",
        },
      },
    },
    testData: {
      config: {
        componentSpec: {
          type: "InvoiceReport",
          componentUrl: "https://components.gravity.dev/print/InvoiceReport.js",
          props: {
            title: "Q2 2026 Invoice",
            customer: "Acme Corporation",
            lineItems: [
              { description: "Consulting services", amount: 4200 },
              { description: "Platform license", amount: 1800 },
            ],
            total: 6000,
          },
        },
        pageSize: "letter",
        orientation: "portrait",
        filename: "invoice-q2-2026.pdf",
      },
      inputs: {
        signal: {
          InvoiceReport: {
            componentSpec: {
              type: "InvoiceReport",
              componentUrl: "https://components.gravity.dev/print/InvoiceReport.js",
              props: { title: "Q2 2026 Invoice", customer: "Acme Corporation", total: 6000 },
            },
          },
        },
      },
    },
  };
}

const definition = createNodeDefinition();

export const PdfRenderNode = {
  definition,
  executor: PdfRenderExecutor,
};

export { createNodeDefinition };
