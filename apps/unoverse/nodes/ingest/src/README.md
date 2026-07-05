# @gravityai-dev/ingest

Data ingestion nodes for Gravity workflow system.

## Nodes

### DocumentParser
Parses documents (PDF, DOCX, TXT) and extracts text content with metadata.

### Document
Caches and manages document content during workflow execution with lazy loading.

### ApifyResults
Fetches and iterates through results from an Apify run.

### ApifyStarter
Starts an Apify actor run with a list of URLs.

### Hyperbrowser
Web scraper with link extraction capabilities.

### GoogleSheet
Reads data from public Google Sheets.

## Installation

```bash
npm install @gravityai-dev/ingest
```

## Usage

This package is automatically loaded by the Gravity workflow system when installed.

## Credentials

The package supports the following credential types:

- **Google**: For Google Sheets access

> SearchWeb and web-search credentials moved to the `@gravity-platform/search` package.

## Development

```bash
# Build the package
npm run build

# Run tests
npm test

# Lint code
npm run lint
```
