import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { PlaidTransactionsExecutor } from "./executor";

export const NODE_TYPE = "PlaidTransactions";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.1.1",
    type: NODE_TYPE,
    category: "Storage & Data",
    name: "Plaid Transactions",
    description: "Fetch bank transactions from Plaid Sandbox for testing.",
    whenToUse:
      "Pick ONLY when a workflow needs realistic test bank transactions — it hits Plaid Sandbox with test personas, never live accounts. It is a sandbox/test data source, not a general store of real records.",
    color: "#00D09C",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1765729171/gravity/icons/plaid_logo.png",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.ANY,
        description: "Trigger signal to start fetching transactions",
      },
    ],

    outputs: [
      {
        name: "transactions",
        type: NodeInputType.ARRAY,
        description: "Array of transaction objects",
      },
      {
        name: "accounts",
        type: NodeInputType.ARRAY,
        description: "Array of account objects",
      },
      {
        name: "totalTransactions",
        type: NodeInputType.NUMBER,
        description: "Total number of transactions available",
      },
      {
        name: "startDate",
        type: NodeInputType.STRING,
        description: "Start date of the transaction range (YYYY-MM-DD)",
      },
      {
        name: "endDate",
        type: NodeInputType.STRING,
        description: "End date of the transaction range (YYYY-MM-DD)",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        testUsername: {
          type: "string",
          title: "Test Username",
          description:
            "Plaid Sandbox test username. Options: user_transactions_dynamic (realistic), user_good (basic), user_ewa_user, user_yuppie, user_small_business (personas)",
          default: "user_transactions_dynamic",
          enum: ["user_transactions_dynamic", "user_good", "user_ewa_user", "user_yuppie", "user_small_business"],
        },
        testPassword: {
          type: "string",
          title: "Test Password",
          description: "Plaid Sandbox test password (any value works for most test users)",
          default: "pass_good",
        },
        institutionId: {
          type: "string",
          title: "Institution ID",
          description:
            "Plaid institution ID. Default: First Platypus Bank (ins_109508) - recommended for sandbox testing",
          default: "ins_109508",
        },
        daysBack: {
          type: "number",
          title: "Days Back",
          description: "Number of days of transaction history to fetch",
          default: 30,
          minimum: 1,
          maximum: 730,
        },
        maxTransactions: {
          type: "number",
          title: "Max Transactions",
          description: "Maximum number of transactions to return",
          default: 100,
          minimum: 1,
          maximum: 500,
        },
        useCache: {
          type: "boolean",
          title: "Enable Cache",
          description: "Cache transactions in Redis to avoid repeated Plaid API calls. Cached per workflow.",
          default: true,
        },
        cacheTTLMinutes: {
          type: "number",
          title: "Cache TTL (minutes)",
          description: "How long to cache transactions before fetching fresh data",
          default: 60,
          minimum: 1,
          maximum: 1440,
        },
      },
      required: [],
    },

    credentials: [
      {
        name: "plaidCredential",
        required: true,
      },
    ],

    testData: {
      config: {
        testUsername: "user_transactions_dynamic",
        testPassword: "pass_good",
        institutionId: "ins_109508",
        daysBack: 30,
        maxTransactions: 100,
        useCache: true,
        cacheTTLMinutes: 60,
      },
      inputs: { signal: {} },
    },
  };
}

const definition = createNodeDefinition();

export const PlaidTransactionsNode = {
  definition,
  executor: PlaidTransactionsExecutor,
};

export { createNodeDefinition };
