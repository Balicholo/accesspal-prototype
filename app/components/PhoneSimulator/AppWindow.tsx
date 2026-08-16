'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { getLanguage } from '../../lib/i18n/languages';
import { AirtimeApp } from '../Apps/Airtime';
import { ClockApp } from '../Apps/Clock';
import {
  EcoCashAuth,
  EcoCashConfirm,
  EcoCashHome,
  EcoCashProcessing,
  EcoCashSend,
  EcoCashSuccess,
} from '../Apps/EcoCash';
import { CallScreen, PhoneApp } from '../Apps/Phone';
import {
  CalculatorApp,
  CameraApp,
  GalleryApp,
  InnBucksApp,
  MapsApp,
  MessagesApp,
  SettingsApp,
} from '../Apps/UtilityApps';
import { WhatsAppChat, WhatsAppList } from '../Apps/WhatsApp';
import { HomeScreen } from './HomeScreen';
import type { PhoneState } from '../../context/PhoneProvider';
import type { AppId } from '../../lib/phone/types';

export function AppWindow({
  state,
  onOpenApp,
  onBack,
  onOpenChat,
  onCall,
  onEndCall,
  onConfirm,
  onCancel,
}: {
  state: PhoneState;
  onOpenApp: (app: AppId) => void;
  onBack: () => void;
  onOpenChat: (contactId: string) => void;
  onCall: (contactId: string) => void;
  onEndCall: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const content = renderScreen(state, {
    onOpenApp,
    onBack,
    onOpenChat,
    onCall,
    onEndCall,
    onConfirm,
    onCancel,
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state.screen}
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.03 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}

function renderScreen(
  state: PhoneState,
  handlers: {
    onOpenApp: (app: AppId) => void;
    onBack: () => void;
    onOpenChat: (contactId: string) => void;
    onCall: (contactId: string) => void;
    onEndCall: () => void;
    onConfirm: () => void;
    onCancel: () => void;
  }
) {
  switch (state.screen) {
    case 'home':
      return <HomeScreen onOpen={handlers.onOpenApp} />;
    case 'whatsapp':
      return (
        <WhatsAppList
          chats={state.chats}
          onOpen={handlers.onOpenChat}
          onBack={handlers.onBack}
        />
      );
    case 'whatsapp-chat':
      return (
        <WhatsAppChat
          contactId={state.activeContactId ?? 'joe'}
          messages={state.chats[state.activeContactId ?? 'joe'] ?? []}
          draft={
            state.draftMessage?.contactId === state.activeContactId
              ? state.draftMessage.text
              : ''
          }
          onBack={handlers.onBack}
        />
      );
    case 'messages':
    case 'messages-thread':
      return (
        <MessagesApp
          chats={state.chats}
          onOpen={handlers.onOpenChat}
          onBack={handlers.onBack}
        />
      );
    case 'phone':
      return <PhoneApp onBack={handlers.onBack} onCall={handlers.onCall} />;
    case 'call':
      return state.call ? (
        <CallScreen call={state.call} onEnd={handlers.onEndCall} />
      ) : (
        <PhoneApp onBack={handlers.onBack} onCall={handlers.onCall} />
      );
    case 'ecocash':
      return <EcoCashHome wallet={state.wallet} onBack={handlers.onBack} />;
    case 'ecocash-send':
      return state.transfer ? (
        <EcoCashSend transfer={state.transfer} onBack={handlers.onBack} />
      ) : (
        <EcoCashHome wallet={state.wallet} onBack={handlers.onBack} />
      );
    case 'ecocash-confirm':
      return state.transfer ? (
        <EcoCashConfirm
          transfer={state.transfer}
          onBack={handlers.onBack}
          onCancel={handlers.onCancel}
          onConfirm={handlers.onConfirm}
        />
      ) : (
        <EcoCashHome wallet={state.wallet} onBack={handlers.onBack} />
      );
    case 'ecocash-auth':
      return <EcoCashAuth />;
    case 'ecocash-processing':
      return <EcoCashProcessing />;
    case 'ecocash-success':
      return state.transfer ? (
        <EcoCashSuccess transfer={state.transfer} balance={state.wallet.balance} />
      ) : (
        <EcoCashHome wallet={state.wallet} onBack={handlers.onBack} />
      );
    case 'airtime':
    case 'airtime-confirm':
    case 'airtime-processing':
    case 'airtime-success':
      return (
        <AirtimeApp
          draft={state.airtime}
          balance={state.airtimeBalance}
          onBack={handlers.onBack}
          onConfirm={handlers.onConfirm}
        />
      );
    case 'clock':
      return <ClockApp onBack={handlers.onBack} alarmTime={state.alarmTime} />;
    case 'calculator':
      return <CalculatorApp onBack={handlers.onBack} />;
    case 'settings':
      return (
        <SettingsApp
          language={getLanguage(state.language).nativeName}
          onBack={handlers.onBack}
        />
      );
    case 'camera':
      return <CameraApp onBack={handlers.onBack} />;
    case 'maps':
      return <MapsApp onBack={handlers.onBack} />;
    case 'gallery':
      return <GalleryApp onBack={handlers.onBack} />;
    case 'innbucks':
      return <InnBucksApp onBack={handlers.onBack} />;
    default:
      return <HomeScreen onOpen={handlers.onOpenApp} />;
  }
}
