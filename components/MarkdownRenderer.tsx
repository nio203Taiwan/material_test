import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
}

// Since we cannot install packages in this environment, we are simulating the structure.
// In a real environment, you would run: npm install react-markdown remark-math rehype-katex
// If these libraries are not available in the runner, this might fall back to plain text or basic markdown.
// However, the prompt allows "popular libraries".

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
            // Custom styling for specific elements if needed
            p: ({children}) => <p className="mb-2 leading-relaxed">{children}</p>,
            h1: ({children}) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
            h2: ({children}) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
            h3: ({children}) => <h3 className="text-md font-bold mt-2 mb-1">{children}</h3>,
            ul: ({children}) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
            li: ({children}) => <li className="pl-1">{children}</li>,
            code: ({children}) => <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sm font-mono text-red-500">{children}</code>,
            blockquote: ({children}) => <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 dark:text-slate-400 my-2">{children}</blockquote>
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};