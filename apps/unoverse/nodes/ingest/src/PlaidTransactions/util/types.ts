/**
 * Type definitions for PlaidTransactions node
 */

export interface PlaidTransactionsConfig {
  /** Test username for Plaid Sandbox */
  testUsername: string;
  /** Test password for Plaid Sandbox */
  testPassword: string;
  /** Institution ID (default: First Platypus Bank - ins_109508) */
  institutionId: string;
  /** Number of days of transactions to fetch */
  daysBack: number;
  /** Maximum number of transactions to return */
  maxTransactions: number;
  /** Enable Redis caching of transactions (default: true) */
  useCache?: boolean;
  /** Cache TTL in minutes (default: 60) */
  cacheTTLMinutes?: number;
}

export interface PlaidTransactionsInput {
  signal?: any;
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  iso_currency_code: string | null;
  unofficial_currency_code: string | null;
  category: string[] | null;
  category_id: string | null;
  date: string;
  datetime: string | null;
  authorized_date: string | null;
  authorized_datetime: string | null;
  location: {
    address: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
    country: string | null;
    lat: number | null;
    lon: number | null;
    store_number: string | null;
  };
  name: string;
  merchant_name: string | null;
  payment_channel: string;
  pending: boolean;
  pending_transaction_id: string | null;
  account_owner: string | null;
  transaction_type: string;
  logo_url: string | null;
  website: string | null;
  personal_finance_category: {
    primary: string;
    detailed: string;
    confidence_level: string;
  } | null;
}

export interface PlaidAccount {
  account_id: string;
  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string | null;
    limit: number | null;
    unofficial_currency_code: string | null;
  };
  mask: string | null;
  name: string;
  official_name: string | null;
  subtype: string | null;
  type: string;
}

export interface PlaidTransactionsOutput {
  __outputs: {
    transactions: PlaidTransaction[];
    accounts: PlaidAccount[];
    totalTransactions: number;
    startDate: string;
    endDate: string;
    error?: string;
  };
}

export interface PlaidCredentials {
  clientId: string;
  secret: string;
  environment?: "sandbox" | "development" | "production";
}
