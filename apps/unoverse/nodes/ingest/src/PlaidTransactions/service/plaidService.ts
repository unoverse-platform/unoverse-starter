import { createLogger, getNodeCredentials } from "../../shared/platform";
import { PlaidTransactionsConfig, PlaidTransaction, PlaidAccount, PlaidCredentials } from "../util/types";

const PLAID_URLS: Record<string, string> = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
};

function getPlaidBaseUrl(environment: string = "sandbox"): string {
  return PLAID_URLS[environment] || PLAID_URLS.sandbox;
}

/**
 * Plaid Sandbox Test Credentials Reference:
 *
 * Basic: user_good / pass_good
 * Transactions (dynamic): user_transactions_dynamic / any password
 * Persona-based: user_ewa_user, user_yuppie, user_small_business / any password
 *
 * Default institution: First Platypus Bank (ins_109508)
 */

interface PlaidLinkTokenResponse {
  link_token: string;
  expiration: string;
  request_id: string;
}

interface PlaidPublicTokenResponse {
  public_token: string;
  request_id: string;
}

interface PlaidAccessTokenResponse {
  access_token: string;
  item_id: string;
  request_id: string;
}

interface PlaidTransactionsResponse {
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  total_transactions: number;
  request_id: string;
}

/**
 * Create a sandbox public token for testing
 */
async function createSandboxPublicToken(
  credentials: PlaidCredentials,
  institutionId: string,
  testUsername: string,
  testPassword: string,
  baseUrl: string,
  logger: ReturnType<typeof createLogger>
): Promise<string> {
  logger.info("Creating sandbox public token", { institutionId, testUsername });

  const response = await fetch(`${baseUrl}/sandbox/public_token/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: credentials.clientId,
      secret: credentials.secret,
      institution_id: institutionId,
      initial_products: ["transactions"],
      options: {
        override_username: testUsername,
        override_password: testPassword,
      },
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as any;
    throw new Error(`Failed to create sandbox public token: ${errorData.error_message || response.statusText}`);
  }

  const data = (await response.json()) as PlaidPublicTokenResponse;
  logger.info("Sandbox public token created", { requestId: data.request_id });
  return data.public_token;
}

/**
 * Exchange public token for access token
 */
async function exchangePublicToken(
  credentials: PlaidCredentials,
  publicToken: string,
  baseUrl: string,
  logger: ReturnType<typeof createLogger>
): Promise<string> {
  logger.info("Exchanging public token for access token");

  const response = await fetch(`${baseUrl}/item/public_token/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: credentials.clientId,
      secret: credentials.secret,
      public_token: publicToken,
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as any;
    throw new Error(`Failed to exchange public token: ${errorData.error_message || response.statusText}`);
  }

  const data = (await response.json()) as PlaidAccessTokenResponse;
  logger.info("Access token obtained", { itemId: data.item_id, requestId: data.request_id });
  return data.access_token;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch transactions from Plaid with retry logic for PRODUCT_NOT_READY
 */
async function fetchTransactions(
  credentials: PlaidCredentials,
  accessToken: string,
  startDate: string,
  endDate: string,
  maxTransactions: number,
  baseUrl: string,
  logger: ReturnType<typeof createLogger>
): Promise<PlaidTransactionsResponse> {
  const maxRetries = 5;
  const retryDelayMs = 2000; // 2 seconds between retries

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    logger.info("Fetching transactions", { startDate, endDate, maxTransactions, attempt, maxRetries });

    const response = await fetch(`${baseUrl}/transactions/get`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: credentials.clientId,
        secret: credentials.secret,
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          count: maxTransactions,
          offset: 0,
        },
      }),
    });

    const data = (await response.json()) as any;

    // Check for PRODUCT_NOT_READY error - retry after delay
    if (data.error_code === "PRODUCT_NOT_READY") {
      if (attempt < maxRetries) {
        logger.info(`Product not ready, retrying in ${retryDelayMs}ms...`, { attempt, maxRetries });
        await sleep(retryDelayMs);
        continue;
      }
      throw new Error(`Transactions not ready after ${maxRetries} attempts. Try again in a few seconds.`);
    }

    if (!response.ok || data.error_code) {
      throw new Error(`Failed to fetch transactions: ${data.error_message || response.statusText}`);
    }

    logger.info("Transactions fetched", {
      count: data.transactions.length,
      total: data.total_transactions,
      requestId: data.request_id,
    });
    return data as PlaidTransactionsResponse;
  }

  throw new Error("Failed to fetch transactions after max retries");
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Main service function to fetch Plaid sandbox transactions
 */
export async function getPlaidTransactions(
  config: PlaidTransactionsConfig,
  context: any
): Promise<{
  transactions: PlaidTransaction[];
  accounts: PlaidAccount[];
  totalTransactions: number;
  startDate: string;
  endDate: string;
}> {
  const logger = createLogger("PlaidTransactionsService");

  // Get Plaid credentials
  const credentials = (await getNodeCredentials(context, "plaidCredential")) as PlaidCredentials;

  if (!credentials?.clientId || !credentials?.secret) {
    throw new Error("Plaid credentials (clientId and secret) not found");
  }

  const {
    testUsername = "user_transactions_dynamic",
    testPassword = "pass_good",
    institutionId = "ins_109508",
    daysBack = 30,
    maxTransactions = 100,
  } = config;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);

  // Get base URL from credentials environment (default: sandbox)
  const environment = (credentials as any).environment || "sandbox";
  const baseUrl = getPlaidBaseUrl(environment);

  logger.info("Starting Plaid transaction fetch", {
    testUsername,
    institutionId,
    daysBack,
    maxTransactions,
    startDate: startDateStr,
    endDate: endDateStr,
    environment,
    baseUrl,
  });

  try {
    // Step 1: Create sandbox public token
    const publicToken = await createSandboxPublicToken(
      credentials,
      institutionId,
      testUsername,
      testPassword,
      baseUrl,
      logger
    );

    // Step 2: Exchange for access token
    const accessToken = await exchangePublicToken(credentials, publicToken, baseUrl, logger);

    // Step 3: Fetch transactions
    const transactionsData = await fetchTransactions(
      credentials,
      accessToken,
      startDateStr,
      endDateStr,
      maxTransactions,
      baseUrl,
      logger
    );

    logger.info("Plaid transaction fetch complete", {
      transactionCount: transactionsData.transactions.length,
      accountCount: transactionsData.accounts.length,
    });

    return {
      transactions: transactionsData.transactions,
      accounts: transactionsData.accounts,
      totalTransactions: transactionsData.total_transactions,
      startDate: startDateStr,
      endDate: endDateStr,
    };
  } catch (error: any) {
    logger.error("Plaid transaction fetch failed", { error: error.message });
    throw new Error(`Plaid transaction fetch failed: ${error.message}`);
  }
}
