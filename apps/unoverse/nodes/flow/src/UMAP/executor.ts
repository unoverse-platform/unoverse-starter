/**
 * UMAP Node Executor
 * Performs UMAP dimensionality reduction on high-dimensional vectors
 * Returns 3D UMAP coordinates (clustering should be done separately on full dataset)
 */

import { NodeExecutionContext, ValidationResult } from "@gravity-platform/plugin-base";
import { PromiseNode } from "../shared/platform";
import { UMAP } from "umap-js";

interface UMAPConfig {
  vector?: any;
  nComponents?: number;
  nNeighbors?: number;
  minDist?: number;
}

interface UMAPOutput {
  coordinates: number[]; // [x, y, z]
  clusterId: string | null;  // null until batch clustering is done
  color: string;  // default color until clustering
}

class UMAPExecutor extends PromiseNode {
  constructor() {
    super("UMAP");
  }

  protected async validateConfig(config: UMAPConfig): Promise<ValidationResult> {
    if (config.nComponents && (config.nComponents < 1 || config.nComponents > 3)) {
      return {
        success: false,
        error: "nComponents must be between 1 and 3",
      };
    }
    if (config.nNeighbors && config.nNeighbors < 2) {
      return {
        success: false,
        error: "nNeighbors must be at least 2",
      };
    }
    if (config.minDist && (config.minDist < 0 || config.minDist > 1)) {
      return {
        success: false,
        error: "minDist must be between 0 and 1",
      };
    }
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: UMAPConfig,
    context: NodeExecutionContext
  ): Promise<any> {
    try {
      // Get the embedding from config.vector (already resolved by template system)
      const embedding = config.vector;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error("Config 'vector' must be an array of numbers");
      }

      if (embedding.length === 0) {
        throw new Error("Embedding array cannot be empty");
      }

      // Validate all elements are numbers
      if (!embedding.every((val) => typeof val === "number" && !isNaN(val))) {
        throw new Error("All embedding values must be valid numbers");
      }

      this.logger?.info(`Processing embedding of dimension ${embedding.length}`);

      // Configure UMAP
      const nComponents = config.nComponents || 3;
      const nNeighbors = config.nNeighbors || 15;
      const minDist = config.minDist || 0.1;

      // UMAP needs at least 2 points to work
      // For a single embedding, we'll duplicate it with minimal variation
      const dataPoints = [
        embedding,
        embedding.map((val: number) => val + 0.0001) // Tiny variation to make UMAP work
      ];

      // Create and fit UMAP
      const umap = new UMAP({
        nComponents,
        nNeighbors: Math.min(nNeighbors, dataPoints.length - 1),
        minDist,
      });

      const umapCoords = await umap.fit(dataPoints);

      // Get the coordinates for the original embedding (first one)
      const coords = umapCoords[0];
      const coordinates = [
        coords[0] || 0,  // x
        coords[1] || 0,  // y
        nComponents >= 3 ? coords[2] || 0 : 0,  // z
      ];

      // Build output - clustering will be done separately on full dataset
      const output: UMAPOutput = {
        coordinates,
        clusterId: null,  // Will be assigned during batch clustering
        color: "#999999"  // Default gray until clustering
      };

      this.logger?.info("UMAP reduction complete", {
        inputDimension: embedding.length,
        outputDimension: nComponents,
        coordinates: {
          x: coordinates[0],
          y: coordinates[1],
          z: coordinates[2],
        }
      });

      // Return the result to the output connector
      return {
        __outputs: {
          result: output,
        },
      };
    } catch (error: any) {
      this.logger?.error("UMAP reduction failed:", error);
      throw new Error(`UMAP reduction failed: ${error.message}`);
    }
  }
}

export default UMAPExecutor;
