/**
 * AIResponse Template Service
 * Auto-generated from Unoverse definition
 */

import { AIResponseTemplate } from "../util/types";

export function loadDefaultTemplate(): AIResponseTemplate {
  return {
    componentUrl: 'unoverse://components/AIResponse',
  };
}

export function loadTemplateByVersion(version: string): AIResponseTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): AIResponseTemplate {
  return loadDefaultTemplate();
}
