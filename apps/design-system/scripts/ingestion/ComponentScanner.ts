import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

export interface ComponentMetadata {
  name: string;
  storiesPath: string;
  componentPath: string;
  argTypes: Record<string, any>;
  storyDefaults?: Record<string, any>;
  workflowSize?: { width: number; height: number };
  isPrintPage?: boolean;
  // AI selection guidance, authored in the story's `meta.parameters.ai` block.
  // Surfaced into the generated node definition so the Unoverse MCP catalog can
  // rank this display component by fit (it embeds whenToUse/description).
  aiMeta?: { description?: string; whenToUse?: string };
}

// What the scanner is pointed at. Only "component" nodes are AI-selectable
// chat UI surfaces that need ranking guidance; templates are never emitted by
// the AI (bundle-only), so they get no AI metadata and no warning.
export type ScanKind = "component" | "printPage" | "template";

// Component names become the UMD bundle's global var (ReactSSRConverter sets
// `lib.name = componentName`). If that collides with a browser/JS built-in
// global, the UMD wrapper clobbers it and the client renders the native global
// instead of the React component — e.g. a node named `Image` resolved to
// `window.Image` and threw "Failed to construct 'Image': use the 'new' operator"
// at render time. Node (ts-node) can't see browser globals, so we curate the
// realistic PascalCase collisions rather than probing `globalThis`.
const RESERVED_COMPONENT_NAMES = new Set<string>([
  // DOM constructors exposed on window
  "Image", "Audio", "Option", "Text", "Comment", "Range", "Event", "Node",
  "Element", "Attr", "Document", "Window", "Screen", "Selection", "Touch",
  "Request", "Response", "Headers", "Notification", "Worker", "History",
  "Location", "Navigator", "Blob", "File", "FileReader", "FormData", "Path2D",
  "MediaSource", "WebSocket", "XMLHttpRequest", "URL",
  // Core JS globals
  "Object", "Array", "Function", "String", "Number", "Boolean", "Date",
  "RegExp", "Error", "Map", "Set", "WeakMap", "WeakSet", "Promise", "Proxy",
  "Symbol", "Math", "JSON", "Reflect", "BigInt",
  // React identifiers in the bundle
  "React", "ReactDOM", "Fragment",
]);

export class ComponentScanner {
  private componentsDir: string;
  private kind: ScanKind;

  constructor(componentsDir: string, kind: ScanKind = "component") {
    this.componentsDir = componentsDir;
    this.kind = kind;
  }

  /**
   * Fail loudly when a component/template name would clobber a built-in global
   * once bundled as a UMD global var. Throws so `gen:nodes` exits non-zero
   * instead of silently producing a node that breaks at render.
   */
  static assertSafeComponentName(name: string): void {
    if (RESERVED_COMPONENT_NAMES.has(name)) {
      throw new Error(
        `Component name "${name}" collides with a built-in global. ` +
          `It is bundled as a UMD global of the same name, which clobbers the native "${name}" ` +
          `and makes the client render the global instead of your component (e.g. "Failed to construct '${name}'"). ` +
          `Rename it to something non-colliding (e.g. "${name}Block", "${name}Node", or a more descriptive name).`,
      );
    }
  }

