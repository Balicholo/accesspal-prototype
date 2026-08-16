import type { AppId } from '../lib/phone/types';

export interface HomeApp {
  id: AppId;
  name: string;
  color: string;
  dock?: boolean;
}

export const HOME_APPS: HomeApp[] = [
  { id: 'whatsapp', name: 'WhatsApp', color: '#25D366' },
  { id: 'phone', name: 'Phone', color: '#30D158' },
  { id: 'messages', name: 'Messages', color: '#34C759' },
  { id: 'clock', name: 'Clock', color: '#1C1C1E' },
  { id: 'ecocash', name: 'EcoCash', color: '#0B8F7A' },
  { id: 'airtime', name: 'Airtime', color: '#7C3AED' },
  { id: 'camera', name: 'Camera', color: '#52525B' },
  { id: 'maps', name: 'Maps', color: '#0284C7' },
  { id: 'gallery', name: 'Gallery', color: '#DB2777' },
  { id: 'calculator', name: 'Calculator', color: '#EA580C' },
  { id: 'innbucks', name: 'InnBucks', color: '#C2410C' },
  { id: 'settings', name: 'Settings', color: '#64748B' },
];

export const DOCK_APPS: HomeApp[] = [
  { id: 'phone', name: 'Phone', color: '#30D158', dock: true },
  { id: 'messages', name: 'Messages', color: '#34C759', dock: true },
  { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', dock: true },
  { id: 'ecocash', name: 'EcoCash', color: '#0B8F7A', dock: true },
];

export const APP_ALIASES: Record<AppId, string[]> = {
  whatsapp: ['whatsapp', 'whats app', 'watsap', 'whatsap'],
  messages: ['messages', 'message', 'sms', 'texts', 'text messages'],
  phone: ['phone', 'dialer', 'telephone', 'calls'],
  ecocash: ['ecocash', 'eco cash', 'eco-cash'],
  innbucks: ['innbucks', 'inn bucks', 'inbucks'],
  airtime: ['airtime', 'recharge', 'top up', 'topup'],
  clock: ['clock', 'time', 'watch'],
  calculator: ['calculator', 'calc'],
  settings: ['settings', 'setting'],
  camera: ['camera', 'photo', 'selfie'],
  maps: ['maps', 'map', 'directions'],
  gallery: ['gallery', 'photos', 'pictures', 'album'],
};
