import type { LanguageCode } from '../types';
import type { SpeechProvider, VoiceMode } from './stt';
import { BrowserSpeechProvider } from './stt';

/**
 * Speech-to-text is a swappable ear. The conversation engine only
 * receives a normalized transcript — never a browser-specific event.
 *
 * VoiceProvider
 * ├── BrowserSpeechProvider   (current: Web Speech API)
 * ├── CloudSTTProvider        (plug in later)
 * └── AfricanLanguageSTTProvider
 */
export { BrowserSpeechProvider };

export class CloudSTTProvider implements SpeechProvider {
  readonly name = 'cloud-stt-placeholder';

  start(_mode: Exclude<VoiceMode, 'off'>, _language?: LanguageCode, _options?: { silenceMs?: number }) {
    return false;
  }

  pause() {}
  mute() {}
  unmute() {}
  stop() {}
  setLanguage(_language: LanguageCode) {}
  isActive() {
    return false;
  }

  getMode(): VoiceMode {
    return 'off';
  }
}

export function createSpeechProvider(
  handlers: ConstructorParameters<typeof BrowserSpeechProvider>[0]
): SpeechProvider {
  return new BrowserSpeechProvider(handlers);
}
