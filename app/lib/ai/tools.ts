import { APP_ALIASES } from '../../data/apps';
import { contactsService } from '../services/contacts';
import { getCurrentTime } from '../services/time';
import { walletService } from '../services/wallet';
import type { AppId } from '../phone/types';
import type { Contact } from '../types';

export const APP_DISPLAY_NAMES: Record<AppId, string> = {
  whatsapp: 'WhatsApp',
  messages: 'Messages',
  phone: 'Phone',
  ecocash: 'EcoCash',
  innbucks: 'InnBucks',
  airtime: 'Airtime',
  clock: 'Clock',
  calculator: 'Calculator',
  settings: 'Settings',
  camera: 'Camera',
  maps: 'Maps',
  gallery: 'Gallery',
};

export function resolveApp(text: string): AppId | undefined {
  const normalized = text.toLowerCase();
  let best: AppId | undefined;
  let bestLength = 0;

  (Object.keys(APP_ALIASES) as AppId[]).forEach((app) => {
    for (const alias of APP_ALIASES[app]) {
      if (normalized.includes(alias) && alias.length > bestLength) {
        best = app;
        bestLength = alias.length;
      }
    }
  });

  return best;
}

export function findContact(name: string) {
  return contactsService.resolve(name);
}

export function getBalance() {
  return walletService.getBalance();
}

export function canAfford(amount: number) {
  return walletService.canAfford(amount);
}

export function currentTime() {
  return getCurrentTime();
}

export function contactName(contact?: Contact) {
  return contact?.name ?? '';
}
