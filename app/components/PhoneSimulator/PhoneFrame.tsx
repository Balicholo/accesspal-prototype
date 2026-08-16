'use client';

import type { CSSProperties } from 'react';
import { AssistantOverlay } from '../AccessPal/AssistantOverlay';
import { ErrorSheet } from '../AccessPal/ErrorSheet';
import { PermissionSheet } from '../AccessPal/PermissionSheet';
import { AppWindow } from './AppWindow';
import { NavigationBar } from './NavigationBar';
import { StatusBar } from './StatusBar';
import type { PhoneState } from '../../context/PhoneProvider';
import type { AppId } from '../../lib/phone/types';

export function PhoneFrame({
  state,
  onOpenApp,
  onHome,
  onBack,
  onOpenChat,
  onCall,
  onEndCall,
  onAllow,
  onDeny,
  onConfirm,
  onRetryError,
  onClearError,
  variant = 'framed',
}: {
  state: PhoneState;
  onOpenApp: (app: AppId) => void;
  onHome: () => void;
  onBack: () => void;
  onOpenChat: (contactId: string) => void;
  onCall: (contactId: string) => void;
  onEndCall: () => void;
  onAllow: () => void;
  onDeny: () => void;
  onConfirm: () => void;
  onRetryError?: () => void;
  onClearError?: () => void;
  variant?: 'framed' | 'immersive';
}) {
  const light = state.screen === 'messages' || state.screen === 'messages-thread' || state.screen === 'maps';
  const immersive = variant === 'immersive';

  const screen = (
    <div
      className={`phone-wallpaper relative h-full w-full overflow-hidden ${
        immersive ? '' : 'rounded-[38px]'
      }`}
      style={{ zoom: state.textScale } as CSSProperties}
    >
      {!immersive && (
        <div className="absolute left-1/2 top-2 z-40 h-[22px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
      )}
      <StatusBar light={light} immersive={immersive} />
      <AppWindow
        state={state}
        onOpenApp={onOpenApp}
        onBack={onBack}
        onOpenChat={onOpenChat}
        onCall={onCall}
        onEndCall={onEndCall}
        onConfirm={onConfirm}
        onCancel={onDeny}
      />
      <AssistantOverlay
        phase={state.assistantPhase}
        reply={state.assistantReply}
        heard={state.assistantHeard}
        languageBanner={state.languageBanner}
        currentAction={state.currentAction}
      />
      {state.permission && (
        <PermissionSheet
          permission={state.permission}
          onAllow={onAllow}
          onCancel={onDeny}
        />
      )}
      {state.error && (
        <ErrorSheet
          onRetry={() => onRetryError?.()}
          onCancel={() => onClearError?.()}
        />
      )}
      <NavigationBar onHome={onHome} immersive={immersive} />
    </div>
  );

  if (immersive) {
    return <div className="phone-shell-immersive relative h-full w-full">{screen}</div>;
  }

  return (
    <div className="phone-shell relative">
      <div className="absolute -left-[3px] top-28 h-7 w-[3px] rounded-l-sm bg-[#2a2d33]" />
      <div className="absolute -left-[3px] top-40 h-12 w-[3px] rounded-l-sm bg-[#2a2d33]" />
      <div className="absolute -right-[3px] top-36 h-16 w-[3px] rounded-r-sm bg-[#2a2d33]" />

      <div className="relative h-[740px] w-[360px] overflow-hidden rounded-[48px] bg-[#0a0a0c] p-[10px] shadow-[0_40px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        {screen}
      </div>
    </div>
  );
}
