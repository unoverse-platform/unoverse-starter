/**
 * CardFinder Template Service
 * Auto-generated from Unoverse definition
 */

import { CardFinderTemplate } from "../util/types";

export function loadDefaultTemplate(): CardFinderTemplate {
  return {
    componentUrl: 'unoverse://components/CardFinder',
  };
}

export function loadTemplateByVersion(version: string): CardFinderTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): CardFinderTemplate {
  return loadDefaultTemplate();
}
