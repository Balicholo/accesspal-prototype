import { firstName, formatMoney } from '../format';
import { getLanguage } from '../i18n/languages';
import type { LanguageCode } from '../types';

export type ReplyAct =
  | { type: 'wake' }
  | { type: 'opening_app'; name: string }
  | { type: 'app_opened'; name: string }
  | { type: 'go_home' }
  | { type: 'ask_message'; name: string }
  | { type: 'confirm_message'; name: string; message: string }
  | { type: 'message_sent'; name: string }
  | { type: 'chat_opened'; name: string }
  | { type: 'ask_recipient'; kind: 'send' | 'call' | 'message' }
  | { type: 'contact_not_found'; query: string }
  | { type: 'unsaved_send'; amount: number; name: string; method: string }
  | { type: 'heard_confirm'; amount: number; name: string }
  | { type: 'clarify_contact'; options: string[] }
  | { type: 'ask_amount'; kind: 'send' | 'airtime'; name?: string }
  | { type: 'confirm_send'; amount: number; name: string; method: string }
  | { type: 'need_permission' }
  | { type: 'confirm_transaction'; amount: number; name: string }
  | { type: 'processing' }
  | { type: 'sent'; amount: number; name: string; balance: number }
  | { type: 'confirm_airtime'; amount: number }
  | { type: 'airtime_done'; amount: number }
  | { type: 'confirm_call'; name: string }
  | { type: 'calling'; name: string }
  | { type: 'call_ended'; name: string }
  | { type: 'time'; time: string }
  | { type: 'balance'; balance: number }
  | { type: 'cannot_afford'; amount: number; balance: number }
  | { type: 'cancel'; hadPending: boolean; kind?: string }
  | { type: 'language_switched'; language: LanguageCode }
  | { type: 'help' }
  | { type: 'unknown' }
  | { type: 'empty' }
  | { type: 'alarm_set'; time: string }
  | { type: 'text_larger' }
  | { type: 'voice_slower' };

type Lines = Record<ReplyAct['type'], (act: any) => string>;

