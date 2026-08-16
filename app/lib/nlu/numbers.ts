import { normalizeText } from '../format';

const WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
  motsi: 1,
  piri: 2,
  tatu: 3,
  ina: 4,
  shanu: 5,
  tanhatu: 6,
  nomwe: 7,
  sere: 8,
  pfumbamwe: 9,
  gumi: 10,
  maviri: 2,
  matatu: 3,
  mashanu: 5,
  zana: 100,
  chiuru: 1000,
};

const PHRASES: Array<[string, number]> = [
  ['makumi maviri', 20],
  ['makumi matatu', 30],
  ['makumi mana', 40],
  ['makumi mashanu', 50],
  ['madhora makumi maviri', 20],
  ['madhora mashanu', 5],
  ['dola tano', 5],
  ['dola 20', 20],
  ['a hundred', 100],
  ['two hundred', 200],
];

export function extractAmount(text: string): number | undefined {
  const normalized = normalizeText(text);

  for (const [phrase, value] of PHRASES) {
    if (normalized.includes(phrase)) return value;
  }

  const dolaFirst = normalized.match(/dola\s+(\d+(?:\.\d+)?)/);
  if (dolaFirst) return Number(dolaFirst[1]);

  const currency = normalized.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (currency) return Number(currency[1]);

  const written = extractWordAmount(normalized);
  if (written !== undefined) return written;

  const unit = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:dollars?|usd|bucks|mari|madhora|dola)/
  );
  if (unit) return Number(unit[1]);

  const around = normalized.match(
    /(?:around|about|maybe|like|kuma)\s+(\d+(?:\.\d+)?)/
  );
  if (around) return Number(around[1]);

  const standalone = normalized.match(/\b(\d+(?:\.\d+)?)\b/);
  if (standalone) {
    const value = Number(standalone[1]);
    if (value > 0 && value <= 100000) return value;
  }

  return undefined;
}

function extractWordAmount(text: string): number | undefined {
  const tokens = text.split(' ');
  let total = 0;
  let current = 0;
  let found = false;

  for (const token of tokens) {
    const value = WORDS[token];
    if (value === undefined) continue;
    found = true;

    if (value === 100 || value === 1000) {
      current = (current || 1) * value;
      if (value === 1000) {
        total += current;
        current = 0;
      }
    } else {
      current += value;
    }
  }

  if (!found) return undefined;
  return total + current;
}
