/**
 * Card Template Service
 * Auto-generated from Unoverse definition
 */

import { CardTemplate } from "../util/types";

export function loadDefaultTemplate(): CardTemplate {
  return {
    componentUrl: 'unoverse://components/Card',
  };
}

export function loadTemplateByVersion(version: string): CardTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): CardTemplate {
  return loadDefaultTemplate();
}
