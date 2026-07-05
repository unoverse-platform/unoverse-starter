# @gravityai-dev/cloudinary

Cloudinary media management plugin for the Gravity workflow system. Provides nodes for listing files and retrieving file content from Cloudinary.

## Features

- **CloudinaryFiles**: List files from Cloudinary folders with filtering options
- **CloudinaryFileContent**: Get file content with transformations and format conversion
- Full Cloudinary API integration with credential management
- Support for images, videos, and raw files
- Built-in transformations and format conversion

## Installation

```bash
npm install @gravityai-dev/cloudinary
```

## Nodes

### CloudinaryFiles

Lists files from a Cloudinary folder with various filtering options.

**Inputs:**
- `signal`: Trigger to start listing files

**Outputs:**
- `files`: Array of Cloudinary file objects
- `count`: Number of files found

**Configuration:**
- `folder`: Folder path to list files from
- `maxFiles`: Maximum number of files to return (1-500)
- `resourceType`: Type of resources (image, video, raw, auto)
- `tags`: Comma-separated list of tags to filter by
- `randomSelection`: Randomly select files if more than maxFiles exist

### CloudinaryFileContent

Gets content and metadata for a specific Cloudinary file with optional transformations.

**Inputs:**
- `file`: Cloudinary file object from CloudinaryFiles or Loop node

**Outputs:**
- `fileContent`: File content with download URL and metadata

**Configuration:**
- `file`: Cloudinary file object with publicId
- `transformation`: Cloudinary transformation string (e.g., 'w_300,h_300,c_fill')
- `format`: Output format (jpg, png, webp, etc.)

## Credentials

Requires Cloudinary credentials with the following fields:
- `cloud_name`: Your Cloudinary cloud name
- `api_key`: Your Cloudinary API key
- `api_secret`: Your Cloudinary API secret

## Usage Example

1. Add CloudinaryFiles node to list images from a folder
2. Connect to Loop node to process each file
3. Use CloudinaryFileContent to get transformed versions
4. Apply transformations like resizing, format conversion, etc.

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
