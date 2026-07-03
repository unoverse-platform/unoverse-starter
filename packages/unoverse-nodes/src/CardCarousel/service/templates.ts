/**
 * CardCarousel Template Service
 * Auto-generated from Unoverse definition
 */

import { CardCarouselTemplate } from "../util/types";

export function loadDefaultTemplate(): CardCarouselTemplate {
  return {
    componentUrl: 'unoverse://components/CardCarousel',
  };
}

export function loadTemplateByVersion(version: string): CardCarouselTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): CardCarouselTemplate {
  return loadDefaultTemplate();
}