  /**
   * Scan components folder and extract metadata from stories
   *
   * NOTE: This only scans /storybook/components/ directory.
   * Templates in /storybook/templates/ are NOT scanned because they are
   * layout containers (like ChatLayout) that should NOT be generated as
   * workflow nodes or AI-streamable components. Templates are used by
   * the client app directly, not sent from the AI.
   */
  async scan(): Promise<ComponentMetadata[]> {
    const components: ComponentMetadata[] = [];

    try {
      const items = fs.readdirSync(this.componentsDir, { withFileTypes: true });

      for (const item of items) {
        if (item.isDirectory()) {
          const componentDir = path.join(this.componentsDir, item.name);

          // Look for all .stories.tsx files in the directory
          const dirContents = fs.readdirSync(componentDir);
          const storyFiles = dirContents.filter((file) => file.endsWith(".stories.tsx"));

          for (const storyFile of storyFiles) {
            const componentName = storyFile.replace(".stories.tsx", "");
            const storiesPath = path.join(componentDir, storyFile);

            // Extract metadata from stories file
            const metadata = await this.extractMetadata(componentName, storiesPath, componentDir);
            if (metadata) {
              components.push(metadata);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error scanning components:", error);
    }

    return components;
  }

  /**
   * Extract component metadata from stories file using Storybook's official CSF parser
   */
  private async extractMetadata(
    name: string,
    storiesPath: string,
    componentDir: string,
  ): Promise<ComponentMetadata | null> {
    try {
      // Read the stories file
      const code = fs.readFileSync(storiesPath, "utf-8");

      // Extract argTypes and story defaults from source code
      const argTypes = this.extractArgTypesFromSource(code);
      const storyDefaults = this.extractStoryDefaultsFromSource(code, componentDir);
      const workflowSize = this.extractWorkflowSizeFromSource(code);
      // Templates are bundle-only (never AI-selected), so they carry no AI meta.
      const aiMeta = this.kind === "template" ? undefined : this.extractAiMetaFromSource(code);

      if (!argTypes || Object.keys(argTypes).length === 0) {
        console.warn(
          `⚠️  [ComponentScanner] SKIPPING "${name}" - no argTypes found in stories file. Add argTypes to include this template in the build.`,
        );
        return null;
      }

      // Nudge authors toward AI-selection guidance (display components are how
      // the AI builds chat UIs; without whenToUse they're indistinguishable in
      // the ranked node catalog). Components only — templates aren't AI-selected.
      // Warn, don't fail — it's optional metadata.
      if (this.kind === "component" && !aiMeta?.whenToUse) {
        console.warn(
          `⚠️  [ComponentScanner] "${name}" has no parameters.ai.whenToUse — it will rank poorly in the AI node catalog. Add a meta.parameters.ai block.`,
        );
      }

      return {
        name,
        storiesPath,
        componentPath: path.join(componentDir, `${name}.tsx`),
        argTypes,
        storyDefaults,
        workflowSize,
        aiMeta,
      };
    } catch (error) {
      console.error(`❌ [DesignSystem] Error extracting metadata for ${name}:`, error);
      return null;
    }
  }

  /**
   * Extract argTypes from TypeScript source using TS Compiler API
   */
  private extractArgTypesFromSource(code: string): Record<string, any> {
    const argTypes: Record<string, any> = {};

    // Create a source file
    const sourceFile = ts.createSourceFile("temp.tsx", code, ts.ScriptTarget.Latest, true);

    // Find the meta object
    const visit = (node: ts.Node) => {
      // Look for: const meta: Meta<typeof Card> = { ... }
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach((declaration) => {
          if (
            ts.isVariableDeclaration(declaration) &&
            declaration.name.getText() === "meta" &&
            declaration.initializer &&
            ts.isObjectLiteralExpression(declaration.initializer)
          ) {
            // Find argTypes property
            declaration.initializer.properties.forEach((prop) => {
              if (
                ts.isPropertyAssignment(prop) &&
                prop.name.getText() === "argTypes" &&
                ts.isObjectLiteralExpression(prop.initializer)
              ) {
                // Extract each argType property
                prop.initializer.properties.forEach((argProp) => {
                  if (ts.isPropertyAssignment(argProp)) {
                    const propName = argProp.name.getText();
                    const propValue = this.parseArgTypeProperty(argProp.initializer);
                    argTypes[propName] = propValue;
                  }
                });
              }
            });
          }
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return argTypes;
  }

  /**
   * Parse an individual argType property
   */
  private parseArgTypeProperty(node: ts.Expression): any {
    const result: any = {
      control: "text",
      name: "",
    };

    if (ts.isObjectLiteralExpression(node)) {
      node.properties.forEach((prop) => {
        if (ts.isPropertyAssignment(prop)) {
          const key = prop.name.getText();
          const value = prop.initializer;

          if (key === "control") {
            // Handle string control
            if (ts.isStringLiteral(value)) {
              result.control = { type: value.text };
            }
            // Handle object control (e.g., { type: "range", min: 1, max: 10, step: 0.1 })
            else if (ts.isObjectLiteralExpression(value)) {
              result.control = this.parseObjectLiteral(value);
            }
          } else if (key === "options" && ts.isArrayLiteralExpression(value)) {
            // Extract options array
            if (!result.control || typeof result.control === "string") {
              result.control = { type: "select" };
            }
            result.control.options = value.elements.map((el) => {
              if (ts.isStringLiteral(el)) {
                return el.text;
              }
              return el.getText().replace(/['"]/g, "");
            });
          } else if (key === "description" && ts.isStringLiteral(value)) {
            result.description = value.text;
          } else if (key === "workflowInput") {
            // Extract workflowInput boolean flag
            if (value.kind === ts.SyntaxKind.TrueKeyword) {
              result.workflowInput = true;
            } else if (value.kind === ts.SyntaxKind.FalseKeyword) {
              result.workflowInput = false;
            }
          }
        }
      });
    }

    return result;
  }

  /**
   * Extract DEFAULT_DATA from stories file using TypeScript AST
   * Supports both inline DEFAULT_DATA and imported defaults (e.g., AIResponseDefaults)
   */
  private extractStoryDefaultsFromSource(code: string, componentDir: string): Record<string, any> | undefined {
    const sourceFile = ts.createSourceFile("temp.ts", code, ts.ScriptTarget.Latest, true);

    let defaultData: Record<string, any> | undefined;
    let importedDefaultsName: string | undefined;

    // First pass: Find imported defaults from "./defaults" file
    const findImports = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const importClause = node.importClause;
        const moduleSpecifier = node.moduleSpecifier;

        // Check if importing from "./defaults"
        if (
          ts.isStringLiteral(moduleSpecifier) &&
          (moduleSpecifier.text === "./defaults" || moduleSpecifier.text === "./defaults.ts")
        ) {
          if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
            importClause.namedBindings.elements.forEach((element) => {
              const name = element.name.text;
              // Store the first import from defaults file (could be "Defaults" suffix or "default" prefix)
              if (!importedDefaultsName) {
                importedDefaultsName = name;
              }
            });
          }
        }
      }
      ts.forEachChild(node, findImports);
    };

    findImports(sourceFile);

    // Second pass: Find DEFAULT_DATA constant or Default story args
    const visit = (node: ts.Node) => {
      // Look for inline DEFAULT_DATA constant
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach((declaration) => {
          if (ts.isIdentifier(declaration.name) && declaration.name.text === "DEFAULT_DATA") {
            if (declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)) {
              defaultData = this.parseObjectLiteral(declaration.initializer);
            }
          }
        });
      }

      // Look for Default story using imported defaults (e.g., args: AIResponseDefaults or args: { bookingData: defaultBookingData })
      if (!defaultData && importedDefaultsName && ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach((declaration) => {
          if (ts.isIdentifier(declaration.name) && declaration.name.text === "Default") {
            if (declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)) {
              // Look for args property
              declaration.initializer.properties.forEach((prop) => {
                if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === "args") {
                  // Case 1: args: ImportedDefaultsName (direct reference)
                  // Unwrap AsExpression (e.g. "PoliceReportDefaults as any")
                  const argsInitializer = ts.isAsExpression(prop.initializer)
                    ? prop.initializer.expression
                    : prop.initializer;
                  if (ts.isIdentifier(argsInitializer) && argsInitializer.text === importedDefaultsName) {
                    const defaultsPath = path.join(componentDir, "defaults.ts");
                    if (fs.existsSync(defaultsPath)) {
                      const defaultsCode = fs.readFileSync(defaultsPath, "utf-8");
                      defaultData = this.extractDefaultsFromFile(defaultsCode, importedDefaultsName);
                    }
                  }

                  // Case 2: args: { propName: importedDefault, ... } (object literal with imported values)
                  else if (ts.isObjectLiteralExpression(prop.initializer)) {
                    const argsObject: Record<string, any> = {};
                    prop.initializer.properties.forEach((argProp) => {
                      if (ts.isPropertyAssignment(argProp) && ts.isIdentifier(argProp.name)) {
                        const propName = argProp.name.text;

                        // Check if value is an imported default
                        if (ts.isIdentifier(argProp.initializer)) {
                          const valueName = argProp.initializer.text;
                          // Load the imported default from defaults.ts
                          const defaultsPath = path.join(componentDir, "defaults.ts");
                          if (fs.existsSync(defaultsPath)) {
                            const defaultsCode = fs.readFileSync(defaultsPath, "utf-8");
                            const importedValue = this.extractDefaultsFromFile(defaultsCode, valueName);
                            if (importedValue) {
                              argsObject[propName] = importedValue;
                            }
                          }
                        } else {
                          // Parse inline value
                          const value = this.parseExpression(argProp.initializer);
                          if (value !== undefined) {
                            argsObject[propName] = value;
                          }
                        }
                      }
                    });
                    if (Object.keys(argsObject).length > 0) {
                      defaultData = argsObject;
                    }
                  }
                }
              });
            }
          }
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return defaultData;
  }

  /**
   * Extract defaults from a defaults.ts file
   */
  private extractDefaultsFromFile(code: string, exportName: string): Record<string, any> | undefined {
    const sourceFile = ts.createSourceFile("defaults.ts", code, ts.ScriptTarget.Latest, true);

    // First pass: collect all top-level variable declarations so we can resolve identifier references
    const declarations = new Map<string, ts.Expression>();
    const collectDeclarations = (node: ts.Node) => {
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach((declaration) => {
          if (ts.isIdentifier(declaration.name) && declaration.initializer) {
            declarations.set(declaration.name.text, declaration.initializer);
          }
        });
      }
      ts.forEachChild(node, collectDeclarations);
    };
    collectDeclarations(sourceFile);

    // Second pass: parse the target export, resolving identifier references
    let defaults: Record<string, any> | undefined;
    const targetInit = declarations.get(exportName);
    if (targetInit && ts.isObjectLiteralExpression(targetInit)) {
      defaults = this.parseObjectLiteralWithScope(targetInit, declarations);
    }

    return defaults;
  }

  /**
   * Parse ObjectLiteralExpression, resolving identifier references from scope
   */
  private parseObjectLiteralWithScope(
    node: ts.ObjectLiteralExpression,
    scope: Map<string, ts.Expression>,
  ): Record<string, any> {
    const result: Record<string, any> = {};

    node.properties.forEach((prop) => {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        const name = prop.name.text;
        let value: any;

        // If the value is an identifier, resolve it from scope
        if (ts.isIdentifier(prop.initializer) && scope.has(prop.initializer.text)) {
          const resolved = scope.get(prop.initializer.text)!;
          value = ts.isObjectLiteralExpression(resolved)
            ? this.parseObjectLiteral(resolved)
            : this.parseExpression(resolved);
        } else {
          value = this.parseExpression(prop.initializer);
        }

        if (value !== undefined) {
          result[name] = value;
        }
      }
    });

    return result;
  }

  /**
   * Parse TypeScript ObjectLiteralExpression to plain object
   */
  private parseObjectLiteral(node: ts.ObjectLiteralExpression): Record<string, any> {
    const result: Record<string, any> = {};

    node.properties.forEach((prop) => {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        const name = prop.name.text;
        const value = this.parseExpression(prop.initializer);
        if (value !== undefined) {
          result[name] = value;
        }
      }
    });

    return result;
  }

  /**
   * Parse TypeScript expression to JavaScript value
   */
  private parseExpression(node: ts.Expression): any {
    if (ts.isStringLiteral(node)) {
      return node.text;
    }
    if (ts.isNumericLiteral(node)) {
      return Number(node.text);
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) {
      return true;
    }
    if (node.kind === ts.SyntaxKind.FalseKeyword) {
      return false;
    }
    if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
      return undefined;
    }
    if (ts.isArrayLiteralExpression(node)) {
      return node.elements.map((el) => this.parseExpression(el));
    }
    if (ts.isObjectLiteralExpression(node)) {
      return this.parseObjectLiteral(node);
    }
    return undefined;
  }

  /**
   * Extract workflowSize from parameters.workflowSize in the meta object
   */
  private extractWorkflowSizeFromSource(code: string): { width: number; height: number } | undefined {
    const sourceFile = ts.createSourceFile("temp.tsx", code, ts.ScriptTarget.Latest, true);
    let workflowSize: { width: number; height: number } | undefined;

    const visit = (node: ts.Node) => {
      // Look for: const meta: Meta<typeof Component> = { ... }
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach((declaration) => {
          if (
            ts.isVariableDeclaration(declaration) &&
            declaration.name.getText() === "meta" &&
            declaration.initializer &&
            ts.isObjectLiteralExpression(declaration.initializer)
          ) {
            // Find parameters property
            declaration.initializer.properties.forEach((prop) => {
              if (
                ts.isPropertyAssignment(prop) &&
                prop.name.getText() === "parameters" &&
                ts.isObjectLiteralExpression(prop.initializer)
              ) {
                // Find workflowSize property inside parameters
                prop.initializer.properties.forEach((paramProp) => {
                  if (
                    ts.isPropertyAssignment(paramProp) &&
                    paramProp.name.getText() === "workflowSize" &&
                    ts.isObjectLiteralExpression(paramProp.initializer)
                  ) {
                    const sizeObj = this.parseObjectLiteral(paramProp.initializer);
                    if (sizeObj && typeof sizeObj.width === "number" && typeof sizeObj.height === "number") {
                      workflowSize = { width: sizeObj.width, height: sizeObj.height };
                    }
                  }
                });
              }
            });
          }
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return workflowSize;
  }

  /**
   * Extract AI selection guidance from parameters.ai in the meta object.
   * Shape: parameters: { ai: { description?: string, whenToUse?: string } }
   */
  private extractAiMetaFromSource(code: string): { description?: string; whenToUse?: string } | undefined {
    const sourceFile = ts.createSourceFile("temp.tsx", code, ts.ScriptTarget.Latest, true);
    let aiMeta: { description?: string; whenToUse?: string } | undefined;

    const visit = (node: ts.Node) => {
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach((declaration) => {
          if (
            ts.isVariableDeclaration(declaration) &&
            declaration.name.getText() === "meta" &&
            declaration.initializer &&
            ts.isObjectLiteralExpression(declaration.initializer)
          ) {
            declaration.initializer.properties.forEach((prop) => {
              if (
                ts.isPropertyAssignment(prop) &&
                prop.name.getText() === "parameters" &&
                ts.isObjectLiteralExpression(prop.initializer)
              ) {
                prop.initializer.properties.forEach((paramProp) => {
                  if (
                    ts.isPropertyAssignment(paramProp) &&
                    paramProp.name.getText() === "ai" &&
                    ts.isObjectLiteralExpression(paramProp.initializer)
                  ) {
                    const obj = this.parseObjectLiteral(paramProp.initializer);
                    const result: { description?: string; whenToUse?: string } = {};
                    if (typeof obj.description === "string") result.description = obj.description;
                    if (typeof obj.whenToUse === "string") result.whenToUse = obj.whenToUse;
                    if (Object.keys(result).length > 0) aiMeta = result;
                  }
                });
              }
            });
          }
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return aiMeta;
  }
}
