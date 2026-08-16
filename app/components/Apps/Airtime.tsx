'use client';

import { ArrowLeft, Check } from 'lucide-react';
import { useT } from '../../hooks/useT';
import { formatMoney } from '../../lib/format';
import type { AirtimeDraft } from '../../lib/phone/types';

export function AirtimeApp({
  draft,
  balance,
  onBack,
  onConfirm,
}: {
  draft: AirtimeDraft | null;
  balance: number;
  onBack: () => void;
  onConfirm?: () => void;
}) {
  const t = useT();
  const amount = draft?.amount ?? 5;

  if (draft?.phase === 'processing') {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#14081f] text-white">
        <div className="mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p>{t('common.processing')}</p>
      </div>
    );
  }

  if (draft?.phase === 'success') {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#14081f] px-6 text-center text-white">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7c3aed]">
          <Check className="h-8 w-8" />
        </span>
        <p className="mt-5 text-lg font-semibold">{t('airtime.purchased')}</p>
        <p className="mt-2 text-3xl font-light">{formatMoney(amount)}</p>
        <p className="mt-6 text-sm text-white/55">
          {t('airtime.balance', { amount: formatMoney(balance, 2) })}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#14081f] text-white">
      <header className="flex items-center gap-3 px-4 pb-3 pt-12">
        <button type="button" onClick={onBack} aria-label={t('common.back')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-lg font-semibold">{t('app.airtime')}</p>
      </header>
      <div className="px-5">
        <p className="text-sm text-white/50">{t('airtime.current')}</p>
        <p className="mt-1 text-3xl font-light">{formatMoney(balance, 2)}</p>
        <div className="mt-8 rounded-3xl bg-white/10 p-5 ring-1 ring-white/10">
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">
            {t('airtime.purchase')}
          </p>
          <p className="mt-2 text-4xl font-light">{formatMoney(amount)}</p>
          <p className="mt-4 text-sm text-white/60">{t('airtime.confirmAsk')}</p>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className="mt-5 w-full rounded-full bg-[#7c3aed] py-3 text-sm font-medium"
            >
              {t('common.confirm')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
