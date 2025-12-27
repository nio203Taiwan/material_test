import React from 'react';
import { User, Cpu } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { Message } from '../types.ts';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar Area */}
        <div className={`flex-shrink-0 h-12 w-12 border-2 flex items-center justify-center shadow-lg ${
            isUser ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-600 text-slate-400'
        }`}>
            {isUser ? <User size={24} /> : <Cpu size={24} />}
        </div>

        {/* Bubble Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`p-5 shadow-2xl border-l-4 ${
                isUser 
                ? 'bg-slate-800/80 border-cyan-500 text-cyan-50' 
                : 'bg-slate-800/40 border-l-[#c2410c] text-slate-200'
            }`}>
                <div className="mb-2 flex items-center gap-2 opacity-50">
                   <span className="text-[9px] font-mono uppercase tracking-tighter text-slate-400">
                     {isUser ? 'TRANSMISSION_USER' : 'TRANSMISSION_MATSCI_CORE'}
                   </span>
                   <div className="h-px flex-1 bg-slate-700 opacity-20"></div>
                </div>
                
                {isUser ? (
                    <div className="whitespace-pre-wrap font-sans leading-relaxed">{message.text}</div>
                ) : (
                    <MarkdownRenderer content={message.text} />
                )}
            </div>
            <span className="text-[10px] font-mono text-slate-600 mt-2 px-1 tracking-widest uppercase">
                TS: {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
        </div>
      </div>
    </div>
  );
};