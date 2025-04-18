'use client';

import { Language } from '../types';

export function speak(text: string, language: Language) {
  return new Promise<void>((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Text-to-speech not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'sn' ? 'sn-ZW' : 'en-US';
    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);
    window.speechSynthesis.speak(utterance);
  });
}