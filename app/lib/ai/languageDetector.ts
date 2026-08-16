import { normalizeText } from '../format';
import { LANGUAGE_SWITCH_PHRASES } from '../i18n/languages';
import type { LanguageCode } from '../types';

const MARKERS: Record<Exclude<LanguageCode, 'en'>, string[]> = {
  sn: [
    'ndoda',
    'ndinoda',
    'ndiri',
    'ndawana',
    'ndapota',
    'ndienderere',
    'ndoenderera',
    'kutumira',
    'tumira',
    'madhora',
    'makumi',
    'maviri',
    'mashanu',
    'nguva',
    'kuziva',
    'zvakanaka',
    'unoda',
    'kuna',
    'vhura',
    'hongu',
    'ehe',
    'kwete',
    'mhoro',
    'maswera',
    'amai',
    'mari',
    'chishona',
    'mberi',
    'here',
    'fonera',
    'kufona',
    'ndizvo',
  ],
  nd: [
    'ngithole',
    'ngingakusiza',
    'ngishayela',
    'ngiqhubeke',
    'kulungile',
    'sawubona',
    'yebo',
    'imali',
    'ibhalansi',
    'isindebele',
    'khathesi',
    'ukuthumela',
    'ukushaya',
    'ucingo',
    'hayi',
  ],
  sw: [
    'nataka',
    'ninahitaji',
    'ninampigia',
    'nimepata',
    'naweza',
    'tafadhali',
    'nisaidie',
    'kutuma',
    'pesa',
    'salio',
    'sawa',
    'habari',
    'kiswahili',
    'ninunue',
    'nimpigie',
    'saa',
  ],
};

const EXPLICIT_CONTINUE_EN = [
  'continue in english',
  'lets continue in english',
  "let's continue in english",
  'speak english',
  'switch to english',
  'use english',
  'back to english',
];

export interface LanguageDetection {
  language: LanguageCode;
  switched: boolean;
  explicit: boolean;
  label: string | null;
}

const LABELS: Record<LanguageCode, string> = {
  en: 'English detected',
  sn: 'ChiShona detected',
  nd: 'isiNdebele detected',
  sw: 'Kiswahili detected',
};

/**
 * Language detection is a replaceable layer.
 * The selected language is only a fallback. Utterance evidence wins.
 */
export function detectSpokenLanguage(
  message: string,
  current: LanguageCode
): LanguageDetection {
  const text = normalizeText(message);
  if (!text) {
    return { language: current, switched: false, explicit: false, label: null };
  }

  const explicit = detectExplicitSwitch(text);
  if (explicit) {
    return {
      language: explicit,
      switched: explicit !== current,
      explicit: true,
      label: explicit !== current ? LABELS[explicit] : null,
    };
  }

  const scored = scoreLanguage(text);
  if (scored && scored !== current) {
    return {
      language: scored,
      switched: true,
      explicit: false,
      label: LABELS[scored],
    };
  }

  return { language: current, switched: false, explicit: false, label: null };
}

function detectExplicitSwitch(text: string): LanguageCode | null {
  if (EXPLICIT_CONTINUE_EN.some((phrase) => text.includes(phrase))) return 'en';

  const ordered: LanguageCode[] = ['sn', 'nd', 'sw', 'en'];
  for (const code of ordered) {
    if (LANGUAGE_SWITCH_PHRASES[code].some((phrase) => text.includes(phrase))) {
      if (
        code === 'en' &&
        !text.includes('english') &&
        !text.includes('switch') &&
        !text.includes('speak')
      ) {
        continue;
      }
      return code;
    }
  }
  return null;
}

function scoreLanguage(text: string): LanguageCode | null {
  const tokens = new Set(text.split(' '));
  let best: LanguageCode | null = null;
  let bestScore = 0;

  (Object.keys(MARKERS) as Array<Exclude<LanguageCode, 'en'>>).forEach(
    (code) => {
      let score = 0;
      for (const marker of MARKERS[code]) {
        if (text.includes(marker) || tokens.has(marker)) score += 1;
      }
      if (score > bestScore) {
        best = code;
        bestScore = score;
      }
    }
  );

  return bestScore >= 1 ? best : null;
}
