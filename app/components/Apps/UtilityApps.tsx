'use client';

import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { usePhone } from '../../context/PhoneProvider';
import { useT } from '../../hooks/useT';
import { contactsService } from '../../lib/services/contacts';
import type { ChatBubble } from '../../lib/phone/types';

function Shell({
  title,
  onBack,
  children,
  light = false,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  light?: boolean;
}) {
  const t = useT();
  return (
    <div className={`flex h-full flex-col ${light ? 'bg-[#f4f4f5] text-zinc-900' : 'bg-[#0c0d10] text-white'}`}>
      <header className="flex items-center gap-3 px-4 pb-3 pt-12">
        <button type="button" onClick={onBack} aria-label={t('common.back')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-lg font-semibold">{title}</p>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-8">{children}</div>
    </div>
  );
}

export function MessagesApp({
  chats,
  onOpen,
  onBack,
}: {
  chats: Record<string, ChatBubble[]>;
  onOpen: (contactId: string) => void;
  onBack: () => void;
}) {
  const t = useT();
  return (
    <Shell title={t('app.messages')} onBack={onBack} light>
      {contactsService.list().map((contact) => {
        const last = (chats[contact.id] ?? []).at(-1);
        return (
          <button
            key={contact.id}
            type="button"
            onClick={() => onOpen(contact.id)}
            className="mb-2 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left shadow-sm"
          >
            <span>
              <span className="block font-medium">{contact.name}</span>
              <span className="text-sm text-zinc-500">
                {last?.text ?? t('messages.empty')}
              </span>
            </span>
          </button>
        );
      })}
    </Shell>
  );
}

export function SettingsApp({
  language,
  onBack,
}: {
  language: string;
  onBack: () => void;
}) {
  const t = useT();
  const { state, dispatch } = usePhone();

  return (
    <Shell title={t('app.settings')} onBack={onBack}>
      <div className="space-y-3">
        <Row label={t('settings.assistant')} value="AccessPal" />
        <Row label={t('settings.language')} value={language} />
        <Row label={t('settings.handsfree')} value={t('settings.handsfreeValue')} />
        <Row label={t('settings.finance')} value={t('settings.financeValue')} />
        <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">
            {t('settings.accessibility')}
          </p>
          <p className="mt-3 text-xs text-white/50">{t('settings.textSize')}</p>
          <div className="mt-2 flex gap-2">
            <Choice
              active={state.textScale <= 1}
              label={t('settings.textNormal')}
              onClick={() => dispatch({ type: 'SET_TEXT_SCALE', scale: 1 })}
            />
            <Choice
              active={state.textScale > 1}
              label={t('settings.textLarge')}
              onClick={() => dispatch({ type: 'SET_TEXT_SCALE', scale: 1.18 })}
            />
          </div>
          <p className="mt-4 text-xs text-white/50">{t('settings.voiceSpeed')}</p>
          <div className="mt-2 flex gap-2">
            <Choice
              active={state.voiceRate >= 0.9}
              label={t('settings.voiceNormal')}
              onClick={() => dispatch({ type: 'SET_VOICE_RATE', rate: 0.96 })}
            />
            <Choice
              active={state.voiceRate < 0.9}
              label={t('settings.voiceSlow')}
              onClick={() => dispatch({ type: 'SET_VOICE_RATE', rate: 0.72 })}
            />
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function CameraApp({ onBack }: { onBack: () => void }) {
  const t = useT();
  return (
    <div className="relative h-full bg-black text-white">
      <button
        type="button"
        onClick={onBack}
        className="absolute left-4 top-12 z-10"
        aria-label={t('common.back')}
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="flex h-full flex-col items-center justify-end pb-12">
        <div className="mb-8 h-16 w-16 rounded-full border-4 border-white/80" />
      </div>
    </div>
  );
}

export function MapsApp({ onBack }: { onBack: () => void }) {
  const t = useT();
  return (
    <Shell title={t('app.maps')} onBack={onBack} light>
      <div className="relative h-[420px] overflow-hidden rounded-3xl bg-[#d7e3d0]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,#94a3b8_0,transparent_24%),radial-gradient(circle_at_70%_60%,#86efac_0,transparent_18%)]" />
        <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0284c7] ring-4 ring-sky-200" />
        <div className="absolute bottom-4 left-4 rounded-2xl bg-white px-3 py-2 text-sm shadow">
          Harare
        </div>
      </div>
    </Shell>
  );
}

export function GalleryApp({ onBack }: { onBack: () => void }) {
  const t = useT();
  const colors = ['#1f2937', '#0f766e', '#9a3412', '#1e3a5f', '#4c1d95', '#854d0e'];
  return (
    <Shell title={t('app.gallery')} onBack={onBack}>
      <div className="grid grid-cols-3 gap-1.5">
        {colors.map((color) => (
          <div key={color} className="aspect-square rounded-xl" style={{ background: color }} />
        ))}
      </div>
    </Shell>
  );
}

export function CalculatorApp({ onBack }: { onBack: () => void }) {
  const t = useT();
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);

  const press = (value: string) => {
    if (value === 'C') {
      setDisplay('0');
      setStored(null);
      setOp(null);
      return;
    }
    if ('+-×÷'.includes(value)) {
      setStored(Number(display));
      setOp(value);
      setDisplay('0');
      return;
    }
    if (value === '=') {
      if (stored === null || !op) return;
      const current = Number(display);
      const result =
        op === '+'
          ? stored + current
          : op === '-'
            ? stored - current
            : op === '×'
              ? stored * current
              : stored / current;
      setDisplay(String(result));
      setStored(null);
      setOp(null);
      return;
    }
    setDisplay((current) => (current === '0' ? value : `${current}${value}`));
  };

  const keys = ['C', '÷', '×', '-', '7', '8', '9', '+', '4', '5', '6', '=', '1', '2', '3', '0'];

  return (
    <Shell title={t('app.calculator')} onBack={onBack}>
      <p className="mb-6 text-right text-5xl font-light">{display}</p>
      <div className="grid grid-cols-4 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            className="rounded-2xl bg-white/10 py-4 text-lg"
          >
            {key}
          </button>
        ))}
      </div>
    </Shell>
  );
}

export function InnBucksApp({ onBack }: { onBack: () => void }) {
  const t = useT();
  return (
    <Shell title="InnBucks" onBack={onBack}>
      <div className="rounded-3xl bg-gradient-to-br from-[#c2410c] to-[#7c2d12] p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-white/70">{t('common.simulated')}</p>
        <p className="mt-2 text-3xl font-light">{t('innbucks.wallet')}</p>
        <p className="mt-3 text-sm text-white/70">{t('innbucks.ready')}</p>
      </div>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function Choice({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full py-2 text-xs ${
        active ? 'bg-[#e4b56a] text-[#1a140c]' : 'bg-white/10 text-white/70'
      }`}
    >
      {label}
    </button>
  );
}
