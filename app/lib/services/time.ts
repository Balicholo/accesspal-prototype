export function getCurrentTime(locale = 'en-US'): string {
  return new Date().toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
