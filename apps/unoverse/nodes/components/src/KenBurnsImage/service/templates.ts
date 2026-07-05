/**
 * KenBurnsImage Template Service
 * Auto-generated from Unoverse definition
 */

import { KenBurnsImageTemplate } from "../util/types";

export function loadDefaultTemplate(): KenBurnsImageTemplate {
  return {
    componentUrl: 'unoverse://components/KenBurnsImage',
  };
}

export function loadTemplateByVersion(version: string): KenBurnsImageTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): KenBurnsImageTemplate {
  return loadDefaultTemplate();
}
