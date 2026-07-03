/**
 * Card2 Template Service
 * Auto-generated from Unoverse definition
 */

import { Card2Template } from "../util/types";

export function loadDefaultTemplate(): Card2Template {
  return {
    componentUrl: 'unoverse://components/Card2',
  };
}

export function loadTemplateByVersion(version: string): Card2Template {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): Card2Template {
  return loadDefaultTemplate();
}
