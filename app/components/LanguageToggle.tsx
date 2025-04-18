'use client';

import { Languages } from 'lucide-react';
import { Language } from '../types';

interface LanguageToggleProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  autoDetect: boolean;
  onAutoDetectChange: (autoDetect: boolean) => void;
}

export function LanguageToggle({
  language,
  onLanguageChange,
  autoDetect,
  onAutoDetectChange,
}: LanguageToggleProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <div className="flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full px-4 py-2">
        <Languages className="w-5 h-5 text-gray-400" />
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          disabled={autoDetect}
          className="bg-transparent text-white border-none focus:ring-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="en" className="bg-gray-800 text-white">English</option>
          <option value="sn" className="bg-gray-800 text-white">Shona</option>
        </select>
      </div>
      <label className="flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full px-4 py-2 cursor-pointer">
        <input
          type="checkbox"
          checked={autoDetect}
          onChange={(e) => onAutoDetectChange(e.target.checked)}
          className="rounded-full bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-900"
        />
        <span className="text-sm text-gray-300">Auto-detect language</span>
      </label>
    </div>
  );
}