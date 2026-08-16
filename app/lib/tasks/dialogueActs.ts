import { normalizeText } from '../format';

export type TaskDialogueAct = 'cancel' | 'confirm' | 'correct' | 'inform';

export function interpretTaskAct(raw: string): TaskDialogueAct {
  const text = normalizeText(raw);
  if (!text) return 'inform';
  if (isCancelMeaning(text)) return 'cancel';
  if (isCorrectMeaning(text)) return 'correct';
  if (isConfirmMeaning(text)) return 'confirm';
  return 'inform';
}

export function isConfirmMeaning(text: string) {
  if (/\b(send money|send \d|send \$|transfer|kutumira)\b/.test(text) && !/\bsend it\b/.test(text)) {
    return false;
  }
  if (
    /^(yes|yeah|yep|yup|sure|ok|okay|alright|all right|please|yebo|hongu|ehe|ehee|sawa|ndiyo|ndizvo)\b/.test(
      text
    )
  ) {
    return true;
  }
  return (
    /\b(go ahead|proceed|do it|please do|thats fine|thats correct|thats right|please send|send it|send that|do that|confirm)\b/.test(
      text
    ) || /^(send it|do it|do that|please send it)$/.test(text)
  );
}

export function isCancelMeaning(text: string) {
  if (/^(no|nope|nah|kwete|hayi)$/.test(text)) return true;
  return (
    /\b(cancel|never mind|nevermind|forget it|stop|abort|leave it|changed my mind|dont send|do not send|don't send|dont do it|do not do|actually don)\b/.test(
      text
    ) || /\b(rega|regedza|ghairi)\b/.test(text)
  );
}

export function isCorrectMeaning(text: string) {
  return (
    /\b(instead|change (it|that|the)|make it|make that|update the)\b/.test(text) ||
    (/\bactually\b/.test(text) &&
      (/\b(send|make|change|to)\b/.test(text) || /\b\d/.test(text)) &&
      !isCancelMeaning(text) &&
      !/\bweather\b/.test(text))
  );
}

export function isLikelyNameOnly(raw: string) {
  const text = normalizeText(raw);
  if (!text) return false;
  if (isConfirmMeaning(text) || isCancelMeaning(text)) return false;
  if (/(good morning|good afternoon|good night|running late|i will|i'll|tell him|message)/.test(text)) {
    return false;
  }
  if (/^(hello|hi|hey|thanks|thank you|please|ok|okay)$/.test(text)) return false;
  const tokens = text.split(' ').filter(Boolean);
  return tokens.length > 0 && tokens.length <= 3;
}

export function isAffirmativeUtterance(raw: string, act?: string) {
  if (act === 'confirm' || act === 'allow') return true;
  return interpretTaskAct(raw) === 'confirm';
}
