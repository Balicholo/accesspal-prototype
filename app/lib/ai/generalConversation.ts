import { ACCESSPAL_SYSTEM_INSTRUCTIONS } from './system-prompt';
import { normalizeText } from '../format';
import type { LanguageCode } from '../types';

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

/**
 * Meaning-based general conversation. Topics and sentiment are inferred;
 * replies are composed from knowledge, not exact phrase catalogs.
 */
export class GeneralConversation {
  static readonly instructions = ACCESSPAL_SYSTEM_INSTRUCTIONS;
  private history: ChatTurn[] = [];
  private lastTopic: string | null = null;

  reset() {
    this.history = [];
    this.lastTopic = null;
  }

  remember(role: ChatTurn['role'], text: string) {
    this.history.push({ role, text });
    if (this.history.length > 12) this.history = this.history.slice(-12);
  }

  reply(text: string, language: LanguageCode): string {
    const meaning = interpret(text, this.lastTopic);
    this.lastTopic = meaning.topic ?? this.lastTopic;
    const spoken = compose(meaning, language, this.history);
    this.remember('user', text);
    this.remember('assistant', spoken);
    return spoken;
  }
}

type Topic =
  | 'accesspal'
  | 'accessibility'
  | 'zimbabwe'
  | 'technology'
  | 'ai'
  | 'pitch'
  | 'weather'
  | 'capabilities'
  | 'purpose'
  | 'africa'
  | 'general';

interface Meaning {
  kind: 'compliment' | 'thanks' | 'question' | 'followup' | 'statement';
  topic: Topic;
  aboutSelf: boolean;
}

function interpret(text: string, previous: string | null): Meaning {
  const n = normalizeText(text);
  const followup = /^(what about|and the|tell me more|how about|what else)\b/.test(n);
  const question = /\?$/.test(text.trim()) || /^(what|why|how|who|where|when|can you|do you|tell me)\b/.test(n);
  const compliment =
    (
      /(beautiful|impressive|amazing|great|love this|awesome|wonderful|nice|clean|smooth|yakanaka|yinhle|ni zuri)/.test(n) &&
      /(this|platform|app|design|interface|experience|you|iyi|le |jukwaa|hili)/.test(n)
    );
  const thanks = /^(thanks|thank you|ndatenda|tatenda)/.test(n);

  let topic: Topic = followup && previous ? (previous as Topic) : 'general';
  if (/(what can you do|how can you help|your features|capabilities|unogona chii|yini ongayisiza|unaweza kufanya nini)/.test(n)) topic = 'capabilities';
  else if (/(accesspal|this platform|this app|this prototype|your design|interface)/.test(n)) topic = 'accesspal';
  else if (/(accessib|inclusion|visually impaired|disability)/.test(n)) topic = 'accessibility';
  else if (/(zimbabwe|harare|harare)/.test(n) || (followup && previous === 'zimbabwe')) topic = 'zimbabwe';
  else if (/(technology sector|tech sector|startups|innovation)/.test(n)) {
    topic = previous === 'zimbabwe' || n.includes('zimbabwe') ? 'zimbabwe' : 'technology';
    if (previous === 'zimbabwe') topic = 'zimbabwe';
  }
  else if (/\bai\b|artificial intelligence|machine learning/.test(n)) topic = 'ai';
  else if (/(presentation|pitch|opening line|demo)/.test(n)) topic = 'pitch';
  else if (/(weather|temperature)/.test(n)) topic = 'weather';
  else if (/(siri|why do i need|why accesspal|what makes you different|sei ndichida|kungani ngidinga|kwa nini nahitaji)/.test(n)) topic = 'purpose';
  else if (/(africa|african)/.test(n)) topic = 'africa';

  if (followup && previous === 'zimbabwe' && /technolog|sector|startup/.test(n)) {
    return { kind: 'followup', topic: 'zimbabwe', aboutSelf: false };
  }

  const kind = thanks
    ? 'thanks'
    : compliment
      ? 'compliment'
      : followup
        ? 'followup'
        : question
          ? 'question'
          : 'statement';

  return { kind, topic, aboutSelf: /(you|your|accesspal)/.test(n) };
}

function compose(meaning: Meaning, language: LanguageCode, history: ChatTurn[]): string {
  const follow = meaning.kind === 'followup';
  const en = english(meaning, follow, history);
  if (language === 'sn') return shona(meaning, en);
  if (language === 'nd') return ndebele(meaning, en);
  if (language === 'sw') return swahili(meaning, en);
  return en;
}

