/**
 * MarkdownRenderer Template Service
 * Auto-generated from Unoverse definition
 */

import { MarkdownRendererTemplate } from "../util/types";

export function loadDefaultTemplate(): MarkdownRendererTemplate {
  return {
    componentUrl: 'unoverse://components/MarkdownRenderer',
  };
}

export function loadTemplateByVersion(version: string): MarkdownRendererTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): MarkdownRendererTemplate {
  return loadDefaultTemplate();
}
