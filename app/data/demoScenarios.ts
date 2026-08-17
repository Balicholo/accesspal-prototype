import type { LanguageCode } from '../lib/types';
import { t } from '../lib/i18n/t';

export interface StarterPrompt {
  id: string;
  titleKey: string;
  prompt: Record<LanguageCode, string>;
}

const STARTERS: StarterPrompt[] = [
  {
    id: 'open-whatsapp',
    titleKey: 'demo.openWhatsapp',
    prompt: {
      en: 'Hey Pal, open WhatsApp.',
      sn: 'Hey Pal, vhura WhatsApp.',
      nd: 'Hey Pal, vula iWhatsApp.',
      sw: 'Hey Pal, fungua WhatsApp.',
    },
  },
  {
    id: 'message-joe',
    titleKey: 'demo.messageJoe',
    prompt: {
      en: "Send Joe a WhatsApp message saying I'll call him later.",
      sn: 'Tumira meseji yeWhatsApp kuna Joe kuti ndichamufonera gare gare.',
      nd: 'Thumela umlayezo we-WhatsApp kuJoe uthi ngizomshayela kamuva.',
      sw: 'Mtumie Joe ujumbe wa WhatsApp kwamba nitampigia baadaye.',
    },
  },
  {
    id: 'send-money',
    titleKey: 'demo.sendMoney',
    prompt: {
      en: 'Hey Pal, send $20 to Wisdom using EcoCash.',
      sn: 'Hey Pal, ndoda kutumira $20 kuna Wisdom neEcoCash.',
      nd: 'Hey Pal, ngifuna ukuthumela u-$20 kuWisdom nge-EcoCash.',
      sw: 'Hey Pal, nataka kutuma dola 20 kwa Wisdom kwa EcoCash.',
    },
  },
  {
    id: 'buy-airtime',
    titleKey: 'demo.airtime',
    prompt: {
      en: 'Buy $5 airtime.',
      sn: 'Tenga airtime yemadhora mashanu.',
      nd: 'Thenga i-airtime yamadola amahlanu.',
      sw: 'Nunua airtime ya dola tano.',
    },
  },
  {
    id: 'call-tendai',
    titleKey: 'demo.call',
    prompt: {
      en: 'Call Tendai.',
      sn: 'Fonera Tendai.',
      nd: 'Fowunela uTendai.',
      sw: 'Mpigie Tendai simu.',
    },
  },
  {
    id: 'check-balance',
    titleKey: 'demo.balance',
    prompt: {
      en: 'What is my EcoCash balance?',
      sn: 'Mari yangu yeEcoCash yakawanda sei?',
      nd: 'Ibhalansi yami ye-EcoCash ingakanani?',
      sw: 'Salio langu la EcoCash ni kiasi gani?',
    },
  },
  {
    id: 'check-time',
    titleKey: 'demo.time',
    prompt: {
      en: 'What time is it?',
      sn: 'Nguvai?',
      nd: 'Kungasikhathi bani?',
      sw: 'Ni saa ngapi?',
    },
  },
  {
    id: 'set-alarm',
    titleKey: 'demo.alarm',
    prompt: {
      en: 'Set an alarm for 6 AM.',
      sn: 'Gadzira alarm ye6 AM.',
      nd: 'Misa i-alamu ngo-6 AM.',
      sw: 'Weka kengele saa 6 asubuhi.',
    },
  },
  {
    id: 'conversation',
    titleKey: 'demo.conversation',
    prompt: {
      en: 'This platform is really beautiful.',
      sn: 'Iyi platform yakanaka chaizvo.',
      nd: 'Le platform yinhle impela.',
      sw: 'Jukwaa hili ni zuri sana.',
    },
  },
  {
    id: 'mixed-reach-joe',
    titleKey: 'demo.mixed',
    prompt: {
      en: "I've had a long day. Send Joe a WhatsApp telling him I'll call tonight.",
      sn: 'Ndanhaka zuva. Tumira Joe meseji yeWhatsApp kuti ndichamufonera manheru.',
      nd: 'Usuku lube lude. Thumela uJoe umlayezo we-WhatsApp uthi ngizomshayela ebusuku.',
      sw: 'Nimekuwa na siku ndefu. Mtumie Joe WhatsApp kwamba nitampigia usiku.',
    },
  },
  {
    id: 'what-can-you-do',
    titleKey: 'demo.help',
    prompt: {
      en: 'Hey Pal, what can you do?',
      sn: 'Hey Pal, unogona chii?',
      nd: 'Hey Pal, yini ongayisiza?',
      sw: 'Hey Pal, unaweza kufanya nini?',
    },
  },
];

export function getStarterPrompts(language: LanguageCode) {
  return STARTERS.map((starter) => ({
    id: starter.id,
    title: t(starter.titleKey, language),
    prompt: starter.prompt[language] ?? starter.prompt.en,
  }));
}

export function getDemoScenarios(language: LanguageCode) {
  return getStarterPrompts(language).map((starter) => ({
    id: starter.id,
    title: starter.title,
    turns: [starter.prompt],
  }));
}
