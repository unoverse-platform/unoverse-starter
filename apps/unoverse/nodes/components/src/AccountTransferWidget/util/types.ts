/**
 * AccountTransferWidget Types
 * Auto-generated from Unoverse definition
 */

export interface AccountTransferWidgetConfig {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  transferData?: object;
  availableAccounts?: any[];
  beneficiaries?: any[];
  heroImage?: string;
}

export interface AccountTransferWidgetOutput {
  __outputs: {
    componentSpec: any;
  };
}

export interface AccountTransferWidgetTemplate {
  componentUrl: string;
}
