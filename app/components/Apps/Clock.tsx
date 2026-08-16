'use client';

import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useT } from '../../hooks/useT';

export function ClockApp({
  onBack,
  alarmTime,
}: {
  onBack: () => void;
  alarmTime: string | null;
}) {
  const t = useT();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const date = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex h-full flex-col bg-[#09090b] text-white">
      <header className="flex items-center gap-3 px-4 pb-3 pt-12">
        <button type="button" onClick={onBack} aria-label={t('common.back')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-lg font-semibold">{t('app.clock')}</p>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center pb-16">
        <p className="text-[64px] font-extralight leading-none tracking-tight">
          {time}
        </p>
        <p className="mt-6 text-lg text-white/70">{weekday}</p>
        <p className="text-white/50">{date}</p>
        <div className="mt-10 rounded-2xl bg-white/8 px-5 py-3 ring-1 ring-white/10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            {t('clock.alarm')}
          </p>
          <p className="mt-1 text-sm text-white/80">
            {alarmTime ? t('clock.alarmSet', { time: alarmTime }) : t('clock.noAlarm')}
          </p>
        </div>
      </div>
    </div>
  );
}
