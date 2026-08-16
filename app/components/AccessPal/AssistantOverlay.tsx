'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useT } from '../../hooks/useT';
import type { AssistantPhase } from '../../lib/phone/types';
import { Waveform } from './Waveform';

export function AssistantOverlay({
  phase,
  reply,
  heard,
  languageBanner,
  currentAction,
}: {
  phase: AssistantPhase;
  reply: string;
  heard: string;
  languageBanner: string | null;
  currentAction?: string;
}) {
  const t = useT();
  const STATUS: Record<AssistantPhase, string> = {
    dormant: '',
    standby: t('overlay.standby'),
    waking: t('overlay.waking'),
    listening: t('overlay.listening'),
    thinking: t('overlay.thinking'),
    executing: currentAction || t('overlay.executing'),
    speaking: currentAction || t('overlay.speaking'),
    minimized: t('overlay.listening'),
  };
  const visible = phase !== 'dormant';
  const compact = phase === 'minimized' || phase === 'executing' || phase === 'standby';
  const listening =
    phase === 'listening' ||
    phase === 'waking' ||
    phase === 'minimized' ||
    phase === 'standby';
  const speaking = phase === 'speaking' || phase === 'executing';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-40 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <div
            className={`absolute inset-0 ${
              compact ? 'bg-black/10' : 'bg-black/45'
            }`}
          />
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className={`pointer-events-auto absolute inset-x-4 ${
              compact ? 'bottom-10' : 'bottom-12'
            }`}
          >
            <div className="rounded-[1.7rem] bg-[#12161c]/92 px-5 py-4 text-center text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center">
                <span className="ap-ring" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#e4b56a]">
                AccessPal
              </p>
              <p className="mt-1 text-sm text-white/70">{STATUS[phase]}</p>
              <div className="mt-3">
                <Waveform active={listening || speaking} speaking={speaking} />
              </div>
              {heard && (phase === 'listening' || phase === 'thinking') && (
                <p className="mt-3 text-sm text-white/55">“{heard}”</p>
              )}
              {reply &&
                (phase === 'speaking' ||
                  phase === 'executing' ||
                  phase === 'minimized' ||
                  (phase === 'listening' && !heard)) && (
                <p className="mt-3 text-[15px] leading-relaxed text-white/90">
                  {reply}
                </p>
              )}
              {languageBanner && (
                <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[#e4b56a]/80">
                  {languageBanner}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
