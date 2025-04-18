'use client';

import { useState } from 'react';
import { VoiceInput } from './components/VoiceInput';
import { MessageList } from './components/MessageList';
import { LanguageToggle } from './components/LanguageToggle';
import { handleIntent, detectLanguage } from './components/IntentHandler';
import { processTransaction, getTransactionResponse } from './components/TransactionHandler';
import { speak } from './components/TTSResponder';
import type { Message, Language, Transaction } from './types';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [autoDetect, setAutoDetect] = useState(true);

  const handleTranscript = async (text: string, detectedLang: Language) => {
    const msgLanguage = autoDetect ? detectedLang : language;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      type: 'user',
      timestamp: Date.now(),
      language: msgLanguage,
    };
    setMessages((prev) => [...prev, userMessage]);

    const intentResponse = handleIntent(text, msgLanguage);
    let finalResponse = intentResponse.response;

    // Handle transactions if present
    if (intentResponse.action) {
      const transaction = await processTransaction(intentResponse.action, msgLanguage);
      finalResponse = getTransactionResponse(transaction, msgLanguage);
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: finalResponse,
      type: 'assistant',
      timestamp: Date.now(),
      language: msgLanguage,
      action: intentResponse.action,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      await speak(finalResponse, msgLanguage);
    } catch (error) {
      console.error('TTS Error:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 h-screen flex flex-col">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">
              Access Pal
            </h1>
          </div>
          <p className="text-gray-400 mb-6">
            Your bilingual voice companion (English & Shona)
          </p>
          <LanguageToggle
            language={language}
            onLanguageChange={setLanguage}
            autoDetect={autoDetect}
            onAutoDetectChange={setAutoDetect}
          />
        </header>

        <div className="flex-1 overflow-hidden relative rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-xl">
          <div className="absolute inset-0 overflow-y-auto px-4 py-6">
            <MessageList messages={messages} />
          </div>
        </div>

        <footer className="mt-8 flex flex-col items-center">
          <VoiceInput
            onTranscript={handleTranscript}
            isListening={isListening}
            onListeningChange={setIsListening}
            selectedLanguage={language}
          />
        </footer>
      </div>
    </main>
  );
}