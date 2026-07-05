# @gravityai-dev/flow

Flow control nodes for GravityWorkflow - essential building blocks for workflow logic and data processing.

## Nodes Included

### Core Flow Control
- **Code** - Execute custom JavaScript code to transform data
- **IfElse** - Conditional routing based on boolean expressions
- **Loop** - Iterate through arrays with state management
- **Context** - Manage workflow context and variables
- **Relay** - Simple data passthrough and routing

### Utility Nodes
- **Note** - Documentation and annotation within workflows
- **UMAP** - Dimensionality reduction for data visualization

## Installation

```bash
npm install @gravityai-dev/flow
```

## Usage

This package follows the Gravity Plugin System architecture. It registers automatically when loaded by the platform.

### Node Categories

All nodes are categorized as "Flow" nodes and provide essential workflow control capabilities:

- **Promise Nodes**: Code, IfElse, Context, Relay, Note, UMAP
- **Callback Nodes**: Loop (for stateful iteration)

### Key Features

- **Template Resolution**: All nodes support template expressions in their configuration
- **Type Safety**: Full TypeScript support with proper type definitions
- **State Management**: Loop node maintains iteration state across events
- **Error Handling**: Comprehensive error handling and logging
- **Platform Integration**: Seamless integration with GravityWorkflow platform

## Development

```bash
# Build the package
npm run build

# Watch for changes
npm run dev

# Clean build artifacts
npm run clean
```

## Architecture

This package uses the standard Gravity plugin structure:
- `src/NodeName/` - Individual node implementations
- `src/shared/platform.ts` - Platform dependency management
- `src/index.ts` - Plugin registration and setup
