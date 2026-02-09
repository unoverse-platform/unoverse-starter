import * as fs from "fs";
import * as path from "path";
import type { ComponentMetadata } from "./ComponentScanner";
import { ReactSSRConverter } from "./ReactSSRConverter";
import { generateExecutor } from "./generators/ExecutorGenerator";
import { generateNodeIndex } from "./generators/NodeIndexGenerator";
import { generateTemplates } from "./generators/TemplateGenerator";
import { generateTypes } from "./generators/TypesGenerator";
import { generatePublishComponent } from "./generators/PublishComponentGenerator";

/**
 * Simplified FileGenerator - orchestrates file generation
 * Each file type has its own focused generator
 */
export class FileGenerator {
  private outputDir: string;
  private converter: ReactSSRConverter;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    this.converter = new ReactSSRConverter();
  }

  /**
   * Generate all files for a component
   */
  async generate(metadata: ComponentMetadata): Promise<void> {
    const componentDir = path.join(this.outputDir, metadata.name);

    // Create directory structure
    this.ensureDir(componentDir);
    this.ensureDir(path.join(componentDir, "node"));
    this.ensureDir(path.join(componentDir, "service"));
    this.ensureDir(path.join(componentDir, "util"));

    // Convert React component to HTML/CSS/URL
    const { html, css, componentUrl } = await this.convertComponent(metadata);

    // Generate all files
    this.writeFile(path.join(componentDir, "node", "index.ts"), generateNodeIndex(metadata));
    this.writeFile(path.join(componentDir, "node", "executor.ts"), generateExecutor(metadata));
    this.writeFile(
      path.join(componentDir, "service", "templates.ts"),
      generateTemplates(metadata, html, css, componentUrl),
    );
    this.writeFile(path.join(componentDir, "service", "publishComponent.ts"), generatePublishComponent());
    this.writeFile(path.join(componentDir, "util", "types.ts"), generateTypes(metadata));
  }

  /**
   * Generate bundle only for templates (no workflow node files)
   * Templates are bundled to components/ but don't get workflow nodes
   */
  async generateTemplateOnly(metadata: ComponentMetadata): Promise<void> {
    // Bundle as template (full Tailwind CSS)
    await this.convertComponent(metadata, true);
    // That's it! The converter already saves to components/
  }

  /**
   * Convert React component to HTML/CSS/JS
   */
  private async convertComponent(
    metadata: ComponentMetadata,
    isTemplate: boolean = false,
  ): Promise<{
    html: string;
    css: string;
    componentUrl: string;
  }> {
    // Bundle React component to components/
    const result = await this.converter.convertToHTML(metadata.componentPath, isTemplate);

    return {
      html: result.html,
      css: result.css,
      componentUrl: result.componentUrl,
    };
  }

  /**
   * Write file to disk
   */
  private writeFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content);
  }

  /**
   * Ensure directory exists
   */
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
