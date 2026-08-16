'use client';

import { getDemoScenarios, type PlayableDemo } from '../data/demoScenarios';
import { t } from '../lib/i18n/t';
import type { LanguageCode } from '../lib/types';

export function DemoControls({
  language,
  running,
  onPlay,
  onReset,
}: {
  language: LanguageCode;
  running: boolean;
  onPlay: (scenario: PlayableDemo) => void;
  onReset: () => void;
}) {
  const scenarios = getDemoScenarios(language);

  return (
    <aside className="w-full max-w-[220px] text-left text-[#f3eee4]/70">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#e4b56a]/80">
        {t('demo.guided', language)}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-white/40">
        {t('demo.guidedBlurb', language)}
      </p>
      <div className="hide-scrollbar mt-3 max-h-[420px] space-y-1.5 overflow-y-auto">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            disabled={running}
            onClick={() => onPlay(scenario)}
            className="block w-full rounded-full px-3 py-1.5 text-left text-sm text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            {scenario.title}
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
