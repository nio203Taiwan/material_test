import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-none prose-slate">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
            p: ({children}) => <p className="mb-4 leading-relaxed font-sans">{children}</p>,
            h1: ({children}) => <h1 className="text-cyan-400 font-mono font-bold text-xl mt-6 mb-4 border-b border-cyan-900 pb-2 uppercase tracking-tighter">{children}</h1>,
            h2: ({children}) => <h2 className="text-amber-500 font-mono font-bold text-lg mt-5 mb-3 uppercase tracking-tighter">{children}</h2>,
            ul: ({children}) => <ul className="list-square pl-5 mb-4 space-y-2 text-slate-300">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-slate-300">{children}</ol>,
            li: ({children}) => <li className="pl-1 marker:text-cyan-600">{children}</li>,
            code: ({children}) => <code className="bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-amber-400 font-mono text-sm">{children}</code>,
            blockquote: ({children}) => <blockquote className="border-l-4 border-cyan-800 pl-4 italic text-slate-400 my-4 bg-cyan-950/20 py-2">{children}</blockquote>,
            strong: ({children}) => <strong className="text-cyan-300 font-bold">{children}</strong>
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};