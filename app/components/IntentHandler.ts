import { intents } from '../data/intents';
import { Language, Transaction } from '../types';

export function handleIntent(text: string, language: Language): {
  response: string;
  action?: Transaction;
} {
  const lowercaseText = text.toLowerCase();
  
  // Extract amount and recipient from money transfer commands
  const moneyRegex = /(\$?\d+|\d+\s*dollars?)\s*(?:to\s*|kuna\s*)?([a-zA-Z]+)/i;
  const match = text.match(moneyRegex);
  
  for (const intent of intents) {
    const keywords = intent.keywords[language];
    if (keywords.some(keyword => lowercaseText.includes(keyword.toLowerCase()))) {
      const response = intent.response[language];
      
      // Handle special cases for transactions
      if (intent.command === 'send_money' && match) {
        const amount = parseInt(match[1].replace('$', ''));
        const recipient = match[2];
        return {
          response: language === 'en' 
            ? `I'll help you send $${amount} to ${recipient}.`
            : `Ndichakubatsirai kutumira $${amount} kuna ${recipient}.`,
          action: {
            type: 'send_money',
            amount,
            recipient,
            status: 'pending',
            timestamp: Date.now()
          }
        };
      }
      
      return {
        response: typeof response === 'function' ? response() : response
      };
    }
  }
  
  return {
    response: language === 'en' 
      ? "I'm sorry, I didn't understand that command. Try saying 'help' to see what I can do."
      : "Ndinokumbira mutaure futi kana kuti, iti 'batsira' kuti muone zvandingaite."
  };
}

export function detectLanguage(text: string): Language {
  const shonaWords = [
    'mhoro', 'makadii', 'maswera', 'ndatenda', 'tarirai',
    'vhura', 'tenga', 'mari', 'nguva', 'batidza', 'fona',
    'tumira', 'batsira', 'ndinoda', 'kuna', 'zvakadii'
  ];
  
  const lowercaseText = text.toLowerCase();
  const containsShonaWord = shonaWords.some(word => 
    lowercaseText.includes(word.toLowerCase())
  );
  
  return containsShonaWord ? 'sn' : 'en';
}