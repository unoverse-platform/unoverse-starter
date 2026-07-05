/**
 * Cloudinary Credentials Definition
 */

export const CloudinaryCredential = {
  name: "cloudinaryCredential",
  displayName: "Cloudinary",
  description: "Cloudinary API credentials for media management",
  properties: [
    {
      name: "cloud_name",
      displayName: "Cloud Name",
      type: "string" as const,
      required: true,
      description: "Your Cloudinary cloud name",
      placeholder: "Enter your Cloudinary cloud name"
    },
    {
      name: "api_key",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      description: "Your Cloudinary API key",
      placeholder: "Enter your Cloudinary API key"
    },
    {
      name: "api_secret",
      displayName: "API Secret",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Cloudinary API secret",
      placeholder: "Enter your Cloudinary API secret"
    }
  ],
};
