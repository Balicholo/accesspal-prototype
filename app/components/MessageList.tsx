import { Message } from '../types';
import { Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Bot className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg mb-2">Welcome to Access Pal!</p>
        <p className="text-sm">Click the microphone button and try saying "Hello" or "Mhoro"</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`flex items-start gap-3 ${
            message.type === 'user' ? 'flex-row-reverse' : ''
          }`}
        >
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.type === 'user'
                ? 'bg-orange-500'
                : 'bg-yellow-500'
            }`}
          >
            {message.type === 'user' ? (
              <User className="w-5 h-5 text-white" />
            ) : (
              <Bot className="w-5 h-5 text-white" />
            )}
          </div>
          <div
            className={`flex flex-col gap-1 max-w-[80%] ${
              message.type === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className={`px-4 py-2 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              {message.action && (
                <div className="mt-2 text-xs opacity-75">
                  {message.action.type === 'send_money' && (
                    <p>💸 Processing transaction...</p>
                  )}
                </div>
              )}
            </motion.div>
            <span className="text-xs text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}