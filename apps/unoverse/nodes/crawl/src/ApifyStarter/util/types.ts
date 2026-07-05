/**
 * Type definitions for ApifyStarter node
 */

export interface ApifyStarterConfig {
  urls: any; // From template resolution
  actorId: string;
  waitForCompletion: boolean;
  maxWaitTime: number;
}

export interface ApifyStarterInput {
  urls?: string[];
}

export interface ApifyStarterOutput {
  runId: string;
  status: string;
}

export interface ApifyStarterExecutorOutput {
  __outputs: {
    runId: string;
    status: string;
  };
}