const EN: Lines = {
  wake: () => 'Yes?',
  opening_app: ({ name }) => `Opening ${name}.`,
  app_opened: ({ name }) => `${name} is open.`,
  go_home: () => 'Going home.',
  ask_message: ({ name }) => `Sure. What would you like me to tell ${firstName(name)}?`,
  confirm_message: ({ name, message }) =>
    `You're sending ${firstName(name)}: '${message}'. Should I send it?`,
  message_sent: ({ name }) => `Done. Your message has been sent to ${firstName(name)}.`,
  chat_opened: ({ name }) => `${firstName(name)}'s conversation is open.`,
  ask_recipient: ({ kind }) =>
    kind === 'call'
      ? 'Who would you like me to call?'
      : kind === 'message'
        ? 'Who would you like to send it to?'
        : 'Sure. Who would you like to send it to?',
  contact_not_found: ({ query }) =>
    `I don't have ${query} saved in your contacts yet. For this prototype I'll use the recipient you provided.`,
  unsaved_send: ({ amount, name, method }) =>
    `I don't have ${name} in your saved contacts, but I understand you want to send ${formatMoney(amount, 2)} to ${name} using ${method}. I'll continue with that.`,
  heard_confirm: ({ amount, name }) =>
    `I heard that you want to send ${formatMoney(amount, 2)} to ${name}. Is that correct?`,
  clarify_contact: ({ options }) =>
    `I found more than one match: ${joinOr(options)}. Who do you mean?`,
  ask_amount: ({ kind, name }) =>
    kind === 'airtime'
      ? 'Sure. How much airtime would you like to buy?'
      : name
        ? `How much would you like to send to ${firstName(name)}?`
        : 'How much would you like to send?',
  confirm_send: ({ amount, name, method }) =>
    `I found ${name}. You're sending ${formatMoney(amount, 2)} using ${method}. Would you like me to continue?`,
  need_permission: () => 'I need your permission to continue.',
  confirm_transaction: ({ amount, name }) =>
    `Please confirm: send ${formatMoney(amount, 2)} to ${name}.`,
  processing: () => "Alright. I'm processing that now.",
  sent: ({ amount, name, balance }) =>
    `Done. ${formatMoney(amount, 2)} has been sent to ${name}. Your new balance is ${formatMoney(balance, 2)}.`,
  confirm_airtime: ({ amount }) =>
    `Sure. Would you like to buy ${formatMoney(amount)} of airtime?`,
  airtime_done: ({ amount }) =>
    `Done. I've purchased ${formatMoney(amount)} of airtime.`,
  confirm_call: ({ name }) => `I'll call ${name}. Would you like me to continue?`,
  calling: ({ name }) => `Calling ${name} now.`,
  call_ended: ({ name }) => `I've ended the call with ${name}.`,
  time: ({ time }) => `It's ${time}.`,
  balance: ({ balance }) => `Your current balance is ${formatMoney(balance, 2)}.`,
  cannot_afford: ({ amount, balance }) =>
    `You currently have ${formatMoney(balance, 2)} available, so I can't send ${formatMoney(amount, 2)}.`,
  cancel: ({ hadPending, kind }) =>
    kind === 'send_message'
      ? "Okay, I won't send it."
      : hadPending
        ? "Okay, I won't do that."
        : 'No problem.',
  language_switched: ({ language }) =>
    language === 'en'
      ? "Okay. We'll continue in English."
      : `Okay. Switching to ${getLanguage(language).name}.`,
  help: () =>
    'I can open apps, send messages, make calls, check the time, send money, or buy airtime. Just tell me what you need.',
  unknown: () =>
    "I can help you use this phone. Try asking me to open an app, send a message, call someone, check the time, or send money.",
  empty: () => "Sorry, I didn't catch that.",
  alarm_set: ({ time }) => `I've set an alarm for ${time}.`,
  text_larger: () => "I've made the text larger.",
  voice_slower: () => "I'll speak more slowly.",
};

