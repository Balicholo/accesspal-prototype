import { normalizeText } from '../format';

const PAL_TOKENS = [
  'pal',
  'paul',
  'pearl',
  'pell',
  'pow',
  'pa',
  'pall',
  'pol',
  'ball',
  'bell',
  'accesspal',
];

export interface WakeInspection {
  addressed: boolean;
  command: string;
  confidence: number;
}

export function inspectWake(text: string): WakeInspection {
  const original = text.trim();
  const normalized = normalizeText(original);
  if (!normalized) return { addressed: false, command: original, confidence: 0 };

  if (/\baccess\s*pal\b/.test(normalized) || normalized.includes('accesspal')) {
    return {
      addressed: true,
      command: stripAddress(original),
      confidence: 0.96,
    };
  }

  const tokens = normalized.split(' ');
  const prefixIndex = tokens.findIndex((token) => isHeyLike(token));

  if (prefixIndex >= 0 && prefixIndex < tokens.length - 1) {
    const next = tokens[prefixIndex + 1].replace(/[,.!?]/g, '');
    const palScore = palSimilarity(next);
    if (palScore >= 0.68) {
      return {
        addressed: true,
        command: stripAddress(original),
        confidence: Math.max(palScore, isHeyy(tokens[prefixIndex]) ? 0.98 : palScore),
      };
    }
  }

  if (tokens.length === 1 && palSimilarity(tokens[0]) >= 0.92) {
    return { addressed: true, command: '', confidence: 0.7 };
  }

  return { addressed: false, command: original, confidence: 0 };
}

export function containsWakeWord(text: string): boolean {
  return inspectWake(text).addressed;
}

export function stripWakeWord(text: string): string {
  return inspectWake(text).command;
}

export function isWakeOnly(text: string): boolean {
  const inspection = inspectWake(text);
  return inspection.addressed && inspection.command.length === 0;
}

function stripAddress(text: string): string {
  return text
    .trim()
    .replace(
      /^(hey+|heyy+|hay|hei|hi|okay|ok|yo)?\s*(access\s*)?(pal|paul|pearl|pell|pow|pa|pall|pol|ball|bell|accesspal)\b[,.]?\s*/i,
      ''
    )
    .replace(/^access\s*pal[,.]?\s*/i, '')
    .trim();
}

function isHeyLike(token: string) {
  return /^(h+e+y+|hay|hei|hi+)$/.test(token);
}

function isHeyy(token: string) {
  return /^h+e+y{2,}$/.test(token) || token === 'heyy';
}

function palSimilarity(token: string): number {
  if (PAL_TOKENS.includes(token)) return token === 'pal' || token === 'accesspal' ? 1 : 0.86;
  let best = 0;
  for (const candidate of ['pal', 'paul']) {
    const distance = levenshtein(token, candidate);
    const score = 1 - distance / Math.max(token.length, candidate.length);
    if (score > best) best = score;
  }
  return best;
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) grid[i][0] = i;
  for (let j = 0; j < cols; j += 1) grid[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      grid[i][j] = Math.min(
        grid[i - 1][j] + 1,
        grid[i][j - 1] + 1,
        grid[i - 1][j - 1] + cost
      );
    }
  }
  return grid[a.length][b.length];
}
