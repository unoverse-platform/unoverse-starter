/**
 * MetricGrid Template Service
 * Auto-generated from Unoverse definition
 */

import { MetricGridTemplate } from "../util/types";

export function loadDefaultTemplate(): MetricGridTemplate {
  return {
    componentUrl: 'unoverse://components/MetricGrid',
  };
}

export function loadTemplateByVersion(version: string): MetricGridTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): MetricGridTemplate {
  return loadDefaultTemplate();
}
