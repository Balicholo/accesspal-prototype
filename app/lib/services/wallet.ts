import { createId } from '../format';
import type {
  PaymentMethod,
  SimulatedTransaction,
  TransactionStatus,
  WalletSnapshot,
} from '../types';

const STARTING_BALANCE = 1230;

/**
 * Simulated wallet. This never talks to EcoCash, InnBucks, or a bank.
 * Replace method bodies with real adapters when integrations exist.
 */
export class WalletService {
  readonly owner = 'Wisdom';
  readonly paymentMethods: PaymentMethod[] = ['EcoCash', 'InnBucks'];
  private balance = STARTING_BALANCE;
  private history: SimulatedTransaction[] = [];

  snapshot(): WalletSnapshot {
    return {
      owner: this.owner,
      balance: this.balance,
      paymentMethods: [...this.paymentMethods],
      lastTransaction: this.history[this.history.length - 1],
    };
  }

  getBalance(): number {
    return this.balance;
  }

  canAfford(amount: number): boolean {
    return amount > 0 && amount <= this.balance;
  }

  remainingAfter(amount: number): number {
    return this.balance - amount;
  }

  async sendMoney(
    amount: number,
    recipientName: string
  ): Promise<SimulatedTransaction> {
    return this.commit({
      type: 'send_money',
      amount,
      recipientName,
    });
  }

  async buyAirtime(amount: number): Promise<SimulatedTransaction> {
    return this.commit({
      type: 'buy_airtime',
      amount,
    });
  }

  reset(): WalletSnapshot {
    this.balance = STARTING_BALANCE;
    this.history = [];
    return this.snapshot();
  }

  private async commit(input: {
    type: SimulatedTransaction['type'];
    amount: number;
    recipientName?: string;
  }): Promise<SimulatedTransaction> {
    await delay(1400);

    if (!this.canAfford(input.amount)) {
      const failed: SimulatedTransaction = {
        id: createId('tx'),
        type: input.type,
        amount: input.amount,
        recipientName: input.recipientName,
        status: 'failed',
        timestamp: Date.now(),
      };
      this.history.push(failed);
      return failed;
    }

    this.balance = Number((this.balance - input.amount).toFixed(2));
    const success: SimulatedTransaction = {
      id: createId('tx'),
      type: input.type,
      amount: input.amount,
      recipientName: input.recipientName,
      status: 'success',
      timestamp: Date.now(),
    };
    this.history.push(success);
    return success;
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const walletService = new WalletService();

export function describeTransactionStatus(status: TransactionStatus): string {
  return status;
}
