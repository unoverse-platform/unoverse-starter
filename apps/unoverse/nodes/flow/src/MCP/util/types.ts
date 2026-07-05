/**
 * MCP (Model Context Protocol) Service Node Types
 */

/**
 * JSON Schema for defining MCP service methods
 */
export interface MCPMethodSchema {
  input: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  output: {
    type: string;
    properties: Record<string, any>;
  };
}

/**
 * MCP Service Schema Configuration
 */
export interface MCPServiceSchema {
  name: string;
  version: string;
  description: string;
  methods: Record<string, MCPMethodSchema>;
}

/**
 * MCP Node Configuration
 */
export interface MCPConfig {
  serviceSchema: MCPServiceSchema;
  methodName?: string;
  methodParams?: Record<string, any>;
}

/**
 * MCP Node Output
 */
export interface MCPOutput {
  request?: {
    method: string;
    params: Record<string, any>;
  };
  response?: any;
  error?: string;
}

/**
 * MCP Service Request
 */
export interface MCPServiceRequest {
  method: string;
  params: Record<string, any>;
  requestId: string;
}

/**
 * MCP Service Response
 */
export interface MCPServiceResponse {
  result?: any;
  error?: string;
  requestId: string;
}
