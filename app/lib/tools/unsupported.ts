import { normalizeText } from '../format';
import { resolveApp } from '../ai/tools';

export function unsupportedCapability(text: string): string | null {
  const n = normalizeText(text);
  if (/(organise|organize).*(files|folder)|organise my files|organize my files/.test(n)) {
    return "I understand that you'd like me to organise your files, but I don't have access to manage your files yet.";
  }
  if (/(order|buy).*(pizza|food)|order me a pizza|deliver.*(pizza|food)/.test(n)) {
    return "I don't have a food ordering service connected yet.";
  }
  if (/(spotify|apple music|play music|play a song|play some music)/.test(n)) {
    if (!resolveApp(n)) {
      return "I can't control Spotify on this phone yet.";
    }
  }
  if (/(search the web|google|search for|look up the latest|latest technology news)/.test(n) && !resolveApp(n)) {
    return "I don't have a live web search connection yet, but I can open Maps, WhatsApp, EcoCash, or Clock on this phone.";
  }
  return null;
}
