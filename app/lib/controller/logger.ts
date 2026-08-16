const enabled =
  typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

export function logTransition(scope: string, message: string, extra?: unknown) {
  if (!enabled) return;
  if (extra !== undefined) {
    console.info(`[${scope}] ${message}`, extra);
    return;
  }
  console.info(`[${scope}] ${message}`);
}
