# @gravityai-dev/aws-bedrock

AWS Bedrock integration for Gravity workflow system, providing access to Claude AI models and embedding services.

## Features

- **BedrockClaude**: Chat completion with Claude models (Claude 3.5 Sonnet, Claude 3 Haiku, etc.)
- **BedrockEmbedding**: Text embeddings using Amazon Titan embedding models
- **BedrockEmbeddingService**: Batch embedding operations for multiple texts

## Installation

```bash
npm install @gravityai-dev/aws-bedrock
```

## Available Nodes

### BedrockClaude

Chat completion using AWS Bedrock Claude models.

**Inputs:**

- `prompt` (string): The user message or prompt
- `systemPrompt` (string, optional): System instructions for the model
- `maxTokens` (number, optional): Maximum tokens to generate (default: 4096)
- `temperature` (number, optional): Sampling temperature (0.0-1.0, default: 0.7)

**Outputs:**

- `response` (string): Generated text response from Claude
- `usage` (object): Token usage statistics

**Supported Models:**

- `anthropic.claude-3-5-sonnet-20241022-v2:0`
- `anthropic.claude-3-haiku-20240307-v1:0`
- `anthropic.claude-3-sonnet-20240229-v1:0`

### BedrockEmbedding

Generate embeddings for text using Amazon Titan models.

**Inputs:**

- `text` (string): Text to embed
- `model` (string, optional): Embedding model to use

**Outputs:**

- `embedding` (number[]): Vector embedding of the input text
- `dimensions` (number): Dimensionality of the embedding vector

### BedrockEmbeddingService

Batch embedding service for processing multiple texts efficiently.

**Inputs:**

- `texts` (string[]): Array of texts to embed
- `model` (string, optional): Embedding model to use

**Outputs:**

- `embeddings` (number[][]): Array of embedding vectors
- `count` (number): Number of embeddings generated

## Configuration

### AWS Credentials

This package requires AWS credentials with Bedrock access. Configure using the AWS credential node:

- **AWS Access Key ID**
- **AWS Secret Access Key**
- **AWS Region** (e.g., `us-east-1`)

### Required Permissions

Your AWS credentials need the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/anthropic.claude*",
        "arn:aws:bedrock:*::foundation-model/amazon.titan-embed*"
      ]
    }
  ]
}
```

## Usage Examples

### Basic Chat with Claude

```typescript
// In your workflow, connect:
// 1. Input node with prompt text
// 2. BedrockClaude node with AWS credentials
// 3. Output node to display response

// The BedrockClaude node will automatically handle:
// - AWS authentication
// - Model invocation
// - Response parsing
```

### Generating Embeddings

```typescript
// Connect BedrockEmbedding node to:
// 1. Text input (string)
// 2. AWS credentials
// 3. Vector storage or similarity comparison nodes
```

### Batch Embeddings

```typescript
// Use BedrockEmbeddingService for multiple texts:
// 1. Array of texts input
// 2. AWS credentials
// 3. Batch processing output
```

## Model Information

### Claude Models

- **Claude 3.5 Sonnet**: Most capable model, best for complex reasoning
- **Claude 3 Haiku**: Fastest model, good for simple tasks
- **Claude 3 Sonnet**: Balanced performance and speed

### Embedding Models

- **Amazon Titan Text Embeddings**: High-quality text embeddings
- **Dimensions**: 1536 (standard output size)

## Development

### Building

```bash
npm run build
```

### Project Structure

```
src/
├── BedrockClaude/          # Claude chat completion node
├── BedrockEmbedding/       # Single text embedding node
├── BedrockEmbeddingService/# Batch embedding service
├── credentials/            # AWS credential definitions
├── shared/                 # Shared utilities and client
└── index.ts               # Plugin registration
```

## Error Handling

Common issues and solutions:

- **Authentication errors**: Verify AWS credentials and region
- **Model access denied**: Ensure Bedrock model access is enabled in AWS console
- **Rate limiting**: Implement retry logic or reduce request frequency
- **Invalid model**: Check model name matches AWS Bedrock available models

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:

- GitHub Issues: https://github.com/gravityai-dev/bedrock/issues
- Documentation: See the main Gravity documentation for workflow integration
