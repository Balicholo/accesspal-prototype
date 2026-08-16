'use client';

import { useEffect, useState } from 'react';
import { DOCK_APPS, HOME_APPS } from '../../data/apps';
import { useT } from '../../hooks/useT';
import type { AppId } from '../../lib/phone/types';
import { AppIcon } from './AppIcon';

const BRAND: Partial<Record<AppId, string>> = {
  whatsapp: 'WhatsApp',
  ecocash: 'EcoCash',
  innbucks: 'InnBucks',
};

export function HomeScreen({ onOpen }: { onOpen: (app: AppId) => void }) {
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
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const appName = (id: AppId, fallback: string) => BRAND[id] ?? t(`app.${id}`) ?? fallback;

  return (
    <div className="flex h-full flex-col px-5 pb-8 pt-14">
      <div className="mb-4 rounded-[1.4rem] bg-white/10 px-4 py-3 text-white shadow-inner ring-1 ring-white/10 backdrop-blur-md">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">
          {date}
        </p>
        <p className="mt-0.5 text-3xl font-light tracking-tight">{time}</p>
        <p className="mt-1 text-xs text-white/70">{t('home.ready')}</p>
      </div>

      <div className="grid grid-cols-4 gap-x-3 gap-y-5">
        {HOME_APPS.map((app) => (
          <AppIcon
            key={app.id}
            id={app.id}
            name={appName(app.id, app.name)}
            color={app.color}
            onOpen={() => onOpen(app.id)}
          />
        ))}
      </div>

      <div className="mt-auto rounded-[1.8rem] bg-white/10 px-3 py-3 ring-1 ring-white/10 backdrop-blur-xl">
        <div className="grid grid-cols-4">
          {DOCK_APPS.map((app) => (
            <AppIcon
              key={`dock-${app.id}`}
              id={app.id}
              name=""
              color={app.color}
              large
              onOpen={() => onOpen(app.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
