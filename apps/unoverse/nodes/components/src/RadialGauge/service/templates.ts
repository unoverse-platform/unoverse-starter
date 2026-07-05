/**
 * RadialGauge Template Service
 * Auto-generated from Unoverse definition
 */

import { RadialGaugeTemplate } from "../util/types";

export function loadDefaultTemplate(): RadialGaugeTemplate {
  return {
    componentUrl: 'unoverse://components/RadialGauge',
  };
}

export function loadTemplateByVersion(version: string): RadialGaugeTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): RadialGaugeTemplate {
  return loadDefaultTemplate();
}
