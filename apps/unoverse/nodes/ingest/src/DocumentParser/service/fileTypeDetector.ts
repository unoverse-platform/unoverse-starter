import * as path from 'path';

export enum FileType {
  PDF = 'pdf',
  DOCX = 'docx',
  TXT = 'txt',
  UNKNOWN = 'unknown',
}

/**
 * Detect file type from file key/path
 * @param fileKey File key or path
 * @returns Detected file type
 */
export function detectFileType(fileKey: string): FileType {
  const ext = path.extname(fileKey).toLowerCase().slice(1);
  
  switch (ext) {
    case 'pdf':
      return FileType.PDF;
    case 'docx':
    case 'doc':
      return FileType.DOCX;
    case 'txt':
    case 'text':
      return FileType.TXT;
    default:
      return FileType.UNKNOWN;
  }
}

/**
 * Validate if file type is supported
 * @param fileType File type to validate
 * @returns True if supported
 */
export function isSupportedFileType(fileType: FileType): boolean {
  return fileType !== FileType.UNKNOWN;
}
