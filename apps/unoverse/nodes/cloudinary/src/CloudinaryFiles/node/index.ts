import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { CloudinaryFilesExecutor } from "./executor";

export const NODE_TYPE = "CloudinaryFiles";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.1.0",
    type: NODE_TYPE,
    name: "Cloudinary Files",
    description: "List files from a Cloudinary folder",
    whenToUse:
      "Pick to enumerate CLOUDINARY media (returns file objects, not content); feed results into a Loop to fetch each asset's URL/content downstream. Lists Cloudinary media specifically.",
    category: "Media & Design",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1754502687/gravity/icons/cloudinary_logo.png",
    color: "#3448C5", // Cloudinary Blue
    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Trigger to start listing files",
      },
    ],
    outputs: [
      {
        name: "files",
        type: NodeInputType.ARRAY,
        description: "Array of Cloudinary file objects",
      },
      {
        name: "count",
        type: NodeInputType.NUMBER,
        description: "Number of files found",
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        folder: {
          type: "string",
          title: "Folder Path",
          description: "Folder path to list files from (leave empty for root)",
          default: "",
          "ui:placeholder": "e.g., products/images",
        },
        maxFiles: {
          type: "number",
          title: "Max Files",
          description: "Maximum number of files to return (1-500)",
          default: 100,
          minimum: 1,
          maximum: 500,
        },
        resourceType: {
          type: "string",
          title: "Resource Type",
          description: "Type of resources to list",
          default: "image",
          enum: ["image", "video", "raw", "auto"],
          enumNames: ["Images", "Videos", "Raw Files", "All Types"],
        },
        tags: {
          type: "string",
          title: "Tags",
          description: "Comma-separated list of tags to filter by",
          default: "",
          "ui:placeholder": "e.g., product,featured",
        },
        randomSelection: {
          type: "boolean",
          title: "Random Selection",
          description: "Randomly select files if more than maxFiles exist",
          default: false,
          "ui:widget": "toggle",
        },
      },
    },
    credentials: [
      {
        name: "cloudinaryCredential",
        required: true,
        displayName: "Cloudinary",
        description: "Cloudinary credentials for media access",
      },
    ],
    testData: {
      config: {
        folder: "samples/landscapes",
        maxFiles: 25,
        resourceType: "image",
        tags: "featured",
        randomSelection: false,
      },
      inputs: { signal: {} },
    },
  };
}

const definition = createNodeDefinition();

export const CloudinaryFilesNode = {
  definition,
  executor: CloudinaryFilesExecutor,
};

export { createNodeDefinition };