const SN: Lines = {
  wake: () => 'Hongu, ndiri kunzwa.',
  opening_app: ({ name }) => `Ndiri kuvhura ${name}.`,
  app_opened: ({ name }) => `${name} yavhurwa.`,
  go_home: () => 'Ndiri kudzokera kumba.',
  ask_message: ({ name }) => `Zvakanaka. Unoda kuti nditaure chii kuna ${firstName(name)}?`,
  confirm_message: ({ name, message }) =>
    `Ndichatumira kuna ${firstName(name)}: '${message}' Nditumire here?`,
  message_sent: ({ name }) => `Zvaita. Ndakatumira meseji kuna ${firstName(name)}.`,
  chat_opened: ({ name }) => `Hurukuro ya${firstName(name)} yavhurwa.`,
  ask_recipient: ({ kind }) =>
    kind === 'call'
      ? 'Unoda kufonera ani?'
      : kind === 'message'
        ? 'Unoda kutumira meseji kuna ani?'
        : 'Zvakanaka. Unoda kutumira kuna ani?',
  contact_not_found: ({ query }) =>
    `Handina kuwana ${query} muma contacts. Asi ndanzwisisa kuti unoda kutumira kuna ${query}.`,
  unsaved_send: ({ amount, name, method }) =>
    `Handina ${name} muma contacts, asi ndanzwisisa kuti unoda kutumira ${formatMoney(amount, 2)} kuna ${name} ne${method}. Ndoenderera mberi.`,
  heard_confirm: ({ amount, name }) =>
    `Ndanunzwa kuti unoda kutumira ${formatMoney(amount, 2)} kuna ${name}. Ndizvo here?`,
  clarify_contact: ({ options }) =>
    `Ndawana mazita anofanana: ${joinOr(options)}. Unoreva ani?`,
  ask_amount: ({ kind, name }) =>
    kind === 'airtime'
      ? 'Zvakanaka. Unoda kutenga airtime yemarii?'
      : name
        ? `Zvakanaka. Unoda kutumira marii kuna ${firstName(name)}?`
        : 'Zvakanaka. Unoda kutumira marii?',
  confirm_send: ({ amount, name, method }) =>
    `Zvakanaka. Unoda kutumira ${formatMoney(amount, 2)} kuna ${name} ne${method}. Ndoenderera mberi here?`,
  need_permission: () => 'Ndinoda mvumo yako kuti ndiende mberi.',
  confirm_transaction: ({ amount, name }) =>
    `Ndapota confirm: tumira ${formatMoney(amount, 2)} kuna ${name}.`,
  processing: () => 'Zvakanaka. Ndiri kutanga transaction yako.',
  sent: ({ amount, name }) =>
    `Zvaita. ${formatMoney(amount, 2)} yatumirwa kuna ${name}.`,
  confirm_airtime: ({ amount }) =>
    `Zvakanaka. Unoda kutenga airtime ye ${formatMoney(amount)}?`,
  airtime_done: ({ amount }) =>
    `Zvaita. Ndakenga airtime ye ${formatMoney(amount)}.`,
  confirm_call: ({ name }) => `Ndichafonera ${name}. Ndienderere mberi here?`,
  calling: ({ name }) => `Ndiri kufonera ${name} izvozvi.`,
  call_ended: ({ name }) => `Ndakapedza foni na${name}.`,
  time: ({ time }) => `Nguva yava ${time}.`,
  balance: ({ balance }) => `Mari yako yasara ndeye ${formatMoney(balance, 2)}.`,
  cannot_afford: ({ amount, balance }) =>
    `Une ${formatMoney(balance, 2)} chete, saka handikwanise kutumira ${formatMoney(amount, 2)}.`,
  cancel: ({ hadPending }) =>
    hadPending ? 'Zvakanaka. Ndakakanzura chikumbiro ichi.' : 'Zvakanaka.',
  language_switched: () => 'Zvakanaka. Tichaenderera mberi neChiShona.',
  help: () =>
    'Ndinogona kuvhura maapp, kutumira meseji, kufona, kuudza nguva, kutumira mari, kana kutenga airtime.',
  unknown: () =>
    'Ndinogona kukubatsira kushandisa nhare iyi. Taura zvawakasununguka.',
  empty: () => 'Handina kunzwa zvakanaka. Ndapota edza zvakare.',
  alarm_set: ({ time }) => `Ndakagadzira alarm ye${time}.`,
  text_larger: () => 'Ndakukudza mavara.',
  voice_slower: () => 'Ndichataura zvinyoronyoro.',
};

