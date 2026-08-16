import type { Language, LanguageCode } from '../types';

export const LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    speechRecognitionCode: 'en-US',
    speechSynthesisCode: 'en-US',
  },
  {
    code: 'sn',
    name: 'Shona',
    nativeName: 'ChiShona',
    speechRecognitionCode: 'sn-ZW',
    speechSynthesisCode: 'sn-ZW',
  },
  {
    code: 'nd',
    name: 'Ndebele',
    nativeName: 'IsiNdebele',
    speechRecognitionCode: 'nd-ZW',
    speechSynthesisCode: 'nd-ZW',
  },
  {
    code: 'sw',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    speechRecognitionCode: 'sw-KE',
    speechSynthesisCode: 'sw-KE',
  },
];

export function getLanguage(code: LanguageCode): Language {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0];
}

export const LANGUAGE_SWITCH_PHRASES: Record<LanguageCode, string[]> = {
  en: ['english', 'switch to english', 'speak english', 'use english'],
  sn: ['shona', 'chishona', 'switch to shona', 'speak shona', 'chi shona'],
  nd: ['ndebele', 'isindebele', 'switch to ndebele', 'speak ndebele'],
  sw: ['swahili', 'kiswahili', 'switch to swahili', 'speak swahili'],
};
