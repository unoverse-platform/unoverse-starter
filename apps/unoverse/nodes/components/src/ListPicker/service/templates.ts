/**
 * ListPicker Template Service
 * Auto-generated from Unoverse definition
 */

import { ListPickerTemplate } from "../util/types";

export function loadDefaultTemplate(): ListPickerTemplate {
  return {
    componentUrl: 'unoverse://components/ListPicker',
  };
}

export function loadTemplateByVersion(version: string): ListPickerTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): ListPickerTemplate {
  return loadDefaultTemplate();
}
