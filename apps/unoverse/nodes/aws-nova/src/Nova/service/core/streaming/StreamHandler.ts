/**
 * Stream handler for Nova Speech bidirectional streaming
 */

import { BedrockRuntimeClient, InvokeModelWithBidirectionalStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { getPlatformDependencies } from "@gravity-platform/plugin-base";
import { EventQueue } from "./EventQueue";
import { NovaSpeechSession } from "./SessionManager";
import { NOVA_MODEL_ID } from "../../../constants";

const { createLogger } = getPlatformDependencies();
const logger = createLogger("StreamHandler");

/**
 * Handles bidirectional streaming with AWS Bedrock Nova Speech
 */
export class StreamHandler {
  constructor(private bedrockClient: BedrockRuntimeClient) {}

  /**
   * Starts a bidirectional stream with Nova Speech
   */
  async startStream(
    session: NovaSpeechSession,
    eventQueue: EventQueue,
    outputHandler: (response: any, session: NovaSpeechSession) => Promise<void>,
  ): Promise<void> {
    try {
      // console.log("\n📤 STARTING NOVA SPEECH STREAM"); // Commented out - too verbose

      // Send request to Nova Speech
      // console.log("\n🚀 Sending InvokeModelWithBidirectionalStreamCommand..."); // Commented out - too verbose
      // console.log("Model ID:", config.modelId || "amazon.nova-sonic-v1:0"); // Commented out - too verbose

      // The SDK expects the body to be an async iterable of chunks
      // EventQueue already implements async iterator that yields { chunk: { bytes: Uint8Array } }
      logger.info("🚀 Sending InvokeModelWithBidirectionalStreamCommand...", {
        sessionId: session.sessionId,
        modelId: NOVA_MODEL_ID,
      });

      const response = await this.bedrockClient.send(
        new InvokeModelWithBidirectionalStreamCommand({
          modelId: NOVA_MODEL_ID,
          body: eventQueue,
        }),
      );

      logger.info("✅ Got response from Nova, processing output stream...", {
        sessionId: session.sessionId,
        hasBody: !!response.body,
      });

      // Process response stream using the provided handler
      await outputHandler(response, session);

      logger.info("✅ Output stream processing complete", {
        sessionId: session.sessionId,
      });

      // logger.info("Stream completed", { // Commented out - too verbose
      //   sessionId: session.sessionId,
      // });
    } catch (error: any) {
      logger.error("Stream error", {
        sessionId: session.sessionId,
        error: error.message || error,
        errorType: error.constructor?.name,
        errorCode: error.$metadata?.httpStatusCode,
      });

      // Re-throw for upstream handling
      throw error;
    }
  }
}
