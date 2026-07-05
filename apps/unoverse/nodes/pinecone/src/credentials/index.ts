/**
 * Pinecone Credential Definition
 */

export const PineconeCredential = {
  name: "pineconeCredential",
  displayName: "Pinecone",
  description: "Credentials for Pinecone vector database",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Pinecone API key",
      placeholder: "pc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    },
    {
      name: "environment",
      displayName: "Environment",
      type: "string" as const,
      required: true,
      description: "Your Pinecone environment",
      placeholder: "us-east-1-aws"
    },
  ],
};
