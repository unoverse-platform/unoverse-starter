/**
 * MiskHubChatLayout Template Types
 */

import type { GravityTemplateProps } from "../core";

export interface MiskHubChatLayoutProps extends GravityTemplateProps {
  /** Placeholder text for input */
  placeholder?: string;
  /** Auto-scroll to bottom on new content */
  autoScroll?: boolean;
  /** Brand name displayed in welcome screen */
  brandName?: string;
  /** Brand subtitle */
  brandSubtitle?: string;
  /** Logo URL */
  logoUrl?: string;
  /** Suggestion cards for welcome screen */
  suggestions?: SuggestionCard[];
}

export interface SuggestionCard {
  icon: string;
  title: string;
  question: string;
}
