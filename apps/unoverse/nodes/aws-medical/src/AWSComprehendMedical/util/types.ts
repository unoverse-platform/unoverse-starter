/**
 * Type definitions for AWSComprehendMedical node
 */

export interface AWSComprehendMedicalConfig {
  text: string;
  analysisType: 'ENTITIES' | 'PHI' | 'BOTH';
  outputFormat: 'json' | 'simplified' | 'both';
  saveToS3?: boolean;
  outputPrefix?: string;
  language?: "en";
}

export interface ComprehendMedicalEntity {
  id?: number;
  text?: string;
  category?: string;
  type?: string;
  score?: number;
  beginOffset?: number;
  endOffset?: number;
  attributes?: Array<{
    type?: string;
    score?: number;
    relationshipScore?: number;
    id?: number;
    beginOffset?: number;
    endOffset?: number;
    text?: string;
  }>;
  traits?: Array<{
    name?: string;
    score?: number;
  }>;
}

export interface ComprehendMedicalPHI {
  id?: number;
  text?: string;
  category?: string;
  type?: string;
  score?: number;
  beginOffset?: number;
  endOffset?: number;
}

export interface ComprehendMedicalResult {
  entities?: ComprehendMedicalEntity[];
  phi?: ComprehendMedicalPHI[];
  modelVersion?: string;
  simplifiedEntities?: {
    medications?: Array<{
      name: string;
      confidence: number;
      type?: string;
      category?: string;
      beginOffset?: number;
      endOffset?: number;
      dosage?: string;
      frequency?: string;
      strength?: string;
      route?: string;
      duration?: string;
      form?: string;
      rate?: string;
      traits?: Array<{
        name: string;
        score?: number;
      }>;
    }>;
    conditions?: Array<{
      name: string;
      confidence: number;
      type?: string;
      category?: string;
      beginOffset?: number;
      endOffset?: number;
      attributes?: Array<{
        type: string;
        text: string;
        score?: number;
      }>;
      traits?: Array<{
        name: string;
        score?: number;
      }>;
    }>;
    testResults?: Array<{
      name: string;
      confidence: number;
      type?: string;
      category?: string;
      beginOffset?: number;
      endOffset?: number;
      value?: string;
      valueScore?: number;
      unit?: string;
      unitScore?: number;
      otherAttributes?: Array<{
        type: string;
        text: string;
        score?: number;
      }>;
      traits?: Array<{
        name: string;
        score?: number;
      }>;
    }>;
    procedures?: Array<{
      name: string;
      confidence: number;
      type?: string;
      category?: string;
      beginOffset?: number;
      endOffset?: number;
      attributes?: Array<{
        type: string;
        text: string;
        score?: number;
      }>;
      traits?: Array<{
        name: string;
        score?: number;
      }>;
    }>;
    anatomy?: Array<{
      name: string;
      confidence: number;
      type?: string;
      category?: string;
      beginOffset?: number;
      endOffset?: number;
      attributes?: Array<{
        type: string;
        text: string;
        score?: number;
      }>;
      traits?: Array<{
        name: string;
        score?: number;
      }>;
    }>;
  };
  simplifiedPHI?: {
    names?: Array<{
      text: string;
      type: string;
      confidence: number;
      beginOffset?: number;
      endOffset?: number;
      category?: string;
      attributes?: Array<{
        type: string;
        text: string;
        score?: number;
        beginOffset?: number;
        endOffset?: number;
      }>;
      traits?: Array<{
        name: string;
        score?: number;
      }>;
    }>;
    dates?: Array<{
      text: string;
      type: string;
      confidence: number;
      beginOffset?: number;
      endOffset?: number;
      category?: string;
      isDate?: boolean;
      isAge?: boolean;
      attributes?: Array<{
        type: string;
        text: string;
        score?: number;
        beginOffset?: number;
        endOffset?: number;
      }>;
      traits?: Array<{
        name: string;
        score?: number;
      }>;
    }>;
    locations?: Array<{
      text: string;
      type: string;
      confidence: number;
      beginOffset?: number;
      endOffset?: number;
      category?: string;
      attributes?: Array<{
        type: string;
        text: string;
        score?: number;
        beginOffset?: number;
        endOffset?: number;
      }>;
      traits?: Array<{
        name: string;
        score?: number;
      }>;
    }>;
    identifiers?: Array<{
      text: string;
      type: string;
      confidence: number;
      beginOffset?: number;
      endOffset?: number;
      category?: string;
      isProfession?: boolean;
      unknownType?: boolean;
      attributes?: Array<{
        type: string;
        text: string;
        score?: number;
        beginOffset?: number;
        endOffset?: number;
      }>;
      traits?: Array<{
        name: string;
        score?: number;
      }>;
    }>;
    contact?: Array<{
      text: string;
      type: string;
      confidence: number;
      beginOffset?: number;
      endOffset?: number;
      category?: string;
      contactType?: string;
      attributes?: Array<{
        type: string;
        text: string;
        score?: number;
        beginOffset?: number;
        endOffset?: number;
      }>;
      traits?: Array<{
        name: string;
        score?: number;
      }>;
    }>;
  };
  metadata: {
    entityCount?: number;
    phiCount?: number;
    textLength: number;
    processingTime?: number;
  };
  outputKey?: string;
}

export interface AWSComprehendMedicalOutput {
  __outputs: {
    result: ComprehendMedicalResult;
    outputKey?: string;
  };
}
