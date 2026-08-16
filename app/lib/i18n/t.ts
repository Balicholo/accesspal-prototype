import { en } from '../../locales/en';
import { nd } from '../../locales/nd';
import { sn } from '../../locales/sn';
import { sw } from '../../locales/sw';
import type { LanguageCode } from '../types';

const PACKS = { en, sn, nd, sw };

export function t(
  key: string,
  language: LanguageCode = 'en',
  vars: Record<string, string | number> = {}
) {
  const pack = PACKS[language] ?? en;
  const template = pack[key] ?? en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(vars[name] ?? `{${name}}`)
  );
}
