/**
 * Cloudinary Upload Node Definition
 * Upload images (base64 or URL) to Cloudinary
 */

import { getPlatformDependencies, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import { CloudinaryUploadExecutor } from "./executor";

export const NODE_TYPE = "CloudinaryUpload";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.1.0",
    type: NODE_TYPE,
    name: "Cloudinary Upload",
    description: "Upload images to Cloudinary from base64 data or URL",
    whenToUse:
      "Pick for image/video media that needs CDN URLs and transformations — store an image/video and get back a CDN URL plus resize/crop/format options. It targets a media CDN specifically, not generic object storage and not structured-record storage.",
    category: "Media & Design",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1754502687/gravity/icons/cloudinary_logo.png",
    color: "#3448C5", // Cloudinary Blue
    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Data from previous nodes (e.g., generated images)",
      },
    ],
    outputs: [
      {
        name: "url",
        type: NodeInputType.STRING,
        description: "HTTP URL of uploaded image",
      },
      {
        name: "secureUrl",
        type: NodeInputType.STRING,
        description: "HTTPS URL of uploaded image",
      },
      {
        name: "publicId",
        type: NodeInputType.STRING,
        description: "Cloudinary public ID",
      },
      {
        name: "format",
        type: NodeInputType.STRING,
        description: "Image format (png, jpg, etc.)",
      },
      {
        name: "metadata",
        type: NodeInputType.OBJECT,
        description: "Upload metadata (dimensions, size, etc.)",
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        imageData: {
          type: "string",
          title: "Image Data",
          description: "Base64 image data or URL. Supports template syntax like {{signal.geminiimagegen1.images.[0].data}}",
          default: "",
          "ui:field": "template",
        },
        folder: {
          type: "string",
          title: "Folder Path",
          description: "Cloudinary folder to upload to (optional)",
          default: "",
        },
        publicId: {
          type: "string",
          title: "Public ID",
          description: "Custom public ID for the image (optional, auto-generated if empty)",
          default: "",
          "ui:field": "template",
        },
        tags: {
          type: "string",
          title: "Tags",
          description: "Comma-separated tags for the image",
          default: "",
        },
        resourceType: {
          type: "string",
          title: "Resource Type",
          description: "Type of resource to upload",
          default: "image",
          enum: ["image", "video", "raw", "auto"],
          enumNames: ["Image", "Video", "Raw File", "Auto-detect"],
        },
        overwrite: {
          type: "boolean",
          title: "Overwrite Existing",
          description: "Overwrite if file with same public ID exists",
          default: false,
          "ui:widget": "toggle",
        },
      },
      required: ["imageData"],
    },
    credentials: [
      {
        name: "cloudinaryCredential",
        required: true,
        displayName: "Cloudinary",
        description: "Cloudinary credentials for upload access",
      },
    ],
    testData: {
      config: {
        imageData: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        folder: "gravity/uploads",
        publicId: "demo-upload-001",
        tags: "demo,featured",
        resourceType: "image",
        overwrite: false,
      },
      inputs: {
        signal: { url: "https://res.cloudinary.com/demo/image/upload/sample.jpg" },
      },
    },
  };
}

const definition = createNodeDefinition();

export const CloudinaryUploadNode = {
  definition,
  executor: CloudinaryUploadExecutor,
};

export { createNodeDefinition };
