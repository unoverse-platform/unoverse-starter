import { createLogger, getNodeCredentials } from "../../shared/platform";

/**
 * Get Apify configuration from context
 */
async function getApifyConfig(context: any) {
  const credentials = await getNodeCredentials(context, "apifyCredential");
  const apiToken = credentials?.token;
  
  if (!apiToken) {
    throw new Error("Apify API token not found in credentials");
  }

  return {
    apiToken,
    baseUrl: "https://api.apify.com/v2",
  };
}

/**
 * Parse URLs from various formats
 */
function parseUrls(urls: any): string[] {
  if (typeof urls === "string") {
    try {
      return JSON.parse(urls);
    } catch (e) {
      // If it's not JSON, treat as single URL
      return [urls];
    }
  }
  
  if (Array.isArray(urls)) {
    return urls;
  }
  
  throw new Error("URLs must be a string or array");
}

/**
 * Start an Apify actor run
 * Used by ApifyStarter node
 */
export async function startApifyActor(
  actorId: string,
  input: any,
  context: any
): Promise<string> {
  const logger = createLogger("ApifyActorService");
  const { apiToken, baseUrl } = await getApifyConfig(context);

  // Check if this is a task (contains ~) or an actor
  const isTask = actorId.includes('~');
  const endpoint = isTask 
    ? `${baseUrl}/actor-tasks/${actorId}/runs`
    : `${baseUrl}/acts/${actorId}/runs`;
  
  const entityType = isTask ? "task" : "actor";

  logger.info(`Starting Apify ${entityType}`, { actorId });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status} - ${errorText}`);
    }

    const runData = await response.json() as any;
    const runId = runData.data.id;

    logger.info(`Successfully started Apify ${entityType} run`, {
      actorId,
      runId,
      status: runData.data.status
    });

    return runId;
  } catch (error: any) {
    logger.error(`Failed to start Apify ${entityType}`, { 
      actorId,
      error: error.message 
    });
    throw new Error(`Failed to start Apify ${entityType}: ${error.message}`);
  }
}

/**
 * Start an Apify web scraper with URLs
 * Convenience method for ApifyStarter node
 */
export async function startApifyWebScraper(
  urls: any,
  scraperSettings: any,
  credentials: any
): Promise<string> {
  const logger = createLogger("ApifyActorService");
  
  // Parse URLs from various formats
  const parsedUrls = parseUrls(urls);

  // Format URLs for Apify's web scraper
  const startUrls = parsedUrls.map(url => ({ url }));

  // Prepare input
  const input = {
    startUrls,
    ...scraperSettings
  };

  logger.info("Starting Apify web scraper", {
    urlCount: parsedUrls.length,
    actorId: scraperSettings.actorId || "apify/web-scraper"
  });

  const actorId = scraperSettings.actorId || "apify/web-scraper";
  return startApifyActor(actorId, input, credentials);
}
