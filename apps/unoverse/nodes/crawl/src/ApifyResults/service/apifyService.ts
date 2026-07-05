import { createLogger, getNodeCredentials } from "../../shared/platform";
import { ApifyItem, ApifyRunResponse } from "../util/types";

/**
 * Apify dataset operations
 */

/**
 * Fetch results from an Apify run
 * Used by ApifyResults node
 */
export async function fetchApifyRunResults(runId: string, context: any): Promise<ApifyItem[]> {
  const logger = createLogger("ApifyService");
  const credentials = await getNodeCredentials(context, "apifyCredential");
  
  if (!credentials?.token) {
    throw new Error("Apify API token not found in credentials");
  }

  const apiToken = credentials.token;
  const baseUrl = "https://api.apify.com/v2";

  logger.info("Fetching Apify run results", { runId });

  try {
    // Get run details
    const runResponse = await fetch(`${baseUrl}/actor-runs/${runId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(`Failed to fetch run: ${runResponse.status} - ${errorText}`);
    }

    const runData = (await runResponse.json()) as ApifyRunResponse;
    const datasetId = runData.data.defaultDatasetId;

    if (!datasetId) {
      throw new Error("No dataset found for this run");
    }

    logger.info("Fetching dataset items", {
      runId,
      datasetId,
      runStatus: runData.data.status,
    });

    // Fetch all items with pagination
    const limit = 1000;
    let offset = 0;
    let allItems: ApifyItem[] = [];
    let hasMore = true;

    while (hasMore) {
      const datasetResponse = await fetch(`${baseUrl}/datasets/${datasetId}/items?limit=${limit}&offset=${offset}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!datasetResponse.ok) {
        const errorText = await datasetResponse.text();
        throw new Error(`Failed to fetch dataset: ${datasetResponse.status} - ${errorText}`);
      }

      const items = (await datasetResponse.json()) as ApifyItem[];
      allItems = allItems.concat(items);

      // Check if there are more items
      hasMore = items.length === limit;
      offset += limit;

      logger.debug("Fetched batch of items", {
        batchSize: items.length,
        totalSoFar: allItems.length,
      });
    }

    logger.info("Successfully fetched all Apify results", {
      runId,
      totalItems: allItems.length,
    });

    return allItems;
  } catch (error: any) {
    logger.error("Failed to fetch Apify results", {
      runId,
      error: error.message,
    });
    throw new Error(`Failed to fetch Apify results: ${error.message}`);
  }
}
