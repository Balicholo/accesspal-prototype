import { normalizeText } from '../format';

const NAME_STOP = new Set([
  'money',
  'dollars',
  'dollar',
  'airtime',
  'whatsapp',
  'message',
  'messages',
  'call',
  'please',
  'using',
  'ecocash',
  'innbucks',
  'the',
  'a',
  'an',
  'some',
  'to',
  'for',
  'of',
  'my',
  'me',
  'i',
  'you',
  'want',
  'need',
  'send',
  'transfer',
  'help',
  'can',
  'could',
  'would',
  'like',
  'over',
  'kuna',
  'ku',
  'kwa',
  'madhora',
  'mari',
  'ndoda',
  'ndinoda',
  'kutumira',
  'tumira',
  'open',
  'clock',
  'time',
  'now',
  'later',
  'him',
  'her',
  'them',
  'it',
  'this',
  'that',
  'yes',
  'yeah',
  'yep',
  'sure',
  'okay',
  'ok',
  'no',
  'cancel',
  'allow',
  'confirm',
  'hongu',
  'ehe',
  'ehee',
  'twenty',
  'thirty',
  'fifty',
  'ten',
  'five',
]);

/**
 * Extract a person or recipient mention from natural language.
 * This is independent of the mock contact database.
 */
export function extractMentionedPerson(text: string): string | undefined {
  const raw = text.trim();
  const normalized = normalizeText(raw);
  if (/^(good morning|good afternoon|good night|good evening)\b/.test(normalized) && !/\b(to|kuna)\b/.test(normalized)) {
    return undefined;
  }

  const friend = raw.match(/\bmy friend\s+([A-Za-z][A-Za-z'-]+)/i);
  if (friend?.[1]) return titleName(friend[1]);

  const doctor = raw.match(/\b(?:dr|doctor)\.?\s+([A-Za-z][A-Za-z'-]+)/i);
  if (doctor?.[1]) return `Dr. ${titleName(doctor[1])}`;

  const relation = normalized.match(
    /\bmy\s+(sister|brother|mother|mom|mum|father|dad|friend)\b/
  );
  if (relation?.[1] && !friend) return `my ${relation[1]}`;

  const patterns = [
    /\b(?:to|kuna|ku|kwa|for)\s+(?:my\s+)?([A-Za-z][A-Za-z'-]+(?:\s+[A-Za-z][A-Za-z'-]+)?)/i,
    /\bsend\s+([A-Za-z][A-Za-z'-]+)\s+(?:a\s+message|twenty|thirty|forty|fifty|ten|five|\d+)/i,
    /\b(?:call|message|text|fonera)\s+(?:my\s+)?([A-Za-z][A-Za-z'-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    const candidate = match?.[1]?.trim();
    if (!candidate) continue;
    const cleaned = dropStopTail(candidate);
    if (cleaned && isPlausibleName(cleaned)) return titleName(cleaned);
  }

  const solo = normalized.trim();
  if (
    isPlausibleName(solo) &&
    solo.split(' ').length <= 3 &&
    !/[?]/.test(raw) &&
    !/(beautiful|impressive|zimbabwe|weather|accessib|platform)/.test(solo) &&
    !/^(what|why|how|this|that|the|open|send|please|can|could|tell|i|im|i'm)\b/.test(
      solo
    )
  ) {
    return titleName(raw.trim());
  }

  return undefined;
}

function dropStopTail(value: string) {
  const tokens = value.split(/\s+/);
  while (tokens.length && NAME_STOP.has(normalizeText(tokens[tokens.length - 1] ?? ''))) {
    tokens.pop();
  }
  return tokens.join(' ').trim();
}

function isPlausibleName(value: string) {
  const tokens = normalizeText(value).split(' ');
  if (!tokens.length || tokens.length > 3) return false;
  return tokens.every((token) => token.length >= 2 && !NAME_STOP.has(token) && !/^\d+$/.test(token));
}

function titleName(value: string) {
  if (value.toLowerCase().startsWith('my ')) return value.toLowerCase();
  return value
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function extractPhoneNumber(text: string): string | undefined {
  const match = text.match(/(\+?\d[\d\s-]{6,}\d)/);
  return match?.[1]?.replace(/\s+/g, ' ').trim();
}
