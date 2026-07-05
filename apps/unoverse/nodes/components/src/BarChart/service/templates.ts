/**
 * BarChart Template Service
 * Auto-generated from Unoverse definition
 */

import { BarChartTemplate } from "../util/types";

export function loadDefaultTemplate(): BarChartTemplate {
  return {
    componentUrl: 'unoverse://components/BarChart',
  };
}

export function loadTemplateByVersion(version: string): BarChartTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): BarChartTemplate {
  return loadDefaultTemplate();
}
