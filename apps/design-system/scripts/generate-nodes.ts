#!/usr/bin/env ts-node
/// <reference types="node" />
/**
 * Generate workflow nodes from Storybook components
 *
 * Usage: npm run generate-nodes
 *
 * This script:
 * 1. Scans src/components/ for Storybook components
 * 2. Extracts argTypes from .stories.tsx files
 * 3. Renders React components to HTML templates
 * 4. Generates complete Promise Node structure
 * 5. Writes actual TypeScript files you can inspect
 */

import * as path from "path";
import * as fs from "fs";
import chalk from "chalk";
import { ComponentScanner } from "./ingestion/ComponentScanner";
import { FileGenerator } from "./ingestion/FileGenerator";

async function main() {
  console.log(chalk.bold.cyan("\n🎨 Generating workflow nodes and templates from Storybook...\n"));

  try {
    // Get app root directory (apps/design-system)
    const appRoot = process.cwd();

    // Output to packages/design-system (the runtime package)
    const packagesRoot = path.resolve(appRoot, "../../packages/design-system");

    // Get components directory from storybook folder
    const componentsDir = path.join(appRoot, "storybook/components");
    const templatesDir = path.join(appRoot, "storybook/templates");
    const printPagesDir = path.join(appRoot, "storybook/components/print/pages");
    // Output to packages/design-system/src (where gravity plugin pulls from)
    const outputDir = path.join(packagesRoot, "src");

    // Scan for components (workflow nodes)
    console.log(chalk.blue("\\n📦 COMPONENTS (Workflow Nodes)"));
    console.log(chalk.gray("   Scanning: " + componentsDir));
    const componentScanner = new ComponentScanner(componentsDir);
    const components = await componentScanner.scan();
    console.log(chalk.green("   ✓ Found " + components.length + " components"));
    components.forEach((c) => console.log(chalk.gray("      - " + c.name)));
    console.log("");

    // Scan for print page components (document templates for Puppeteer rendering)
    let printPages: Awaited<ReturnType<ComponentScanner["scan"]>> = [];
    if (fs.existsSync(printPagesDir)) {
      console.log(chalk.yellow("\n🖨️  PRINT PAGES (Document Templates)"));
      console.log(chalk.gray("   Scanning: " + printPagesDir));
      const printScanner = new ComponentScanner(printPagesDir, "printPage");
      printPages = (await printScanner.scan()).map((p) => ({ ...p, isPrintPage: true }));
      console.log(chalk.green("   ✓ Found " + printPages.length + " print pages"));
      printPages.forEach((c) => console.log(chalk.gray("      - " + c.name)));
      console.log("");
    }

    // Scan for templates (bundle only, no workflow nodes)
    console.log(chalk.magenta("\n🎭 TEMPLATES (Layout Containers)"));
    console.log(chalk.gray("   Scanning: " + templatesDir));
    const templateScanner = new ComponentScanner(templatesDir, "template");
    const templates = await templateScanner.scan();
    console.log(chalk.green("   ✓ Found " + templates.length + " templates\n"));

    if (components.length === 0 && templates.length === 0 && printPages.length === 0) {
      console.log("⚠️  No components, templates, or print pages found.");
      process.exit(0);
    }

    // Reject names that collide with built-in globals before bundling — they
    // each become a UMD global of the same name and would break at render.
    // Throwing here propagates to main()'s catch → process.exit(1).
    for (const node of [...components, ...printPages, ...templates]) {
      ComponentScanner.assertSafeComponentName(node.name);
    }

    // Generate files for each component (full workflow node)
    const generator = new FileGenerator(outputDir, appRoot);
    let generated = 0;

    console.log(chalk.bold.blue("\\n━━━ Generating Workflow Nodes ━━━\\n"));
    for (const component of components) {
      try {
        console.log(chalk.cyan("   → " + component.name));
        await generator.generate(component);
        generated++;
        console.log(chalk.green("     ✓ Generated: src/" + component.name + "/\\n"));
      } catch (error) {
        console.error(chalk.red("     ✗ Failed: " + component.name), error);
      }
    }

    // Generate files for each print page (full workflow node)
    if (printPages.length > 0) {
      console.log(chalk.bold.yellow("\\n━━━ Generating Print Pages ━━━\\n"));
      for (const page of printPages) {
        try {
          console.log(chalk.yellow("   → " + page.name));
          await generator.generate(page);
          generated++;
          console.log(chalk.green("     ✓ Generated: src/" + page.name + "/\\n"));
        } catch (error) {
          console.error(chalk.red("     ✗ Failed: " + page.name), error);
        }
      }
    }

    // Generate bundles for templates (no workflow nodes)
    console.log(chalk.bold.magenta("\\n━━━ Bundling Templates ━━━\\n"));
    for (const template of templates) {
      try {
        console.log(chalk.magenta("   → " + template.name));
        await generator.generateTemplateOnly(template);
        generated++;
        console.log(chalk.green("     ✓ Bundled: components/" + template.name + ".js\\n"));
      } catch (error) {
        console.error(chalk.red("     ✗ Failed: " + template.name), error);
      }
    }

    // Auto-generate index.ts with all discovered nodes
    const allNodes = [...components, ...printPages];
    generatePluginIndex(outputDir, allNodes);
    console.log(chalk.green("\n   ✓ Auto-generated src/index.ts with " + allNodes.length + " nodes"));

    console.log(chalk.bold.green("\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(
      chalk.bold.green(
        "✓ Successfully generated " +
          generated +
          "/" +
          (components.length + printPages.length + templates.length) +
          " items",
      ),
    );
    console.log(chalk.blue("  • " + components.length + " workflow nodes"));
    console.log(chalk.yellow("  • " + printPages.length + " print pages"));
    console.log(chalk.magenta("  • " + templates.length + " templates"));
    console.log(chalk.bold.green("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n"));
    console.log(chalk.yellow("📋 Next steps:"));
    console.log(chalk.gray("   1. Review generated files in packages/design-system/src/[ComponentName]/"));
    console.log(chalk.gray("   2. Build: npm run build -w @gravity-platform/design-system"));
    console.log(chalk.gray("   3. Restart server to load new nodes\n"));
  } catch (error) {
    console.error("❌ Generation failed:", error);
    process.exit(1);
  }
}

main();

/**
 * Auto-generate packages/design-system/src/index.ts
 * so new components/print pages are registered without manual edits.
 */
function generatePluginIndex(outputDir: string, nodes: { name: string; isPrintPage?: boolean }[]) {
  const components = nodes.filter((n) => !n.isPrintPage);
  const printPages = nodes.filter((n) => n.isPrintPage);

  const imports = [
    ...components.map((n) => `import { ${n.name}Node } from "./${n.name}/node";`),
    "",
    "// Print page nodes",
    ...printPages.map((n) => `import { ${n.name}Node } from "./${n.name}/node";`),
  ].join("\n");

  const nodeList = [
    ...components.map((n) => `  ${n.name}Node,`),
    "  // Print pages",
    ...printPages.map((n) => `  ${n.name}Node,`),
  ].join("\n");

  const content = `/**
 * Design System Plugin
 * UI Components for Gravity workflow system
 *
 * AUTO-GENERATED by generate-nodes.ts — do not edit manually
 */

import { createPlugin, type GravityPluginAPI } from "@gravity-platform/plugin-base";
import packageJson from "../package.json";
import * as path from "path";

// Import generated nodes
${imports}

// All design system nodes
const nodes = [
${nodeList}
];

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    // Register this package's path for component serving
    // __dirname is dist/src, so go up twice to get package root
    const packagePath = path.join(__dirname, "../..");

    if (api.registerComponentPath) {
      api.registerComponentPath(packagePath);
    }

    // Set platform dependencies for this package
    const { setPlatformDependencies } = await import("@gravity-platform/plugin-base");
    setPlatformDependencies({
      PromiseNode: api.classes.PromiseNode,
      CallbackNode: api.classes.CallbackNode,
      NodeInputType: api.types.NodeInputType,
      NodeConcurrency: api.types.NodeConcurrency,
      getNodeCredentials: api.getNodeCredentials,
      getConfig: api.getConfig,
      createLogger: api.createLogger,
      saveTokenUsage: api.saveTokenUsage,
      callService: api.callService,
      getRedisClient: api.getRedisClient,
      gravityPublish: api.gravityPublish,
      executeNodeWithRouting: api.executeNodeWithRouting,
      getAudioWebSocketManager: api.getAudioWebSocketManager,
    });

    // Register all nodes
    for (const node of nodes) {
      api.registerNode(node);
    }
  },
});

export default plugin;
`;

  fs.writeFileSync(path.join(outputDir, "index.ts"), content);
}
