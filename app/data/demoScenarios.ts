import type { LanguageCode } from '../lib/types';
import { t } from '../lib/i18n/t';

export interface DemoScenario {
  id: string;
  titleKey: string;
  turns: Record<LanguageCode, string[]>;
}

const SCENARIOS: DemoScenario[] = [
  {
    id: 'open-whatsapp',
    titleKey: 'demo.openWhatsapp',
    turns: {
      en: ['Hey Pal, open WhatsApp.'],
      sn: ['Hey Pal, vhura WhatsApp.'],
      nd: ['Hey Pal, vula iWhatsApp.'],
      sw: ['Hey Pal, fungua WhatsApp.'],
    },
  },
  {
    id: 'message-joe',
    titleKey: 'demo.messageJoe',
    turns: {
      en: ['Send Joe a message.', "Tell him I'll call him later.", 'Yes.'],
      sn: ['Tumira meseji kuna Joe.', 'Muudze kuti ndichamufonera gare gare.', 'Hongu.'],
      nd: ['Thumela umlayezo kuJoe.', 'Mtshele ukuthi ngizomshayela kamuva.', 'Yebo.'],
      sw: ['Mtumie Joe ujumbe.', 'Mwambie nitampigia baadaye.', 'Ndiyo.'],
    },
  },
  {
    id: 'send-money',
    titleKey: 'demo.sendMoney',
    turns: {
      en: ['Hey Pal, send $20 to Wisdom.', 'Yes.', 'Allow.', 'Confirm.'],
      sn: ['Hey Pal, ndoda kutumira $20 kuna Wisdom.', 'Hongu.', 'Bvuma.', 'Hongu.'],
      nd: ['Hey Pal, ngifuna ukuthumela u-$20 kuWisdom.', 'Yebo.', 'Vumela.', 'Yebo.'],
      sw: ['Hey Pal, nataka kutuma dola 20 kwa Wisdom.', 'Ndiyo.', 'Ruhusu.', 'Ndiyo.'],
    },
  },
  {
    id: 'buy-airtime',
    titleKey: 'demo.airtime',
    turns: {
      en: ['I need airtime.', 'Five dollars.', 'Yes.'],
      sn: ['Ndoda kutenga airtime.', 'Madhora mashanu.', 'Hongu.'],
      nd: ['Ngifuna ukuthenga i-airtime.', 'Amadola amahlanu.', 'Yebo.'],
      sw: ['Nataka kununua airtime.', 'Dola tano.', 'Ndiyo.'],
    },
  },
  {
    id: 'call-tendai',
    titleKey: 'demo.call',
    turns: {
      en: ['Call Tendai.', 'Yes.'],
      sn: ['Fonera Tendai.', 'Hongu.'],
      nd: ['Fowunela uTendai.', 'Yebo.'],
      sw: ['Mpigie Tendai simu.', 'Ndiyo.'],
    },
  },
  {
    id: 'check-balance',
    titleKey: 'demo.balance',
    turns: {
      en: ['What is my balance?'],
      sn: ['Mari yangu yakawanda sei?'],
      nd: ['Ibhalansi yami ingakanani?'],
      sw: ['Salio langu ni kiasi gani?'],
    },
  },
  {
    id: 'check-time',
    titleKey: 'demo.time',
    turns: {
      en: ['What time is it?'],
      sn: ['Nguvai?'],
      nd: ['Kungasikhathi bani?'],
      sw: ['Ni saa ngapi?'],
    },
  },
  {
    id: 'set-alarm',
    titleKey: 'demo.alarm',
    turns: {
      en: ['Set an alarm for 6 AM.'],
      sn: ['Gadzira alarm ye6 AM.'],
      nd: ['Misa i-alamu ngo-6 AM.'],
      sw: ['Weka kengele saa 6 asubuhi.'],
    },
  },
  {
    id: 'conversation',
    titleKey: 'demo.conversation',
    turns: {
      en: ['This platform is really beautiful.', 'What makes you different from Siri?'],
      sn: ['Iyi platform yakanaka chaizvo.', 'Chii chinokusiyanisa naSiri?'],
      nd: ['Le platform yinhle impela.', 'Yini ekuhlukanisa noSiri?'],
      sw: ['Jukwaa hili ni zuri sana.', 'Nini kinakutofautisha na Siri?'],
    },
  },
  {
    id: 'why-accesspal',
    titleKey: 'demo.why',
    turns: {
      en: ['Why do I need AccessPal?'],
      sn: ['Sei ndichida AccessPal?'],
      nd: ['Kungani ngidinga i-AccessPal?'],
      sw: ['Kwa nini nahitaji AccessPal?'],
    },
  },
  {
    id: 'what-can-you-do',
    titleKey: 'demo.help',
    turns: {
      en: ['Hey Pal, what can you do?'],
      sn: ['Hey Pal, unogona chii?'],
      nd: ['Hey Pal, yini ongayisiza?'],
      sw: ['Hey Pal, unaweza kufanya nini?'],
    },
  },
  {
    id: 'multilingual',
    titleKey: 'demo.multilingual',
    turns: {
      en: ['Send $20 to Wisdom.', 'Yes.', 'Allow.', 'Confirm.'],
      sn: ['Ndoda kutumira $20 kuna Wisdom.', 'Hongu.', 'Bvuma.', 'Hongu.'],
      nd: ['Ngifuna ukuthumela u-$20 kuWisdom.', 'Yebo.', 'Vumela.', 'Yebo.'],
      sw: ['Nataka kutuma dola 20 kwa Wisdom.', 'Ndiyo.', 'Ruhusu.', 'Ndiyo.'],
    },
  },
];

export function getDemoScenarios(language: LanguageCode) {
  return SCENARIOS.map((scenario) => ({
    id: scenario.id,
    title: t(scenario.titleKey, language),
    turns: scenario.turns[language] ?? scenario.turns.en,
  }));
}

export type PlayableDemo = ReturnType<typeof getDemoScenarios>[number];
