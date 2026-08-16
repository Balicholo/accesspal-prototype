import { normalizeText } from '../format';
import { extractAmount } from '../nlu/numbers';
import { contactsService } from '../services/contacts';
import { isCancelMeaning, isConfirmMeaning, isCorrectMeaning } from '../tasks/dialogueActs';
import { extractMentionedPerson } from './entities';
import { resolveApp } from './tools';
import type { AppId } from '../phone/types';
import type { Contact } from '../types';

export type DialogueAct =
  | 'inform'
  | 'confirm'
  | 'allow'
  | 'deny'
  | 'cancel'
  | 'correct'
  | 'wake';

export interface UtteranceFeatures {
  raw: string;
  text: string;
  act: DialogueAct;
  amount?: number;
  contact?: Contact;
  contactOptions?: Contact[];
  contactQuery?: string;
  message?: string;
  app?: AppId;
  wantsHome: boolean;
  wantsEndCall: boolean;
  wantsTime: boolean;
  wantsBalance: boolean;
  wantsHelp: boolean;
  wantsOpen: boolean;
  wantsMessage: boolean;
  wantsAirtime: boolean;
  wantsCall: boolean;
  wantsMoney: boolean;
  wantsAlarm: boolean;
  wantsWeather: boolean;
  wantsCalendar: boolean;
  wantsReminder: boolean;
  wantsBiggerText: boolean;
  wantsSlowerVoice: boolean;
  alarmTime?: string;
  isDeviceRequest: boolean;
  isCorrection: boolean;
  phoneNumber?: string;
}

const CONFIRM = [
  'yes',
  'yeah',
  'yep',
  'yup',
  'sure',
  'ok',
  'okay',
  'continue',
  'proceed',
  'go ahead',
  'do it',
  'please do',
  'thats fine',
  "that's fine",
  'confirm',
  'hongu',
  'ehe',
  'ehee',
  'ndizvo',
  'ndizvozvo',
  'yebo',
  'sawa',
  'ndiyo',
];

const ALLOW = ['allow', 'permit', 'grant', 'accept', 'bvuma', 'vumela', 'ruhusu'];

const CANCEL = [
  'cancel',
  'stop',
  'never mind',
  'nevermind',
  'forget it',
  'abort',
  'dont do it',
  "don't do it",
  'wait',
  'rega',
  'regedza',
  'ghairi',
];

const DENY = ['no', 'nope', 'not now', 'kwete', 'hayi', 'hapana'];

export function extractFeatures(raw: string): UtteranceFeatures {
  const text = normalizeText(raw);
  const amount = extractAmount(raw);
  const contactQuery = extractMentionedPerson(raw) ?? extractLegacyContact(raw);
  const resolved = contactQuery ? contactsService.resolve(contactQuery) : {};
  const message = extractMessageBody(raw);
  const app = resolveApp(text);
  const wantsHome = isHome(text);
  const wantsEndCall = isEndCall(text);
  const wantsTime = isTime(text);
  const wantsBalance = isBalance(text);
  const wantsHelp = isHelp(text);
  const wantsOpen = isOpen(text) || Boolean(app && isOpen(text));
  const wantsMessage = isMessage(text);
  const wantsMoney = isMoney(text);
  const wantsAirtime = isAirtime(text);
  const wantsCall = isCall(text);
  const wantsAlarm = isAlarm(text);
  const wantsWeather = isWeather(text);
  const wantsCalendar = isCalendar(text);
  const wantsReminder = isReminder(text);
  const wantsBiggerText = isBiggerText(text);
  const wantsSlowerVoice = isSlowerVoice(text);
  const isCorrection = isCorrectionPhrase(text);

  return {
    raw,
    text,
    act: classifyAct(text, isCorrection),
    amount,
    contact: resolved.match,
    contactOptions: resolved.options,
    contactQuery,
    message,
    app,
    wantsHome,
    wantsEndCall,
    wantsTime,
    wantsBalance,
    wantsHelp,
    wantsOpen,
    wantsMessage,
    wantsMoney,
    wantsAirtime,
    wantsCall,
    wantsAlarm,
    wantsWeather,
    wantsCalendar,
    wantsReminder,
    wantsBiggerText,
    wantsSlowerVoice,
    alarmTime: wantsAlarm ? extractAlarmTime(raw) : undefined,
    isDeviceRequest:
      wantsHome ||
      wantsEndCall ||
      wantsTime ||
      wantsBalance ||
      wantsHelp ||
      wantsOpen ||
      wantsMessage ||
      wantsMoney ||
      wantsAirtime ||
      wantsCall ||
      wantsAlarm ||
      wantsReminder ||
      wantsBiggerText ||
      wantsSlowerVoice,
    isCorrection,
    phoneNumber: extractPhone(raw),
  };
}

