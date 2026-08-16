'use client';

import { ArrowLeft, Phone as PhoneIcon, PhoneOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useT } from '../../hooks/useT';
import { contactsService } from '../../lib/services/contacts';
import type { ActiveCall } from '../../lib/phone/types';

export function PhoneApp({
  onBack,
  onCall,
}: {
  onBack: () => void;
  onCall: (contactId: string) => void;
}) {
  const t = useT();
  const contacts = contactsService.list();

  return (
    <div className="flex h-full flex-col bg-[#0c0d10] text-white">
      <header className="flex items-center gap-3 px-4 pb-3 pt-12">
        <button type="button" onClick={onBack} aria-label={t('common.back')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-lg font-semibold">{t('app.phone')}</p>
          <p className="text-[11px] text-white/45">{t('phone.subtitle')}</p>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-2">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            type="button"
            onClick={() => onCall(contact.id)}
            className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left hover:bg-white/5"
          >
            <span>
              <span className="block font-medium">{contact.name}</span>
              <span className="text-xs text-white/45">{contact.phone}</span>
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#30D158]">
              <PhoneIcon className="h-4 w-4" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CallScreen({
  call,
  onEnd,
}: {
  call: ActiveCall;
  onEnd: () => void;
}) {
  const t = useT();
  const contact = contactsService.findById(call.contactId);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - call.startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [call.startedAt]);

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="flex h-full flex-col items-center bg-gradient-to-b from-[#1a1f2c] to-[#0b0d12] px-6 pb-10 pt-20 text-white">
      <p className="text-sm uppercase tracking-[0.28em] text-white/50">
        {elapsed < 2 ? t('phone.calling') : t('phone.connected')}
      </p>
      <h2 className="mt-4 text-4xl font-light">{contact?.name ?? t('phone.contact')}</h2>
      <p className="mt-2 text-white/50">{contact?.phone}</p>
      <p className="mt-8 font-mono text-lg text-white/70">
        {minutes}:{seconds}
      </p>
      <div className="mt-auto">
        <button
          type="button"
          onClick={onEnd}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ef4444] shadow-lg"
          aria-label={t('phone.endCall')}
        >
          <PhoneOff className="h-7 w-7" />
        </button>
        <p className="mt-3 text-center text-xs text-white/50">{t('phone.endCall')}</p>
      </div>
    </div>
  );
}
