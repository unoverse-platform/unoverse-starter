/**
 * Pinecone client utilities for the package
 */

import { Pinecone } from "@pinecone-database/pinecone";
import { getNodeCredentials } from "./platform";

export interface CredentialContext {
  credentials: Record<string, any>;
  nodeType: string;
  workflowId: string;
  executionId: string;
  nodeId: string;
}

/**
 * Initialize Pinecone client with credentials
 */
export async function initializePineconeClient(context: CredentialContext): Promise<Pinecone> {
  const credentials = await getNodeCredentials(context, "pineconeCredential");
  
  if (!credentials?.apiKey) {
    throw new Error("Pinecone API key not found in credentials");
  }
  
  return new Pinecone({ 
    apiKey: credentials.apiKey 
  });
}
