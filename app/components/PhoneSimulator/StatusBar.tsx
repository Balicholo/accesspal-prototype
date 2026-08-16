'use client';

import { useEffect, useState } from 'react';
import { Signal, Wifi, BatteryFull } from 'lucide-react';

export function StatusBar({
  light = false,
  immersive = false,
}: {
  light?: boolean;
  immersive?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const tone = light ? 'text-black/80' : 'text-white';

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex items-end justify-between px-6 pb-1 text-[12px] font-semibold ${
        immersive ? 'h-12 pt-[env(safe-area-inset-top)]' : 'h-11'
      } ${tone}`}
    >
      <span className="tabular-nums">{time}</span>
      <div className="flex items-center gap-1.5">
        <Signal className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <span className="flex items-center gap-0.5">
          <BatteryFull className="h-4 w-4" />
          <span className="text-[10px]">82%</span>
        </span>
      </div>
    </div>
  );
}
