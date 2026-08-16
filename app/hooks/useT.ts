'use client';

import { usePhone } from '../context/PhoneProvider';
import { t } from '../lib/i18n/t';

export function useT() {
  const { state } = usePhone();
  return (key: string, vars?: Record<string, string | number>) =>
    t(key, state.language, vars);
}
