import { walletService } from './wallet';

/** Simulated airtime purchase. No telecom API is called. */
export class AirtimeService {
  async purchase(amount: number) {
    return walletService.buyAirtime(amount);
  }
}

export const airtimeService = new AirtimeService();
