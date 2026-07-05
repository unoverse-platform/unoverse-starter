/**
 * FieldValidator Types
 * Validates incoming data against a required schema
 */

export interface FieldValidatorConfig {
  /** Required schema - object defining required fields (order matters) */
  requiredSchema: any;
  /** Incoming data object to validate */
  incomingData: any;
}

export interface FieldValidatorOutput {
  __outputs: {
    /** Next missing field name */
    nextField?: string;
    /** Next missing field schema definition */
    nextFieldSchema?: any;
    /** All missing fields */
    missingFields: string[];
    /** Is validation complete (all fields present) */
    isComplete: boolean;
    /** Current data coverage percentage */
    completionPercentage: number;
  };
}
