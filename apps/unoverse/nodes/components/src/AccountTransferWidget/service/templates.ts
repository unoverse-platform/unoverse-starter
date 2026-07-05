/**
 * AccountTransferWidget Template Service
 * Auto-generated from Unoverse definition
 */

import { AccountTransferWidgetTemplate } from "../util/types";

export function loadDefaultTemplate(): AccountTransferWidgetTemplate {
  return {
    componentUrl: 'unoverse://components/AccountTransferWidget',
  };
}

export function loadTemplateByVersion(version: string): AccountTransferWidgetTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): AccountTransferWidgetTemplate {
  return loadDefaultTemplate();
}
