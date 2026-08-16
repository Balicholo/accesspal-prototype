'use client';

import { ArrowLeft, Check } from 'lucide-react';
import { useT } from '../../hooks/useT';
import { formatMoney } from '../../lib/format';
import type { TransferDraft } from '../../lib/phone/types';
import type { WalletSnapshot } from '../../lib/types';

export function EcoCashHome({
  wallet,
  onBack,
}: {
  wallet: WalletSnapshot;
  onBack: () => void;
}) {
  const t = useT();
  return (
    <div className="flex h-full flex-col bg-[#06261f] text-white">
      <header className="flex items-center gap-3 px-4 pb-3 pt-12">
        <button type="button" onClick={onBack} aria-label={t('common.back')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-lg font-semibold">EcoCash</p>
          <p className="text-[11px] text-emerald-100/60">{t('ecocash.simulated')}</p>
        </div>
      </header>
      <div className="px-4">
        <div className="rounded-3xl bg-gradient-to-br from-[#0f766e] to-[#064e3b] p-5 shadow-lg">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/70">
            {t('ecocash.balance')}
          </p>
          <p className="mt-2 text-4xl font-light">{formatMoney(wallet.balance, 2)}</p>
          <p className="mt-3 text-sm text-emerald-50/70">{wallet.owner}</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            t('ecocash.sendMoney'),
            t('ecocash.buyAirtime'),
            t('ecocash.payMerchant'),
            t('ecocash.cashOut'),
          ].map((label) => (
            <div
              key={label}
              className="rounded-2xl bg-white/10 px-4 py-4 text-sm ring-1 ring-white/10"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EcoCashSend({
  transfer,
  onBack,
}: {
  transfer: TransferDraft;
  onBack: () => void;
}) {
  const t = useT();
  return (
    <div className="flex h-full flex-col bg-[#06261f] text-white">
      <header className="flex items-center gap-3 px-4 pb-3 pt-12">
        <button type="button" onClick={onBack} aria-label={t('common.back')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-lg font-semibold">{t('ecocash.sendTitle')}</p>
      </header>
      <div className="space-y-4 px-4">
        <Field label={t('ecocash.recipient')} value={transfer.recipientName} />
        <Field label={t('ecocash.amount')} value={formatMoney(transfer.amount, 2)} />
        <Field label={t('ecocash.service')} value={transfer.service} />
      </div>
    </div>
  );
}

export function EcoCashConfirm({
  transfer,
  onBack,
  onCancel,
  onConfirm,
}: {
  transfer: TransferDraft;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useT();
  return (
    <div className="flex h-full flex-col bg-[#06261f] text-white">
      <header className="flex items-center gap-3 px-4 pb-3 pt-12">
        <button type="button" onClick={onBack} aria-label={t('common.back')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-lg font-semibold">{t('ecocash.confirmTitle')}</p>
      </header>
      <div className="mx-4 rounded-3xl bg-white/10 p-5 ring-1 ring-white/10">
        <p className="text-sm text-white/60">{t('ecocash.send')}</p>
        <p className="mt-1 text-3xl font-light">{formatMoney(transfer.amount, 2)}</p>
        <p className="mt-4 text-sm text-white/60">{t('ecocash.to')}</p>
        <p className="text-xl">{transfer.recipientName}</p>
        <p className="mt-4 text-sm text-emerald-200/80">{transfer.service}</p>
      </div>
      <div className="mt-auto flex gap-3 px-4 pb-10">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full bg-white/10 py-3 text-center text-sm"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-full bg-[#10b981] py-3 text-center text-sm font-medium"
        >
          {t('common.confirm')}
        </button>
      </div>
    </div>
  );
}

export function EcoCashAuth() {
  const t = useT();
  return <Stage title={t('common.authenticating')} dots />;
}

export function EcoCashProcessing() {
  const t = useT();
  return <Stage title={t('ecocash.processing')} />;
}

export function EcoCashSuccess({
  transfer,
  balance,
}: {
  transfer: TransferDraft;
  balance: number;
}) {
  const t = useT();
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#06261f] px-6 text-center text-white">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#10b981]">
        <Check className="h-8 w-8" />
      </span>
      <p className="mt-5 text-lg font-semibold">{t('ecocash.success')}</p>
      <p className="mt-2 text-3xl font-light">{formatMoney(transfer.amount, 2)}</p>
      <p className="mt-1 text-white/65">{t('ecocash.sentTo', { name: transfer.recipientName })}</p>
      <p className="mt-8 text-xs uppercase tracking-[0.2em] text-white/40">
        {t('ecocash.newBalance')}
      </p>
      <p className="mt-1 text-xl">{formatMoney(balance, 2)}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{label}</p>
      <p className="mt-1 text-lg">{value}</p>
    </div>
  );
}

function Stage({ title, dots = false }: { title: string; dots?: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#06261f] text-white">
      <div className="mb-6 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      <p className="text-lg">{title}</p>
      {dots && <p className="mt-4 tracking-[0.6em] text-white/50">••••</p>}
    </div>
  );
}
