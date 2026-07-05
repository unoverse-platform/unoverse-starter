import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { ApifyStarterConfig, ApifyStarterExecutorOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { startApifyWebScraper, startApifyActor } from "../service/apifyActorService";
import { validateApifyStarterConfig } from "../util/validation";

const NODE_TYPE = "ApifyStarter";

export class ApifyStarterExecutor extends PromiseNode<ApifyStarterConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: ApifyStarterConfig,
    context: NodeExecutionContext
  ): Promise<ApifyStarterExecutorOutput> {
    const logger = createLogger("ApifyStarter");
    
    // Validate configuration
    const validation = validateApifyStarterConfig(config);
    if (!validation.success) {
      throw new Error(validation.error);
    }

    // Build credential context for service
    const credentialContext = this.buildCredentialContext(context);

    try {
      // Check if this is a task ID (contains ~) or an actor ID
      const isTask = config.actorId.includes('~');
      
      if (isTask) {
        logger.info("Starting Apify task asynchronously", {
          taskId: config.actorId,
        });
        
        // Parse URLs from config
        const urlList = typeof config.urls === 'string' ? JSON.parse(config.urls) : config.urls;
        
        // Format URLs for Apify task (expects startUrls array)
        const taskInput = {
          startUrls: urlList.map((url: string) => ({ url }))
        };
        
        logger.info("Task input", {
          urlCount: urlList.length,
          firstUrl: urlList[0]
        });
        
        // Start task asynchronously - fire and forget
        const runId = await startApifyActor(
          config.actorId,
          taskInput,
          credentialContext.credentials
        );
        
        logger.info("Successfully started Apify task", {
          taskId: config.actorId,
          runId,
        });
        
        // Use __outputs pattern for multi-output routing
        return {
          __outputs: {
            runId,
            status: "RUNNING",
          }
        };
      } else {
        logger.info("Starting Apify actor", {
          actorId: config.actorId,
          waitForCompletion: config.waitForCompletion,
        });
        
        // Start the Apify actor - service will handle URL parsing
        const runId = await startApifyWebScraper(
          config.urls,
          { actorId: config.actorId },
          credentialContext
        );

        logger.info("Successfully started Apify actor", {
          runId,
        });

        // If waitForCompletion is true, we could implement polling logic here
        // For now, we'll just return the run ID
        if (config.waitForCompletion) {
          logger.warn("Wait for completion not yet implemented, returning run ID immediately");
        }

        // Use __outputs pattern for multi-output routing
        return {
          __outputs: {
            runId,
            status: "RUNNING",
          }
        };
      }
    } catch (error: any) {
      logger.error("Failed to start Apify actor", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Build credential context from execution context
   */
  private buildCredentialContext(context: NodeExecutionContext) {
    return {
      credentials: context.credentials || {},
      nodeType: NODE_TYPE,
      workflowId: context.workflow?.id || "",
      executionId: context.executionId || "",
      nodeId: context.nodeId || "",
    };
  }
}
