import { Transaction, Language } from '../types';

export async function processTransaction(transaction: Transaction, language: Language): Promise<Transaction> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  switch (transaction.type) {
    case 'send_money':
      return {
        ...transaction,
        status: 'success',
        timestamp: Date.now()
      };

    case 'check_balance':
      return {
        ...transaction,
        status: 'success',
        timestamp: Date.now()
      };

    case 'buy_airtime':
      return {
        ...transaction,
        status: 'success',
        timestamp: Date.now()
      };

    default:
      return {
        ...transaction,
        status: 'error',
        timestamp: Date.now()
      };
  }
}

export function getTransactionResponse(transaction: Transaction, language: Language): string {
  if (transaction.status === 'error') {
    return language === 'en'
      ? 'Sorry, there was an error processing your transaction.'
      : 'Ruregerero, pane dambudziko raitika pakushanda kwemari.';
  }

  switch (transaction.type) {
    case 'send_money':
      return language === 'en'
        ? `Successfully sent $${transaction.amount} to ${transaction.recipient}.`
        : `Matumira $${transaction.amount} kuna ${transaction.recipient} zvakanaka.`;

    case 'check_balance':
      return language === 'en'
        ? 'Your current balance is $1,000.'
        : 'Mari yenyu yasara muaccount ndeye madhora chiuru chimwe chete.';

    case 'buy_airtime':
      return language === 'en'
        ? `Successfully purchased $${transaction.amount} airtime.`
        : `Matenga airtime ye$${transaction.amount} zvakanaka.`;

    default:
      return language === 'en'
        ? 'Transaction completed successfully.'
        : 'Basa renyu raita zvakanaka.';
  }
}