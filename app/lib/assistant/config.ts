export const VOICE_CONFIG = {
  /** Silence after the user stops talking before we treat the command as complete. */
  endOfSpeechMs: 1400,
  /** Faster commit when the utterance is only the wake phrase. */
  wakeOnlyCommitMs: 650,
  /** Give up waiting for a command after activation. */
  noCommandMs: 6500,
  /** Ignore extra "Heyy Pal" repeats during this window. */
  wakeDebounceMs: 1800,
};