function english(meaning: Meaning, follow: boolean, history: ChatTurn[]): string {
  if (meaning.kind === 'compliment' && meaning.topic === 'accesspal') {
    return "Thank you! I'm glad you like it. I'm designed to make interacting with your phone simpler and more accessible.";
  }
  if (meaning.kind === 'compliment') {
    return "Thank you! I'm still learning, but that's exactly the kind of experience I'm designed to provide.";
  }
  if (meaning.kind === 'thanks') {
    return "You're welcome. I'm here whenever you need me.";
  }

  switch (meaning.topic) {
    case 'capabilities':
      return "I can help you control your phone using your voice — like sending messages, making calls, checking the time, managing airtime, and accessing services such as EcoCash. I can also have a conversation with you and help answer questions.";
    case 'accessibility':
      return "Accessibility is important because too many people are shut out by screens, language, and interfaces that assume everyone can tap quickly. Voice-first tools let someone speak in the language they already use and still get things done.";
    case 'zimbabwe':
      return follow
        ? "Zimbabwe's technology sector has grown around mobile money, local startups, and young builders in Harare and beyond. EcoCash became everyday infrastructure, so an assistant here has to understand local payments, not just global apps."
        : "Zimbabwe sits at the heart of Southern Africa, with a strong culture of making plans work through community, language, and mobile money. Harare is a lively capital, and people move fluidly between English, Shona, and Ndebele in the same conversation.";
    case 'technology':
      return "Technology is most useful when it fits how people already live. In this region that often means mobile-first tools, local languages, and financial services that work over a phone.";
    case 'ai':
      return "Artificial intelligence is software that can interpret language, spot patterns, and help with tasks. The important part is that it should stay under the user's control, explain what it's doing, and never pretend a simulation is a real payment.";
    case 'pitch':
      return history.some((turn) => /opening line/.test(normalizeText(turn.text)))
        ? 'A strong opening is: "What if using a phone only required your voice, in the language you already speak?" Then show, don\'t tell — open WhatsApp without touching the screen.'
        : "If you're preparing for a presentation, lead with the feeling: someone who cannot see the screen still sends money, messages, and checks the time. Then demonstrate it live so the audience hears and sees the difference.";
    case 'weather':
      return "I don't have a live weather feed in this prototype, but I can still help you get ready — messages, calls, airtime, or EcoCash — while you check the sky yourself.";
    case 'purpose':
      return "I'm designed to make mobile technology more accessible by supporting African languages, local financial services, and people who are often left out by mainstream assistants. You speak; the phone responds.";
    case 'africa':
      return "Accessibility in Africa is not a copy of somewhere else. People already mix languages, use mobile money, and share phones. An assistant that ignores that will always feel foreign — and that's why AccessPal is built for conversation, not menus.";
    case 'accesspal':
      return "I'm AccessPal — a voice layer for the phone, built for inclusion. You can ask me to do things, or we can just talk.";
    default:
      if (meaning.kind === 'question') {
        return "That's a fair question. I may not have every fact on hand, but I can think it through with you, or help you do something on this phone.";
      }
      const lastUser = history.filter((turn) => turn.role === 'user').slice(-1)[0]?.text ?? '';
      if (/(excit|prepar|nervous|ready)/.test(normalizeText(lastUser))) {
        return "That sounds like a good moment. I can help you rehearse, send a message, or just talk it through until you feel ready.";
      }
      return "I'm with you. Tell me more, or ask me to do something on the phone whenever you're ready.";
  }
}

function shona(meaning: Meaning, fallback: string): string {
  if (meaning.kind === 'compliment') {
    return 'Ndinotenda. Ndinofara kuti zviri kukufadza. Ndakagadzirirwa kuti utauge nhare yako nenzwi rako.';
  }
  if (meaning.topic === 'purpose') {
    return 'Ndakagadzirirwa kuti nhare ishande nenzwi, nemitauro yeAfrica, nemari yemuno — kunyanya kune vanhu vanosara kunze kwezvikurukurirano zveSiri nezvimwe.';
  }
  if (meaning.topic === 'capabilities') {
    return 'Ndinogona kukubatsira kushandisa nhare nenzwi — kutumira meseji, kufona, nguva, airtime, uye EcoCash. Tinogona kutaura zvakare.';
  }
  if (meaning.topic === 'zimbabwe') {
    return 'Zimbabwe inyika ine mitauro yakawanda, mobile money, uye vanhu vanotaura ChiShona, isiNdebele, neChirungu mumhiko imwe chete.';
  }
  return fallback;
}

function ndebele(meaning: Meaning, fallback: string): string {
  if (meaning.kind === 'compliment') {
    return 'Ngiyabonga. Ngiyajabula ukuthi uyathanda. Ngenzelwe ukuthi usebenzise ifoni ngezwi lakho.';
  }
  if (meaning.topic === 'purpose') {
    return 'Ngenzelwe ukwenza ifoni isebenze ngezwi, ngezilimi zase-Afrika, nangezinsiza zemali zasendaweni, ikakhulukazi kubantu abavame ukushiywa yizinsiza ezifana noSiri.';
  }
  if (meaning.topic === 'capabilities') {
    return 'Ngingakusiza uthumele imilayezo, ushaye ucingo, ubheke isikhathi, uthenge i-airtime, uthumele imali nge-EcoCash, futhi sikhulume.';
  }
  return fallback;
}

function swahili(meaning: Meaning, fallback: string): string {
  if (meaning.kind === 'compliment') {
    return 'Asante. Nafurahi unapenda. Nimetengenezwa kukusaidia kutumia simu kwa sauti yako.';
  }
  if (meaning.topic === 'purpose') {
    return 'Nimetengenezwa kufanya simu ifikike kwa sauti, kwa lugha za Afrika, na kwa huduma za fedha za hapa — hasa kwa watu ambao wasaidizi kama Siri mara nyingi hawawahudumii.';
  }
  if (meaning.topic === 'capabilities') {
    return 'Naweza kukusaidia kutuma ujumbe, kupiga simu, kusema saa, kununua airtime, kutuma pesa kwa EcoCash, na kuzungumza nawe.';
  }
  return fallback;
}

export function isClearlyGeneral(text: string): boolean {
  const n = normalizeText(text);
  if (
    /(beautiful|impressive|amazing|weather|zimbabwe|accessib|artificial intelligence|presentation|opening line|technology sector|africa|thank you|what do you think|excited|preparing|siri|why do i need|why accesspal)/.test(
      n
    )
  ) {
    return true;
  }
  return /^(what|why|how|tell me about|explain)\b/.test(n) && !/(time|whatsapp|ecocash|airtime|message|call|open)\b/.test(n);
}

export const generalConversation = new GeneralConversation();
