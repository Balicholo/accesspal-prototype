import type { TaskType } from '../phone/types';

export type CapabilityId =
  | TaskType
  | 'set_alarm'
  | 'get_weather'
  | 'check_calendar'
  | 'unsupported';

export interface Capability {
  intent: CapabilityId;
  requiredSlots: string[];
  optionalSlots: string[];
  confirmationRequired: boolean;
}

export const CAPABILITIES: Record<string, Capability> = {
  send_message: {
    intent: 'send_message',
    requiredSlots: ['contact', 'message'],
    optionalSlots: ['app'],
    confirmationRequired: true,
  },
  send_money: {
    intent: 'send_money',
    requiredSlots: ['contact', 'amount'],
    optionalSlots: ['service'],
    confirmationRequired: true,
  },
  buy_airtime: {
    intent: 'buy_airtime',
    requiredSlots: ['amount'],
    optionalSlots: [],
    confirmationRequired: true,
  },
  make_call: {
    intent: 'make_call',
    requiredSlots: ['contact'],
    optionalSlots: [],
    confirmationRequired: true,
  },
  set_reminder: {
    intent: 'set_reminder',
    requiredSlots: ['message', 'when'],
    optionalSlots: [],
    confirmationRequired: false,
  },
  set_alarm: {
    intent: 'set_alarm',
    requiredSlots: ['when'],
    optionalSlots: [],
    confirmationRequired: false,
  },
  get_weather: {
    intent: 'get_weather',
    requiredSlots: [],
    optionalSlots: ['place', 'day'],
    confirmationRequired: false,
  },
  check_calendar: {
    intent: 'check_calendar',
    requiredSlots: [],
    optionalSlots: ['day'],
    confirmationRequired: false,
  },
};

export function missingSlots(
  intent: string,
  data: Record<string, unknown>
): string[] {
  const spec = CAPABILITIES[intent];
  if (!spec) return [];
  return spec.requiredSlots.filter((slot) => {
    const value = data[slot];
    return value === undefined || value === null || value === '';
  });
}