const ND: Lines = {
  wake: () => 'Yebo, ngiyalalela.',
  opening_app: ({ name }) => `Ngivula i-${name}.`,
  app_opened: ({ name }) => `I-${name} ivuliwe.`,
  go_home: () => 'Sibuyela ekhaya.',
  ask_message: ({ name }) => `Kulungile. Ufuna ngitsheleni u-${firstName(name)}?`,
  confirm_message: ({ name, message }) =>
    `Ngizothumela ku-${firstName(name)}: '${message}' Ngithumele?`,
  message_sent: ({ name }) => `Kwenziwe. Ngithumele umlayezo ku-${firstName(name)}.`,
  chat_opened: ({ name }) => `Ingxoxo ka-${firstName(name)} ivuliwe.`,
  ask_recipient: ({ kind }) =>
    kind === 'call'
      ? 'Ufuna ukushayela bani?'
      : kind === 'message'
        ? 'Ufuna ukuthumela umlayezo kubani?'
        : 'Kulungile. Ufuna ukuthumela kubani?',
  contact_not_found: ({ query }) =>
    `Angimtholanga u-${query} kokontacts, kodwa ngiyaqonda ukuthi ufuna ukuthumela ku-${query}.`,
  unsaved_send: ({ amount, name, method }) =>
    `Anginaye u-${name} kokontacts, kodwa ngizothumela ${formatMoney(amount, 2)} ku-${name} nge-${method}.`,
  heard_confirm: ({ amount, name }) =>
    `Ngizwile ukuthi ufuna ukuthumela ${formatMoney(amount, 2)} ku-${name}. Kuyiqiniso?`,
  clarify_contact: ({ options }) =>
    `Ngithole amagama afanayo: ${joinOr(options)}. Uqonde bani?`,
  ask_amount: ({ kind, name }) =>
    kind === 'airtime'
      ? 'Kulungile. Ufuna ukuthenga i-airtime yamalini?'
      : name
        ? `Kulungile. Ufuna ukuthumela malini ku-${firstName(name)}?`
        : 'Kulungile. Ufuna ukuthumela malini?',
  confirm_send: ({ amount, name, method }) =>
    `Ngithole u-${name}. Uthumela ${formatMoney(amount, 2)} nge-${method}. Ngiqhubeke?`,
  need_permission: () => 'Ngidinga imvume yakho ukuze ngiqhubeke.',
  confirm_transaction: ({ amount, name }) =>
    `Qinisekisa: thumela ${formatMoney(amount, 2)} ku-${name}.`,
  processing: () => 'Kulungile. Ngiyaqhubeka manje.',
  sent: ({ amount, name }) =>
    `Kwenziwe. ${formatMoney(amount, 2)} ithunyelwe ku-${name}.`,
  confirm_airtime: ({ amount }) =>
    `Kulungile. Ufuna ukuthenga i-airtime ye-${formatMoney(amount)}?`,
  airtime_done: ({ amount }) =>
    `Kwenziwe. Ngithenge i-airtime ye-${formatMoney(amount)}.`,
  confirm_call: ({ name }) => `Ngizoshayela u-${name}. Ngiqhubeke?`,
  calling: ({ name }) => `Ngishayela u-${name} khathesi.`,
  call_ended: ({ name }) => `Ngiqede ucingo no-${name}.`,
  time: ({ time }) => `Isikhathi sikhona ${time}.`,
  balance: ({ balance }) => `Imali yakho esele ngu-${formatMoney(balance, 2)}.`,
  cannot_afford: ({ amount, balance }) =>
    `Unemali engu-${formatMoney(balance, 2)}, angikwazi ukuthumela ${formatMoney(amount, 2)}.`,
  cancel: ({ hadPending }) =>
    hadPending ? 'Kulungile. Ngikhanselile leso sicelo.' : 'Kulungile.',
  language_switched: () => 'Kulungile. Sizoqhubeke ngesiNdebele.',
  help: () =>
    'Ngingavula ama-app, thumela imilayezo, shaya ucingo, bheka isikhathi, thumela imali, noma thenga i-airtime.',
  unknown: () => 'Ngingakusiza ukusebenzisa le foni. Khuluma nje ngokukhululeka.',
  empty: () => 'Angizwanga kahle. Zama futhi.',
  alarm_set: ({ time }) => `Ngimise i-alamu ngo-${time}.`,
  text_larger: () => 'Ngenze umbhalo mkhulu.',
  voice_slower: () => 'Ngizokhuluma kancane.',
};

