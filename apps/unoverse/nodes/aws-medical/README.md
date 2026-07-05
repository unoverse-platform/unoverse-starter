# @gravityai-dev/aws-medical

AWS Comprehend Medical integration plugin for the Gravity workflow system. Extract medical entities and PHI from clinical text using AWS Comprehend Medical.

## Features

- **AWSComprehendMedical**: Extract medical entities, PHI, and insights from clinical text
- Support for both medical entities and PHI detection
- Multiple output formats: raw JSON, simplified structure, or both
- Optional S3 storage for analysis results
- Full AWS SDK v3 integration with client caching
- Comprehensive error handling and logging

## Installation

```bash
npm install @gravityai-dev/aws-medical
```

## Nodes

### AWSComprehendMedical

Analyzes clinical text using AWS Comprehend Medical to extract medical entities, PHI, and insights.

**Inputs:**
- `text`: Clinical text to analyze

**Outputs:**
- `result`: Comprehend Medical analysis results (format based on settings)
- `outputKey`: S3 key where results were saved (if saveToS3 is enabled)

**Configuration:**
- `text`: The clinical text to analyze
- `analysisType`: Type of analysis (Medical Entities Only, PHI Only, Both Entities and PHI)
- `outputFormat`: Format of output data (Raw JSON, Simplified Structure, Both)
- `saveToS3`: Save the analysis results to S3
- `outputPrefix`: Prefix for S3 output files
- `language`: Language of the clinical text (English)

## Credentials

Requires AWS credentials with the following fields:
- `accessKeyId`: Your AWS access key ID
- `secretAccessKey`: Your AWS secret access key
- `region`: AWS region (e.g., us-east-1)

## Usage Example

1. Add AWSComprehendMedical node to analyze clinical text
2. Configure analysis type (entities, PHI, or both)
3. Choose output format (raw JSON or simplified structure)
4. Optionally save results to S3 for archival
5. Process extracted medical information in downstream nodes

## Medical Entity Types

The node can extract various medical entities including:
- **Medications**: Dosage, frequency, strength, route, duration, form
- **Medical Conditions**: Diagnoses, symptoms, medical history
- **Test Results**: Lab values, test names, units, reference ranges
- **Procedures**: Medical procedures, treatments, surgeries
- **Anatomy**: Body parts, anatomical locations

## PHI Detection

Detects and categorizes Protected Health Information (PHI):
- **Names**: Patient names, healthcare provider names
- **Dates**: Birth dates, appointment dates, treatment dates
- **Locations**: Addresses, cities, states, countries
- **Identifiers**: SSN, account numbers, device identifiers
- **Contact**: Phone numbers, email addresses, URLs

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
