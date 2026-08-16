export function formatMoney(amount: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function firstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName;
}

export function createId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/(\d)\.(\d)/g, '$1DECIMAL$2')
    .replace(/[^\p{L}\p{N}\s$]/gu, ' ')
    .replace(/DECIMAL/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dayPeriod(date = new Date()): 'morning' | 'afternoon' | 'evening' {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
