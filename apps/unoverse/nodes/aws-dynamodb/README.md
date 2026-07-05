# @gravityai-dev/aws-dynamodb

AWS DynamoDB integration plugin for the Gravity workflow system. Provides nodes for database operations including put, fetch, and service operations.

## Features

- **DynamoDB**: Put records to DynamoDB tables with conditional expressions
- **DynamoDBFetch**: Fetch records by primary/sort key with null handling
- **DynamoDBService**: Service node providing NoSQL operations for other nodes
- Full AWS SDK v3 integration with document client
- Client caching for performance optimization
- Comprehensive error handling and logging

## Installation

```bash
npm install @gravityai-dev/aws-dynamodb
```

## Nodes

### DynamoDB

Uploads a record to an AWS DynamoDB table with optional conditional expressions.

**Inputs:**
- `signal`: Record data to upload (can override config record)

**Outputs:**
- `success`: Whether the upload was successful
- `itemId`: ID of the uploaded item (if available)

**Configuration:**
- `tableName`: Name of the DynamoDB table
- `record`: JS Code to transform data
- `conditionExpression`: Optional condition for the put operation
- `expressionAttributeNames`: Substitution tokens for attribute names
- `expressionAttributeValues`: Values for expression substitution

### DynamoDBFetch

Fetches a record from AWS DynamoDB table by key, returns null if not found.

**Inputs:**
- `signal`: Input object containing key values

**Outputs:**
- `output`: The fetched record or null if not found
- `found`: Whether the record was found

**Configuration:**
- `tableName`: The name of the DynamoDB table
- `primaryKey`: The field name for the primary key (partition key)
- `sortKey`: The field name for the sort key (optional)

### DynamoDBService

Provides DynamoDB operations as a service for other nodes. Marked as a service node.

**Service Connectors:**
- `nosqlService`: Provides NoSQL database operations
- Methods: put, get, query, update, delete, batchGet, batchWrite

**Configuration:**
- `region`: AWS region for DynamoDB
- `defaultTable`: Default table name (can be overridden per operation)

## Credentials

Requires AWS credentials with the following fields:
- `accessKeyId`: Your AWS access key ID
- `secretAccessKey`: Your AWS secret access key
- `region`: AWS region (e.g., us-east-1)

## Usage Example

1. Add DynamoDB node to put records to a table
2. Use DynamoDBFetch to retrieve records by key
3. Connect DynamoDBService for advanced operations
4. Configure conditional expressions for data integrity

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test
```

## License

MIT
