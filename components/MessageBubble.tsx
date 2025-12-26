import React from 'react';
import { Message } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
            {isUser ? <User size={20} /> : <Bot size={20} />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`px-5 py-3 rounded-2xl text-sm md:text-base shadow-sm ${
                isUser 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
            }`}>
                {isUser ? (
                    <div className="whitespace-pre-wrap">{message.text}</div>
                ) : (
                    <MarkdownRenderer content={message.text} />
                )}
            </div>
            <span className="text-xs text-slate-400 mt-1 px-1">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      </div>
    </div>
  );
};