/**
 * BarList Template Service
 * Auto-generated from Unoverse definition
 */

import { BarListTemplate } from "../util/types";

export function loadDefaultTemplate(): BarListTemplate {
  return {
    componentUrl: 'unoverse://components/BarList',
  };
}

export function loadTemplateByVersion(version: string): BarListTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): BarListTemplate {
  return loadDefaultTemplate();
}
