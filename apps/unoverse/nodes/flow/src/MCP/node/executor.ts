import { getPlatformDependencies, type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { MCPServiceSchema } from "../util/types";

// Get platform dependencies
const { PromiseNode } = getPlatformDependencies();

const NODE_TYPE = "MCP";

interface MCPConfig {
  serviceSchema: MCPServiceSchema;
  debugMode?: boolean;
}

export default class MCPExecutor extends PromiseNode<MCPConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: MCPConfig,
    context: NodeExecutionContext
  ): Promise<any> {
    // This is a service node - it should not be executed in normal workflow
    throw new Error("MCP is a service node - it responds to SERVICE_CALL signals only");
  }

  // This method is called when the service receives a SERVICE_CALL signal
  async handleServiceCall(
    method: string,
    params: any,
    config: any,
    context: NodeExecutionContext
  ): Promise<any> {
    this.logger.info(`Handling SERVICE_CALL: ${method}`, {
      method,
      nodeId: context.nodeId,
      params
    });

    // Check if config is nested or direct
    const actualConfig = config?.config ? config.config : config;
    const serviceSchema = actualConfig?.serviceSchema;

    if (!serviceSchema) {
      throw new Error("Service schema not configured");
    }

    try {
      switch (method) {
        case 'getSchema': {
          // Simply return the configured schema
          this.logger.info("Returning service schema", {
            schemaName: serviceSchema.name
          });
          return serviceSchema;
        }
        
        case 'callMethod': {
          // Extract the method name and parameters from the call
          const { methodName, methodParams } = params;
          
          if (!methodName) {
            throw new Error("methodName is required in params");
          }
          
          // Validate the method exists in the schema
          if (!serviceSchema.methods || !serviceSchema.methods[methodName]) {
            throw new Error(`Method '${methodName}' not found in service schema`);
          }
          
          // Create a unique request ID
          const requestId = `${context.executionId}-${Date.now()}`;
          
          // Emit the request through the output
          // In a state machine, this will trigger the connected node
          const request = {
            method: methodName,
            params: methodParams,
            requestId,
            schema: serviceSchema.methods[methodName]
          };
          
          this.logger.info(`Forwarding service request`, {
            method: methodName,
            requestId
          });
          
          // In a reactive state machine, we emit and wait for the response
          // The state machine will handle the flow
          return new Promise((resolve, reject) => {
            // Emit the request
            this.emit({ request });
            
            // Set up a listener for the response
            // This is handled by the state machine when input arrives
            const responseHandler = (response: any) => {
              if (response.requestId === requestId) {
                if (response.error) {
                  reject(new Error(response.error));
                } else {
                  resolve(response.result);
                }
              }
            };
            
            // In practice, the state machine handles this flow
            // This is a simplified version for illustration
            setTimeout(() => {
              reject(new Error(`Timeout waiting for response to ${methodName}`));
            }, 30000);
          });
        }
        
        default:
          throw new Error(`Unknown service method: ${method}. Available methods: getSchema, callMethod`);
      }
    } catch (error) {
      this.logger.error(`SERVICE_CALL failed: ${method}`, {
        method,
        error: (error as Error).message
      });
      throw error;
    }
  }
}
