/**
 * ImageBlock Template Service
 * Auto-generated from Unoverse definition
 */

import { ImageBlockTemplate } from "../util/types";

export function loadDefaultTemplate(): ImageBlockTemplate {
  return {
    componentUrl: 'unoverse://components/ImageBlock',
  };
}

export function loadTemplateByVersion(version: string): ImageBlockTemplate {
  return loadDefaultTemplate();
}

export function loadTemplateForUser(userId: string): ImageBlockTemplate {
  return loadDefaultTemplate();
}
