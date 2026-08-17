'use client';

import { getStarterPrompts } from '../data/demoScenarios';
import { t } from '../lib/i18n/t';
import type { LanguageCode } from '../lib/types';

export function DemoControls({
  language,
  onUsePrompt,
  onReset,
  layout = 'aside',
}: {
  language: LanguageCode;
  onUsePrompt: (prompt: string) => void;
  onReset: () => void;
  layout?: 'aside' | 'page';
}) {
  const starters = getStarterPrompts(language);
  const page = layout === 'page';

  return (
    <aside
      className={
        page
          ? 'w-full text-left text-[#f3eee4]/70'
          : 'w-full max-w-[220px] text-left text-[#f3eee4]/70'
      }
    >
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#e4b56a]/80">
        {t('demo.guided', language)}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-white/40">
        {t('demo.guidedBlurb', language)}
      </p>
      <div
        className={
          page
            ? 'mt-4 grid grid-cols-1 gap-2'
            : 'hide-scrollbar mt-3 max-h-[420px] space-y-1.5 overflow-y-auto'
        }
      >
        {starters.map((starter) => (
          <button
            key={starter.id}
            type="button"
            onClick={() => onUsePrompt(starter.prompt)}
            title={starter.prompt}
            className={
              page
                ? 'block w-full rounded-2xl bg-white/5 px-4 py-3 text-left ring-1 ring-white/10 transition hover:bg-white/10'
                : 'block w-full rounded-2xl px-3 py-2 text-left transition hover:bg-white/5'
            }
          >
            <span className="block text-[10px] uppercase tracking-[0.16em] text-white/35">
              {starter.title}
            </span>
            <span className="mt-0.5 block text-sm text-white/80">“{starter.prompt}”</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 text-xs text-white/35 underline-offset-2 hover:text-white/70 hover:underline"
      >
        {t('demo.reset', language)}
      </button>
    </aside>
  );
}
