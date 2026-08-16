import { delay } from './wallet';
import type { Contact } from '../types';

/** Simulated telephony. No real call is placed. */
export class CallService {
  async place(contact: Contact): Promise<{ status: 'success'; contact: Contact }> {
    await delay(900);
    return { status: 'success', contact };
  }
}

export const callService = new CallService();
