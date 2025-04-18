'use client';

import { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { motion } from 'framer-motion';

interface VoiceInputProps {
  onTranscript: (text: string, detectedLanguage: Language) => void;
  isListening: boolean;
  onListeningChange: (isListening: boolean) => void;
  selectedLanguage: Language;
}

export function VoiceInput({
  onTranscript,
  isListening,
  onListeningChange,
  selectedLanguage,
}: VoiceInputProps) {
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (isListening) {
        onListeningChange(false);
      }
    };
  }, [isListening, onListeningChange]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage === 'sn' ? 'sn-ZW' : 'en-US';

    recognition.onstart = () => {
      onListeningChange(true);
      setError('');
      setIsProcessing(false);
    };

    recognition.onend = () => {
      onListeningChange(false);
      setIsProcessing(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const detectedLang: Language = 
        event.results[0][0].lang && 
        typeof event.results[0][0].lang === 'string' && 
        event.results[0][0].lang.startsWith('sn') ? 'sn' : 'en';
      
      if (event.results[0].isFinal) {
        setIsProcessing(true);
        onTranscript(transcript, detectedLang);
      }
    };

    recognition.onerror = (event: any) => {
      setError(`Error: ${event.error}`);
      onListeningChange(false);
      setIsProcessing(false);
    };

    recognition.start();
  }, [onTranscript, onListeningChange, selectedLanguage]);

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        onClick={startListening}
        disabled={isListening || isProcessing}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative p-8 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 hover:bg-red-600'
            : isProcessing
            ? 'bg-yellow-500'
            : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className={`absolute inset-0 rounded-full ${
          isListening ? 'animate-ping bg-red-500/50' : ''
        }`} />
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : isListening ? (
          <MicOff className="w-8 h-8 text-white relative z-10" />
        ) : (
          <Mic className="w-8 h-8 text-white relative z-10" />
        )}
      </motion.button>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 bg-red-500/10 px-4 py-2 rounded-full text-sm"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}