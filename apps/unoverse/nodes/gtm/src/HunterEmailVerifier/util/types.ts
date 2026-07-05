/**
 * Type definitions for the HunterEmailVerifier node
 */

export interface HunterEmailVerifierConfig {
  email: string;
}

export interface HunterEmailVerifierOutput {
  email: string;
  status: string; // valid | invalid | accept_all | webmail | disposable | unknown
  result: string; // deliverable | undeliverable | risky
  score: number;
  regexp?: boolean;
  gibberish?: boolean;
  disposable?: boolean;
  webmail?: boolean;
  mx_records?: boolean;
  smtp_server?: boolean;
  smtp_check?: boolean;
  accept_all?: boolean;
  block?: boolean;
}

export interface HunterEmailVerifierExecutorOutput {
  __outputs: HunterEmailVerifierOutput;
}
