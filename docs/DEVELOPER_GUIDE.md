# Gravity Platform Developer Guide

> **For developers building custom experiences on Gravity**

## Overview

This guide covers how to develop custom nodes, UI components, and client applications on the Gravity Platform.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GRAVITY PLATFORM (GHCR - Protected)                  │
│                                                                         │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────┐  ┌──────────────┐    │
│  │ Server  │  │ Workflow │  │ Canvas │  │ UMAP │  │ node-service │    │
│  │  :4100  │  │  :4101   │  │  :3001 │  │:5001 │  │    :4102     │    │
│  └─────────┘  └──────────┘  └────────┘  └──────┘  └──────────────┘    │
│                                                                         │
│       docker compose pull → All images from GHCR                        │
│       node-service mounts ./packages for auto-discovery                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ mounts
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PACKAGES (Your customizations)                       │
│                                                                         │
│  ┌─────────────┐ ┌────────┐ ┌─────────────┐ ┌───────────────┐          │
│  │ plugin-base │ │ openai │ │ aws-bedrock │ │ design-system │          │
│  └─────────────┘ └────────┘ └─────────────┘ └───────────────┘          │
│  ┌────────────────┐  ┌──────────────────┐                              │
│  │ gravity-client │  │ my-custom-node   │  ← You create these          │
│  └────────────────┘  └──────────────────┘                              │
│                                                                         │
│       ./packages mounted to node-service at runtime                     │
│       node-service auto-discovers all packages on startup               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ used by
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLIENT APP (Your branded experience)                 │
│                                                                         │
│  ┌─────────────────────────────────────────┐                           │
│  │              SAB App                    │                           │
│  │  (gravity-client + your OIDC config)    │                           │
│  └─────────────────────────────────────────┘                           │
│                                                                         │
│       docker compose build sab → Built from source                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### 1. Clone the Starter Template

```bash
git clone gravity-starter my-project
cd my-project
cp .env.example .env
```

### 2. Pull GHCR Images

```bash
docker compose pull
```

This pulls all protected platform images:

- server, workflow, canvas, umap, node-service

### 3. Build SAB (Client App)

```bash
docker compose build sab
```

### 4. Run Everything

```bash
docker compose up -d
```

node-service auto-discovers packages from the mounted `./packages` folder.

### 5. Access the Platform

- **Canvas** (Workflow Builder): http://localhost:3001
- **SAB** (Client App): http://localhost:3007

---

## Starter Template Structure

```
gravity-starter/
├── docker-compose.yml          # Pulls ALL GHCR images, mounts packages
├── .env.example                # Configuration template
├── apps/
│   ├── sab/                    # Client app (customize branding, OIDC)
│   └── design-system/          # Storybook for custom UI components
├── packages/                   # Mounted to node-service at runtime
│   ├── openai/                 # Core packages
│   ├── aws-bedrock/
│   ├── design-system/          # Output of gen:nodes
│   └── my-custom-node/         # Your custom nodes go here
└── README.md
```

---

## Developer Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPER WORKFLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

1. CLONE STARTER TEMPLATE
   git clone gravity-starter my-project
   cd my-project
   cp .env.example .env

2. PULL ALL GHCR IMAGES (server, workflow, canvas, umap, node-service)
   docker compose pull

3. BUILD SAB (only source service)
   docker compose build sab

4. RUN EVERYTHING LOCALLY
   docker compose up -d
   (node-service auto-discovers packages from mounted ./packages folder)

5. DEVELOP
   - Create custom UI components in apps/design-system/
   - Run: npm run gen:nodes (generates to packages/design-system/)
   - Create custom nodes in packages/my-custom-node/
   - Restart node-service: docker compose restart node-service

6. DEPLOY TO PRODUCTION VM
   - Push to your Git repo
   - On VM: git pull && docker compose pull && docker compose build sab && docker compose up -d
