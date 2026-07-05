/**
 * StackedBarChart Template Service
 * Auto-generated from Unoverse definition
 */

import { StackedBarChartTemplate } from "../util/types";

export function loadDefaultTemplate(): StackedBarChartTemplate {
  return {
    componentUrl: 'unoverse://components/StackedBarChart',
  };
}

export function loadTemplateByVersion(version: string): StackedBarChartTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): StackedBarChartTemplate {
  return loadDefaultTemplate();
}
