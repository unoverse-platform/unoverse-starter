/**
 * PDF Render Package for Gravity Workflow System
 *
 * Renders design system print components to PDF using headless Chrome (Puppeteer)
 */

import { createPlugin } from "@gravity-platform/plugin-base";

const plugin = createPlugin({
  name: "@gravity-platform/pdf-render",
  version: "1.0.0",
  description: "PDF rendering node for Gravity workflow system",

  async setup(api) {
    // Initialize platform dependencies
    const { initializePlatformFromAPI } = await import("@gravity-platform/plugin-base");
    initializePlatformFromAPI(api);

    // Import and register PdfRender node
    const { PdfRenderNode } = await import("./PdfRender/node");
    api.registerNode(PdfRenderNode);
  },
});

export default plugin;

// Export node for direct usage if needed
export { PdfRenderNode } from "./PdfRender/node";