function classifyAct(text: string, correction: boolean): DialogueAct {
  if (!text) return 'inform';
  if (ALLOW.some((phrase) => text === phrase || text.startsWith(`${phrase} `))) {
    return 'allow';
  }
  if (isCancelMeaning(text) || CANCEL.some((phrase) => text.includes(phrase))) {
    return 'cancel';
  }
  if (DENY.some((phrase) => text === phrase)) return 'deny';
  if (correction || isCorrectMeaning(text)) return 'correct';
  if (
    isConfirmMeaning(text) ||
    CONFIRM.some((phrase) => text === phrase || text === `${phrase} please`)
  ) {
    return 'confirm';
  }
  return 'inform';
}

function extractLegacyContact(text: string): string | undefined {
  const named = contactsService
    .list()
    .flatMap((contact) => [contact.name, ...contact.aliases])
    .sort((a, b) => b.length - a.length);

  const normalized = normalizeText(text);
  for (const name of named) {
    if (normalized.includes(normalizeText(name))) return name;
  }
  return undefined;
}

export function extractMessageBody(text: string): string | undefined {
  const cleaned = text
    .replace(
      /^(hey|okay|ok|hi|yo|a)?\s*(access\s*)?(pal|paul|pearl|pell|accesspal)\b[,.]?\s*/i,
      ''
    )
    .trim();
  const patterns = [
    /let [A-Za-z']+ know(?: that)?\s+(.+)/i,
    /saying\s+["“]?(.+?)["”]?$/i,
    /tell (?:him|her|them|[A-Za-z']+)\s+(?:that\s+)?(.+)/i,
    /say (?:to (?:him|her|them|[A-Za-z]+)\s+)?["“]?(.+?)["”]?$/i,
    /(?:message|text|sms)(?:\s+to)?\s+(?:him|her|them|[A-Za-z]+)\s+(?:and\s+)?(?:tell him\s+|say(?:ing)?\s+)(.+)/i,
    /and tell (?:him|her|them)\s+(.+)/i,
    /change (?:the )?(?:message|text) to (.+)/i,
    /make (?:the message|it) (.+)/i,
    /kuti\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    const body = match?.[1]?.trim();
    if (body && body.length > 1 && !/^(a message|him|her|them)$/i.test(body)) {
      return body.replace(/^that\s+/i, '').replace(/[.?]+$/, '').trim();
    }
  }
  return undefined;
}

function isCorrectionPhrase(text: string) {
  if (
    text.includes('make it') ||
    text.includes('instead') ||
    text.includes('change it') ||
    text.includes('change that')
  ) {
    return true;
  }
  return (
    text.includes('actually') &&
    (Boolean(extractAmount(text)) || Boolean(extractMentionedPerson(text)))
  );
}

function isHome(text: string) {
  return (
    text.includes('go home') ||
    text.includes('home screen') ||
    text.includes('go back home') ||
    text.includes('dzokera kumba') ||
    text === 'home'
  );
}

function isEndCall(text: string) {
  return (
    text.includes('end call') ||
    text.includes('hang up') ||
    text.includes('cut the call') ||
    text.includes('pedza foni')
  );
}

function isTime(text: string) {
  return (
    text.includes('what time') ||
    text.includes('the time') ||
    text.includes('current time') ||
    text.includes('kuziva nguva') ||
    text.includes('ndinoda kuziva nguva') ||
    /\bnguva yava\b/.test(text) ||
    (text.includes('nguva') && (text.includes('ndinoda') || text.includes('kuziva') || text.includes('what'))) ||
    text.includes('isikhathi') ||
    text.includes('saa ngapi') ||
    text === 'nguvai' ||
    text.includes('nguvai') ||
    text.includes('kungasikhathi')
  );
}

function isBalance(text: string) {
  return (
    text.includes('balance') ||
    text.includes('how much money') ||
    text.includes('how much do i have') ||
    text.includes('mari yasara') ||
    text.includes('mari yangu') ||
    text.includes('what is my balance') ||
    text.includes('ibhalansi') ||
    text.includes('salio')
  );
}

function isHelp(text: string) {
  return (
    text.includes('what can you do') ||
    text.includes('how can you help') ||
    text.includes('unogona chii') ||
    text.includes('yini ongayisiza') ||
    text.includes('unaweza kufanya nini') ||
    text === 'help'
  );
}

function isOpen(text: string) {
  return (
    text.includes('open') ||
    text.includes('launch') ||
    text.includes('take me to') ||
    text.includes('can you open') ||
    text.includes('please open') ||
    text.includes('vhura') ||
    text.includes('vula') ||
    text.includes('fungua')
  );
}

function isMessage(text: string) {
  if (isOpen(text)) return false;
  if (/\btell me\b/.test(text) || text.includes('tell me about')) return false;
  return (
    text.includes('message') ||
    text.includes('text ') ||
    text.startsWith('text') ||
    text.includes('tell him') ||
    text.includes('tell her') ||
    (/\btell\s+[a-z']+\b/.test(text) && !/\btell me\b/.test(text)) ||
    /\blet\s+[a-z']+\s+know\b/.test(text) ||
    text.includes('meseji') ||
    text.includes('umlayezo') ||
    text.includes('ujumbe') ||
    text.includes('kutumira message')
  );
}

function isMoney(text: string) {
  if (isMessage(text) && !/(mari|money|dollar|ecocash|kutumira|transfer)/.test(text)) {
    return false;
  }
  return (
    text.includes('send money') ||
    text.includes('send some money') ||
    text.includes('help me send') ||
    text.includes('transfer') ||
    text.includes('kutumira') ||
    text.includes('ndoda kutumira') ||
    text.includes('ndinoda kutumira') ||
    text.includes('tumira') ||
    text.includes('madhora') ||
    text.includes('ecocash') ||
    text.includes('innbucks') ||
    text.includes('thumela') ||
    text.includes('kutuma pesa') ||
    /\bsend\s+\$/.test(text) ||
    /\bsend\s+\d/.test(text) ||
    text.includes('send $') ||
    (text.includes('send') &&
      (text.includes('dollar') ||
        text.includes('mari') ||
        text.includes('money') ||
        Boolean(extractAmount(text))))
  );
}

function isAirtime(text: string) {
  return (
    text.includes('airtime') ||
    text.includes('recharge') ||
    text.includes('top up') ||
    text.includes('kutenga airtime')
  );
}

function isCall(text: string) {
  if (
    text.includes('tell him') ||
    text.includes('tell her') ||
    text.includes('message') ||
    text.includes('i ll call') ||
    text.includes('ill call')
  ) {
    return /\b(call|fonera|kufona|piga simu)\b/.test(text) && !text.includes('tell');
  }
  return (
    /\bcall\b/.test(text) ||
    text.includes('dial') ||
    text.includes('fonera') ||
    text.includes('kufona') ||
    text.includes('piga simu') ||
    text.includes('shaya ucingo')
  );
}

function isAlarm(text: string) {
  return (
    text.includes('alarm') ||
    text.includes('wake me') ||
    text.includes('alamu') ||
    text.includes('kengele') ||
    text.includes('gadzira alarm') ||
    text.includes('misa i-alamu') ||
    text.includes('weka kengele')
  );
}

function isWeather(text: string) {
  return (
    text.includes('weather') ||
    text.includes('temperature') ||
    text.includes('forecast') ||
    text.includes('mamiriro') ||
    /\b(sunny|raining|rain|hot outside)\b/.test(text)
  );
}

function isCalendar(text: string) {
  return (
    text.includes('calendar') ||
    text.includes('what\'s on my calendar') ||
    text.includes('whats on my calendar') ||
    text.includes('my schedule') ||
    text.includes('my events') ||
    text.includes('meetings today') ||
    text.includes('what do i have today')
  );
}

function isReminder(text: string) {
  return (
    text.includes('remind me') ||
    text.includes('set a reminder') ||
    text.includes('create a reminder') ||
    text.includes('reminder for')
  );
}

function isBiggerText(text: string) {
  return (
    text.includes('text bigger') ||
    text.includes('bigger text') ||
    text.includes('increase text') ||
    text.includes('make the text') ||
    text.includes('font bigger') ||
    text.includes('mavara makuru') ||
    text.includes('umbhalo omkhulu') ||
    text.includes('maandishi makubwa')
  );
}

function isSlowerVoice(text: string) {
  return (
    text.includes('slow down') ||
    text.includes('speak slower') ||
    text.includes('slower voice') ||
    text.includes('voice slower') ||
    text.includes('taura zvinyoronyoro') ||
    text.includes('khuluma kancane') ||
    text.includes('zungumza polepole')
  );
}

function extractAlarmTime(text: string) {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return '6:00 AM';
  const hour = Number(match[1]);
  const minute = match[2] ?? '00';
  const period = (match[3] ?? (hour < 12 ? 'AM' : 'PM')).toUpperCase();
  return `${hour}:${minute} ${period}`;
}

function extractPhone(text: string): string | undefined {
  const match = text.match(/(\+?\d[\d\s-]{6,}\d)/);
  return match?.[1]?.replace(/\s+/g, ' ').trim();
}
