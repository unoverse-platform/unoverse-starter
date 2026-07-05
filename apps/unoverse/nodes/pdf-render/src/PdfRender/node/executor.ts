import { PromiseNode, type NodeExecutionContext, type ValidationResult } from "@gravity-platform/plugin-base";
import { PdfRenderOutput } from "../util/types";
import { renderComponentToPdf } from "../service/renderService";

const NODE_TYPE = "PdfRender";

export class PdfRenderExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async validateConfig(config: Record<string, any>): Promise<ValidationResult> {
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: Record<string, any>,
    context: NodeExecutionContext,
  ): Promise<PdfRenderOutput> {
    const logger = context.api?.createLogger?.(NODE_TYPE) || this.logger;
    const startTime = Date.now();

    logger.info(`🖨️ [PdfRender] Starting PDF render for node: ${context.nodeId}`);

    // componentSpec comes via config template resolution (type: "object", ui:field: "template")
    // The user wires it as a JS template: return signal.PoliceReport.componentSpec
    const componentSpec = config.componentSpec;

    if (!componentSpec || !componentSpec.componentUrl) {
      throw new Error(
        "No componentSpec found in config. Configure the Component Spec field with a template that resolves the upstream print node's componentSpec.",
      );
    }

    logger.info(`🖨️ [PdfRender] Rendering component: ${componentSpec.type}`, {
      componentUrl: componentSpec.componentUrl,
      hasProps: !!componentSpec.props,
      pageSize: config.pageSize || "letter",
      orientation: config.orientation || "portrait",
    });

    const renderConfig = {
      componentSpec,
      pageSize: config.pageSize || "letter",
      orientation: config.orientation || "portrait",
    };

    const result = await renderComponentToPdf(renderConfig, logger);

    // Generate filename
    const filename = config.filename || `${componentSpec.type}-${Date.now()}.pdf`;

    const finalResult: PdfRenderOutput = {
      __outputs: {
        output: {
          pdfBase64: result.pdfBase64,
          contentType: "application/pdf",
          filename,
          pages: result.pages,
          size: result.size,
        },
      },
    };

    logger.info(
      `🖨️ [PdfRender] PDF generated for node: ${context.nodeId}, ` +
        `${result.pages} pages, ${Math.round(result.size / 1024)}KB, ` +
        `total: ${Date.now() - startTime}ms`,
    );

    return finalResult;
  }
}
