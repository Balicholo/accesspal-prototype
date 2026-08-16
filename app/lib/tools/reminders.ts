export interface ReminderDraft {
  text?: string;
  time?: string;
}

export function parseReminder(utterance: string): ReminderDraft {
  const cleaned = utterance
    .replace(/^(heyy?\s+pal[,.]?\s*)/i, '')
    .replace(/^(remind me( to)?|set a reminder( to)?|create a reminder( to)?)\s*/i, '')
    .trim();

  const timeMatch = cleaned.match(
    /\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?|\d{1,2}\s*(?:in the morning|in the evening|at night))\b/i
  );
  const time = timeMatch?.[1]
    ? normalizeTime(timeMatch[1])
    : /\bmorning\b/i.test(cleaned)
      ? '9:00 AM'
      : undefined;

  let text = cleaned
    .replace(/\b(tomorrow|today|mangwana)\b/gi, '')
    .replace(/\b(at\s+)?\d{1,2}(?::\d{2})?\s*(a\.?m\.?|p\.?m\.?)?\b/gi, '')
    .replace(/\baround\b/gi, '')
    .replace(/\bin the (morning|evening)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^to\s+/i, '')
    .trim();

  if (/^(at|for)$/i.test(text)) text = '';
  return { text: text || undefined, time };
}

function normalizeTime(raw: string) {
  const value = raw.replace(/\./g, '').trim();
  if (/morning/i.test(value) && !/\d/.test(value)) return '9:00 AM';
  if (/evening|night/i.test(value) && !/\d/.test(value)) return '7:00 PM';
  const match = value.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return value;
  const hour = Number(match[1]);
  const minute = match[2] ?? '00';
  const period = (match[3] ?? (hour < 12 ? 'AM' : 'PM')).toUpperCase();
  return `${hour}:${minute} ${period}`;
}
