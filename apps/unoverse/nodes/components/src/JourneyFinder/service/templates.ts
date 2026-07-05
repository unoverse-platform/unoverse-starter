/**
 * JourneyFinder Template Service
 * Auto-generated from Unoverse definition
 */

import { JourneyFinderTemplate } from "../util/types";

export function loadDefaultTemplate(): JourneyFinderTemplate {
  return {
    componentUrl: 'unoverse://components/JourneyFinder',
  };
}

export function loadTemplateByVersion(version: string): JourneyFinderTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): JourneyFinderTemplate {
  return loadDefaultTemplate();
}