```

---

## Creating Custom Nodes

### How node-service Discovers Packages

node-service **auto-discovers** all packages in the `/packages` folder at startup:

1. Scans `/packages` directory for folders with `package.json`
2. Loads any `@gravity-platform/*` package with a valid `main` or `exports`
3. Calls `plugin.setup(api)` to register nodes
4. Stores node metadata in Redis

**No hardcoded list.** Add a new package folder → restart node-service → nodes available in Canvas.

### Step 1: Create Package Structure

```
packages/
└── my-custom-node/
    ├── package.json        # name: "@gravity-platform/my-custom-node"
    ├── src/
    │   └── index.ts        # exports setup(api) function
    ├── dist/               # compiled output
    └── tsconfig.json
```

### Step 2: package.json

```json
{
  "name": "@gravity-platform/my-custom-node",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@gravity-platform/plugin-base": "workspace:*"
  }
}
```

### Step 3: Implement the Plugin

```typescript
// packages/my-custom-node/src/index.ts
import { PromiseNode, NodeInputType } from "@gravity-platform/plugin-base";

class MyCustomNode extends PromiseNode {
  static type = "MyCustomNode";
  static name = "My Custom Node";
  static description = "Does something custom";
  static category = "custom";
  static color = "#10b981";

  static inputs = [{ name: "signal", type: NodeInputType.OBJECT }];

  static outputs = [{ name: "output", type: NodeInputType.OBJECT }];

  static configSchema = {
    type: "object",
    properties: {
      myOption: { type: "string", title: "My Option" },
    },
  };

  async execute(inputs: any, config: any, context: any) {
    // Your logic here
    return { output: { result: "Hello from custom node!" } };
  }
}

export function setup(api: any) {
  api.registerNode(MyCustomNode);
}

export default { setup };
```

### Step 4: Build and Restart

```bash
npm run build -w @gravity-platform/my-custom-node
docker compose restart node-service
```

Your node is now available in Canvas!

---

## Creating Custom UI Components

UI components are created in `apps/design-system/` using Storybook, then compiled to workflow nodes.

### Step 1: Create Component

Create a new component in `apps/design-system/storybook/components/`:

```tsx
// apps/design-system/storybook/components/MyWidget/MyWidget.tsx
import React from "react";
import styles from "./MyWidget.module.css";

interface MyWidgetProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export const MyWidget: React.FC<MyWidgetProps> = ({ title, description, onAction }) => {
  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {onAction && <button onClick={onAction}>Action</button>}
    </div>
  );
};
```

### Step 2: Create Storybook Story

```tsx
// apps/design-system/storybook/components/MyWidget/MyWidget.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { MyWidget } from "./MyWidget";

const meta: Meta<typeof MyWidget> = {
  title: "Components/MyWidget",
  component: MyWidget,
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    onAction: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof MyWidget>;

export const Default: Story = {
  args: {
    title: "My Widget",
    description: "This is my custom widget",
  },
};
```

### Step 3: Generate Workflow Nodes

```bash
npm run gen:nodes
```

This generates workflow nodes in `packages/design-system/src/MyWidget/`.

### Step 4: Restart node-service

```bash
docker compose restart node-service
```

Your UI component is now available as a workflow node in Canvas!

---

## Customizing SAB (Client App)

SAB is the end-user chat interface. Customize it for your brand.

### Configuration

Edit `.env` with your OIDC settings:

```bash
VITE_AUTH_ISSUER=https://your-auth-provider.com
VITE_AUTH_CLIENT_ID=your-client-id
VITE_AUTH_AUDIENCE=your-api-audience
```

### Rebuild

```bash
docker compose build sab
docker compose up -d sab
```

---

## Deploying to Production

### On Your Production VM

```bash
# Clone your customized repo
git clone your-repo ~/gravity
cd ~/gravity

# Copy and configure .env
cp .env.example .env
# Edit .env with production values

# Pull images and build
docker compose pull
docker compose build sab

# Start
docker compose up -d
```

### Updating

```bash
cd ~/gravity
git pull
docker compose pull
docker compose build sab
docker compose up -d
```

---

## Troubleshooting

### Node not appearing in Canvas

1. Check package.json has `@gravity-platform/*` scope
2. Check package has `main` or `exports` field
3. Check `setup()` function is exported
4. Restart node-service: `docker compose restart node-service`
5. Check logs: `docker compose logs node-service`

### UI Component not generating

1. Check Storybook story has `argTypes` defined
2. Run `npm run gen:nodes` and check output
3. Restart node-service after generation

### Connection issues

1. Check all services are running: `docker compose ps`
2. Check Redis is healthy: `docker compose logs redis`
3. Verify `.env` has correct URLs

---

## Related Documentation

- [Deployment Architecture](./DEPLOYMENT_TIERS.md) - Production deployment specification
- [Distributed Architecture](./DISTRIBUTED_ARCHITECTURE.md) - Service communication details
- [Marketplace Architecture](./MARKETPLACE_ARCHITECTURE.md) - Future plugin marketplace