const SW: Lines = {
  wake: () => 'Ndiyo, ninasikiliza.',
  opening_app: ({ name }) => `Nafungua ${name}.`,
  app_opened: ({ name }) => `${name} imefunguliwa.`,
  go_home: () => 'Tunarudi nyumbani.',
  ask_message: ({ name }) => `Sawa. Unataka nimwambie ${firstName(name)} nini?`,
  confirm_message: ({ name, message }) =>
    `Nitatuma kwa ${firstName(name)}: '${message}' Nitume?`,
  message_sent: ({ name }) => `Imekamilika. Nimetuma ujumbe kwa ${firstName(name)}.`,
  chat_opened: ({ name }) => `Mazungumzo ya ${firstName(name)} yamefunguliwa.`,
  ask_recipient: ({ kind }) =>
    kind === 'call'
      ? 'Unataka nimpigie nani?'
      : kind === 'message'
        ? 'Unataka kutuma ujumbe kwa nani?'
        : 'Sawa. Unataka kutuma kwa nani?',
  contact_not_found: ({ query }) =>
    `Sijampata ${query} katika anwani, lakini nimeelewa unataka kutuma kwa ${query}.`,
  unsaved_send: ({ amount, name, method }) =>
    `Sina ${name} kwenye anwani, lakini nitaendelea kutuma ${formatMoney(amount, 2)} kwa ${name} kwa ${method}.`,
  heard_confirm: ({ amount, name }) =>
    `Nimesikia unataka kutuma ${formatMoney(amount, 2)} kwa ${name}. Ni sawa?`,
  clarify_contact: ({ options }) =>
    `Nimepata majina yanayofanana: ${joinOr(options)}. Unamaanisha nani?`,
  ask_amount: ({ kind, name }) =>
    kind === 'airtime'
      ? 'Sawa. Unataka kununua airtime ya kiasi gani?'
      : name
        ? `Sawa. Unataka kutuma kiasi gani kwa ${firstName(name)}?`
        : 'Sawa. Unataka kutuma kiasi gani?',
  confirm_send: ({ amount, name, method }) =>
    `Nimepata ${name}. Unatuma ${formatMoney(amount, 2)} kwa ${method}. Niendelee?`,
  need_permission: () => 'Nahitaji ruhusa yako ili niendelee.',
  confirm_transaction: ({ amount, name }) =>
    `Thibitisha: tuma ${formatMoney(amount, 2)} kwa ${name}.`,
  processing: () => 'Sawa. Ninaendelea sasa.',
  sent: ({ amount, name }) =>
    `Imekamilika. ${formatMoney(amount, 2)} imetumwa kwa ${name}.`,
  confirm_airtime: ({ amount }) =>
    `Sawa. Unataka kununua airtime ya ${formatMoney(amount)}?`,
  airtime_done: ({ amount }) =>
    `Imekamilika. Nimenunua airtime ya ${formatMoney(amount)}.`,
  confirm_call: ({ name }) => `Nitampigia ${name}. Niendelee?`,
  calling: ({ name }) => `Ninampigia ${name} sasa.`,
  call_ended: ({ name }) => `Nimekatisha simu na ${name}.`,
  time: ({ time }) => `Saa sasa ni ${time}.`,
  balance: ({ balance }) => `Salio lako ni ${formatMoney(balance, 2)}.`,
  cannot_afford: ({ amount, balance }) =>
    `Una ${formatMoney(balance, 2)} tu, siwezi kutuma ${formatMoney(amount, 2)}.`,
  cancel: ({ hadPending }) =>
    hadPending ? 'Sawa. Nimeghairi ombi hilo.' : 'Sawa.',
  language_switched: () => 'Sawa. Tutaendelea kwa Kiswahili.',
  help: () =>
    'Naweza kufungua programu, kutuma ujumbe, kupiga simu, kusema saa, kutuma pesa, au kununua airtime.',
  unknown: () => 'Naweza kukusaidia kutumia simu hii. Ongea tu kwa kawaida.',
  empty: () => 'Sikusikia vizuri. Tafadhali jaribu tena.',
  alarm_set: ({ time }) => `Nimeweka kengele saa ${time}.`,
  text_larger: () => 'Nimekuza maandishi.',
  voice_slower: () => 'Nitazungumza polepole.',
};

const PACKS: Record<LanguageCode, Lines> = { en: EN, sn: SN, nd: ND, sw: SW };

export function speakAct(act: ReplyAct, language: LanguageCode): string {
  const pack = PACKS[language] ?? EN;
  return pack[act.type](act);
}

function joinOr(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} or ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, or ${names[names.length - 1]}`;
}
