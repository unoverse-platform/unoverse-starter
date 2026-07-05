/**
 * FieldValidator Node Executor
 * Compares incoming data against required schema and identifies missing fields
 * 
 * Logic:
 * 1. Extract field names from requiredSchema
 * 2. Check which fields are missing in incomingData
 * 3. Return next missing field based on priority order
 * 4. Calculate completion percentage
 */

import { NodeExecutionContext, ValidationResult } from "@unoverse-platform/plugin-base";
import { PromiseNode } from "../shared/platform";
import { FieldValidatorConfig, FieldValidatorOutput } from "./utils/types";

export default class FieldValidatorExecutor extends PromiseNode<FieldValidatorConfig> {
  constructor() {
    super("FieldValidator");
  }

  protected async validateConfig(config: FieldValidatorConfig): Promise<ValidationResult> {
    // Config validation happens in the template resolver
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: FieldValidatorConfig,
    context: NodeExecutionContext
  ): Promise<FieldValidatorOutput> {
    try {
      const { requiredSchema, incomingData } = config;

      this.logger.info("FieldValidator executing", {
        nodeId: context.nodeId,
        requiredSchema,
        incomingData,
      });

      // Extract field names, required list, and properties map from schema
      const { fieldNames, requiredList, propertiesMap } = this.extractSchemaInfo(requiredSchema);
      
      // Identify missing fields (preserves order)
      const missingFields = this.findMissingFields(fieldNames, incomingData);
      
      // Get next field prioritized by required list, then schema order
      const nextField = this.getNextField(missingFields, requiredList);
      
      // Get schema definition for next field
      const nextFieldSchema = nextField ? propertiesMap[nextField] : undefined;
      
      // Calculate completion
      const completionPercentage = this.calculateCompletion(fieldNames, missingFields);
      const isComplete = missingFields.length === 0;

      this.logger.info("FieldValidator result", {
        fieldNames,
        requiredList,
        missingFields,
        nextField,
        nextFieldSchema,
        completionPercentage,
        isComplete,
      });

      return {
        __outputs: {
          nextField,
          nextFieldSchema,
          missingFields,
          isComplete,
          completionPercentage,
        },
      };
    } catch (error: any) {
      this.logger.error(`FieldValidator execution failed:`, error);
      throw new Error(`FieldValidator execution failed: ${error.message}`);
    }
  }

  /**
   * Extract field names, required list, and properties map from schema object
   * Supports multiple formats:
   * 1. Tool schema format: { inputSchema: { json: { properties: {...}, required: [...] } } }
   * 2. JSON Schema format: { properties: {...}, required: [...] }
   * 3. Direct properties: { name: {...}, email: {...} }
   */
  private extractSchemaInfo(schema: any): { 
    fieldNames: string[]; 
    requiredList: string[];
    propertiesMap: Record<string, any>;
  } {
    if (!schema || typeof schema !== "object") {
      this.logger.warn("Invalid schema provided, returning empty arrays");
      return { fieldNames: [], requiredList: [], propertiesMap: {} };
    }

    // Check if this is a tool schema format with nested inputSchema.json
    if (schema.inputSchema?.json?.properties) {
      this.logger.info("Detected tool schema format, extracting from inputSchema.json");
      const properties = schema.inputSchema.json.properties;
      return {
        fieldNames: Object.keys(properties),
        requiredList: schema.inputSchema.json.required || [],
        propertiesMap: properties,
      };
    }

    // Check if this has a direct properties field (JSON Schema format)
    if (schema.properties) {
      this.logger.info("Detected JSON Schema format, extracting from properties");
      return {
        fieldNames: Object.keys(schema.properties),
        requiredList: schema.required || [],
        propertiesMap: schema.properties,
      };
    }

    // Otherwise treat the schema object itself as the properties
    this.logger.info("Using schema object keys directly as field names");
    return {
      fieldNames: Object.keys(schema),
      requiredList: [],
      propertiesMap: schema,
    };
  }

  /**
   * Find which required fields are missing in incoming data
   */
  private findMissingFields(requiredFields: string[], incomingData: any): string[] {
    if (!incomingData || typeof incomingData !== "object") {
      // All fields are missing if no data provided
      return requiredFields;
    }

    return requiredFields.filter((field) => {
      const value = incomingData[field];
      // Field is missing if undefined, null, or empty string
      return value === undefined || value === null || value === "";
    });
  }

  /**
   * Get next field to request
   * Priority: 1) Required fields first, 2) Then schema order
   */
  private getNextField(missingFields: string[], requiredList: string[]): string | undefined {
    if (missingFields.length === 0) {
      return undefined;
    }

    // If there's a required list, prioritize required fields first
    if (requiredList && requiredList.length > 0) {
      // Find first missing field that's in the required list
      for (const field of missingFields) {
        if (requiredList.includes(field)) {
          this.logger.info("Next field from required list", { field });
          return field;
        }
      }
    }

    // Otherwise return first missing field in schema order
    this.logger.info("Next field from schema order", { field: missingFields[0] });
    return missingFields[0];
  }

  /**
   * Calculate completion percentage
   */
  private calculateCompletion(requiredFields: string[], missingFields: string[]): number {
    if (requiredFields.length === 0) {
      return 100;
    }

    const filledFields = requiredFields.length - missingFields.length;
    return Math.round((filledFields / requiredFields.length) * 100);
  }
}
