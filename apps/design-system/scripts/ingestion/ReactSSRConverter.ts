import * as fs from "fs";
import * as path from "path";
import { build } from "vite";

/**
 * Bundle React components with pure CSS for Shadow DOM rendering
 * - Uses CSS Modules for scoped component styles
 * - Injects CSS into JS bundle for Shadow DOM isolation
 * - Generates IIFE format for browser globals
 * - NO Tailwind - pure CSS with design tokens
 */
export class ReactSSRConverter {
  async convertToHTML(
    componentPath: string,
    isTemplate: boolean = false,
  ): Promise<{
    html: string;
    css: string;
    componentUrl: string;
    tokens: Record<string, any>;
  }> {
    try {
      console.log(`   🔄 Bundling ${path.basename(componentPath)} for React client...`);

      const componentName = path.basename(componentPath, ".tsx");

      // Setup paths - output to packages/design-system (runtime package)
      const appRoot = path.join(path.dirname(componentPath), "../../../");
      const packagesRoot = path.resolve(appRoot, "../../packages/design-system");
      const distDir = path.join(packagesRoot, "components");
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

      // Create temporary files for Vite bundling (in apps/design-system)
      const tempEntryPath = path.join(appRoot, ".temp-entry.tsx");
      const tempCssPath = path.join(appRoot, ".temp-tailwind.css");

      // Pure CSS configuration - NO Tailwind
      // Import design system (tokens, base styles, form styles)
      const designSystemPath = path.join(appRoot, "storybook/styles/index.css");

      const tempCssContent = `
        @import "${designSystemPath.replace(/\\/g, "/")}";
      `;

      console.log(`   📄 ${isTemplate ? "Template" : "Component"}: Pure CSS (CSS Modules)`);

      fs.writeFileSync(tempCssPath, tempCssContent);

      const entryContent = `
        import '${tempCssPath.replace(/\\/g, "/")}';
        export { default } from '${componentPath.replace(/\\/g, "/")}';
      `;
      fs.writeFileSync(tempEntryPath, entryContent);

      // Vite build configuration
      await build({
        esbuild: {
          // Use classic JSX transform so it compiles to React.createElement
          // This avoids jsx-runtime issues in UMD bundles
          jsx: "transform",
          jsxFactory: "React.createElement",
          jsxFragment: "React.Fragment",
        },
        build: {
          lib: {
            entry: tempEntryPath,
            formats: ["umd"],
            name: componentName,
            fileName: () => `${componentName}.js`,
          },
          rollupOptions: {
            external: (id) => {
              // Force externalize React and related packages
              return (
                id === "react" ||
                id === "react-dom" ||
                id === "react/jsx-runtime" ||
                id.startsWith("react/") ||
                id.startsWith("react-dom/")
              );
            },
            output: {
              format: "umd",
              globals: {
                react: "React",
                "react-dom": "ReactDOM",
                "react/jsx-runtime": "React",
              },
              assetFileNames: `${componentName}.[ext]`,
            },
          },
          outDir: distDir,
          emptyOutDir: false,
          minify: "esbuild",
          sourcemap: false,
          cssCodeSplit: false,
          cssMinify: true,
          target: "es2015",
        },
        css: {
          modules: {
            localsConvention: "camelCase",
            generateScopedName: "[name]__[local]___[hash:base64:5]",
          },
          postcss: {
            plugins: [
              (await import("autoprefixer")).default,

              // }),
            ],
          },
        },
        configFile: false,
        logLevel: "warn",
      });

      // Clean up temp files
      if (fs.existsSync(tempEntryPath)) {
        fs.unlinkSync(tempEntryPath);
      }
      if (fs.existsSync(tempCssPath)) {
        fs.unlinkSync(tempCssPath);
      }

      const distPath = path.join(distDir, `${componentName}.js`);

      // Inject CSS into JS bundle for Shadow DOM
      const generatedCssPath = path.join(distDir, `${componentName}.css`);
      let css = "";

      if (fs.existsSync(generatedCssPath)) {
        css = fs.readFileSync(generatedCssPath, "utf-8");
        const jsContent = fs.readFileSync(distPath, "utf-8");

        // Prepend CSS storage code to JS bundle
        const cssInjectionCode = `(function(){if(typeof document!=='undefined'){window.__GRAVITY_COMPONENT_CSS__=window.__GRAVITY_COMPONENT_CSS__||{};window.__GRAVITY_COMPONENT_CSS__['${componentName}']=${JSON.stringify(
          css,
        )};}})();`;
        fs.writeFileSync(distPath, cssInjectionCode + jsContent);
        fs.unlinkSync(generatedCssPath);
      }

      const fileSize = fs.statSync(distPath).size;
      console.log(`   ✅ Generated ${(fileSize / 1024).toFixed(1)}KB bundle`);

      return {
        html: `<div id="gravity-${componentName.toLowerCase()}"></div>`,
        css,
        componentUrl: `/components/${componentName}.js?v=${Date.now()}`,
        tokens: {},
      };
    } catch (error: any) {
      console.error(`   ❌ Vite bundling failed: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
      throw error;
    }
  }
}

// Export as MitosisConverter for compatibility
export { ReactSSRConverter as MitosisConverter };
