'use client';

import {
  Calculator,
  Camera,
  Clock3,
  Image,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Settings,
  Smartphone,
  Wallet,
  Wifi,
} from 'lucide-react';
import type { AppId } from '../../lib/phone/types';

const ICONS: Record<AppId, typeof Phone> = {
  whatsapp: MessageCircle,
  messages: MessageSquare,
  phone: Phone,
  ecocash: Wallet,
  innbucks: Wallet,
  airtime: Wifi,
  clock: Clock3,
  calculator: Calculator,
  settings: Settings,
  camera: Camera,
  maps: MapPin,
  gallery: Image,
};

export function AppGlyph({
  id,
  className = 'h-7 w-7',
}: {
  id: AppId;
  className?: string;
}) {
  const Icon = ICONS[id] ?? Smartphone;
  return <Icon className={className} strokeWidth={1.75} />;
}

export function AppIcon({
  id,
  name,
  color,
  onOpen,
  large = false,
}: {
  id: AppId;
  name: string;
  color: string;
  onOpen: () => void;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col items-center gap-1.5 outline-none"
    >
      <span
        className={`flex items-center justify-center rounded-[1.15rem] text-white shadow-[0_8px_18px_rgba(0,0,0,0.28)] transition-transform duration-200 group-active:scale-90 ${
          large ? 'h-14 w-14' : 'h-[3.35rem] w-[3.35rem]'
        }`}
        style={{ background: color }}
      >
        <AppGlyph id={id} className={large ? 'h-7 w-7' : 'h-6 w-6'} />
      </span>
      {name ? (
        <span className="text-[11px] font-medium tracking-wide text-white drop-shadow">
          {name}
        </span>
      ) : null}
    </button>
  );
}
