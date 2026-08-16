import { t } from '../i18n/t';
import type { PermissionKind, PermissionRequest } from '../phone/types';
import type { LanguageCode } from '../types';

/** Simulated OS permission prompts. No real device permissions are changed. */
export function createPermission(
  kind: PermissionKind,
  language: LanguageCode = 'en'
): PermissionRequest {
  if (kind === 'financial') {
    return {
      kind,
      title: t('permission.financialTitle', language),
      body: t('permission.financialBody', language),
    };
  }
  return {
    kind,
    title: kind,
    body: t('permission.financialBody', language),
  };
}
