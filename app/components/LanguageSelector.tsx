'use client';

import { LANGUAGES } from '../lib/i18n/languages';
import { t } from '../lib/i18n/t';
import type { LanguageCode } from '../lib/types';

const MARK: Record<LanguageCode, string> = {
  en: '🇬🇧',
  sn: '🇿🇼',
  nd: '🇿🇼',
  sw: '🇰🇪',
};

export function LanguageSelector({
  language,
  onChange,
}: {
  language: LanguageCode;
  onChange: (language: LanguageCode) => void;
}) {
  return (
    <label className="mb-4 flex items-center justify-center gap-2 text-sm text-white/70">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[#e4b56a]">
        {t('language.label', language)}
      </span>
      <select
        value={language}
        onChange={(event) => onChange(event.target.value as LanguageCode)}
        className="rounded-full border border-white/15 bg-[#12161c] px-3 py-1.5 text-sm text-[#f3eee4] outline-none focus:border-[#e4b56a]/70"
        aria-label={t('language.label', language)}
      >
        {LANGUAGES.map((item) => (
          <option key={item.code} value={item.code}>
            {MARK[item.code]} {item.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
