# @gravityai-dev/gce-imagegen

Google Gemini Image Generation integration for the Gravity workflow system.

## Features

- 🎨 Generate images using Google's Gemini AI models
- 🔄 Support for multiple image generation
- 📦 Base64 output format for easy integration
- 🎯 Template support for dynamic prompts
- 🔐 Secure credential management

## Installation

```bash
npm install @gravityai-dev/gce-imagegen
```

## Configuration

### Credentials

This package requires Google Gemini API credentials:

- **API Key**: Your Google Gemini API key

### Node Configuration

- **Model**: Select the Gemini model (gemini-2.5-flash-image-preview, gemini-2.0-flash-exp)
- **Image Prompt**: Describe the image you want to generate (supports template syntax)
- **Number of Images**: How many images to generate (1-10)
- **Output Format**: base64 (embedded) or url (requires storage)
- **File Name Prefix**: Optional prefix for generated image file names

## Usage

### In a Workflow

1. Add the "Gemini Image Gen" node to your workflow
2. Configure your Gemini API credentials
3. Set the model and prompt
4. Connect to downstream nodes to process the generated images

### Template Syntax

Use template syntax to reference data from previous nodes:

```
Generate an image of {{input.subject}} in {{input.style}} style
```

## Outputs

- **images**: Array of generated images with base64 data and metadata
- **text**: Optional text response from Gemini
- **metadata**: Generation metadata including model and image count

## Example

```typescript
// Node configuration
{
  model: "gemini-2.5-flash-image-preview",
  prompt: "A serene mountain landscape at sunset",
  numberOfImages: 1,
  outputFormat: "base64",
  fileName: "mountain_sunset"
}

// Output
{
  images: [
    {
      data: "base64_encoded_image_data...",
      mimeType: "image/png",
      fileName: "mountain_sunset_0.png"
    }
  ],
  metadata: {
    model: "gemini-2.5-flash-image-preview",
    imageCount: 1,
    timestamp: "2025-01-15T10:30:00Z"
  }
}
```

## License

MIT
