import { PromiseNode, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { PostgresInsertConfig, PostgresInsertOutput } from "../util/types";
import { executeInsert } from "../service/insertService";

const NODE_TYPE = "PostgresInsert";

export default class PostgresInsertExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: PostgresInsertConfig,
    context: NodeExecutionContext,
  ): Promise<PostgresInsertOutput> {
    if (!config.connectionString || config.connectionString.trim() === "") {
      throw new Error("Connection string is required");
    }

    if (!config.tableName || config.tableName.trim() === "") {
      throw new Error("Table name is required");
    }

    if (!config.records) {
      throw new Error("Records are required — provide an object or array of objects");
    }

    // Generate per-row embeddings if enabled
    let embeddings: (number[] | null)[] | undefined;
    if (config.enableVector && config.vectorTextField) {
      const recordArray = Array.isArray(config.records) ? config.records : [config.records];
      embeddings = [];
      for (let i = 0; i < recordArray.length; i++) {
        const fields = config
          .vectorTextField!.split(",")
          .map((f) => f.trim())
          .filter(Boolean);
        const parts = fields.map((f) => recordArray[i][f]).filter((v) => v && typeof v === "string");
        const text = parts.join(" ");
        if (!text.trim()) {
          this.logger.warn(`PostgresInsert: row ${i} has no text in fields "${config.vectorTextField}" — null vector`);
          embeddings.push(null);
          continue;
        }
        try {
          const embeddingResult = await (context as any).api.callService("createEmbedding", { text }, context);
          const vec = embeddingResult?.embedding || embeddingResult;
          embeddings.push(Array.isArray(vec) ? vec : null);
        } catch (err: any) {
          this.logger.error(`PostgresInsert: embedding failed for row ${i}`, { error: err.message });
          embeddings.push(null);
        }
      }
      this.logger.info("PostgresInsert: per-row embeddings generated", {
        total: recordArray.length,
        success: embeddings.filter((e) => e !== null).length,
      });
    }

    const result = await executeInsert({
      ...config,
      context,
      logger: this.logger,
      embeddings,
    });

    return {
      __outputs: {
        output: result,
      },
    } as any;
  }
}
