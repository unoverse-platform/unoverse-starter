/**
 * StatCard Template Service
 * Auto-generated from Unoverse definition
 */

import { StatCardTemplate } from "../util/types";

export function loadDefaultTemplate(): StatCardTemplate {
  return {
    componentUrl: 'unoverse://components/StatCard',
  };
}

export function loadTemplateByVersion(version: string): StatCardTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): StatCardTemplate {
  return loadDefaultTemplate();
}
