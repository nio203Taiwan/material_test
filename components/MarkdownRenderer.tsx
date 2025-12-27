import React from 'https://esm.sh/react@18.3.1';
import ReactMarkdown from 'https://esm.sh/react-markdown@9.0.1?deps=react@18.3.1';
import remarkMath from 'https://esm.sh/remark-math@6.0.0';
import rehypeKatex from 'https://esm.sh/rehype-katex@7.0.0?deps=react@18.3.1';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (typeof content !== 'string') return null;
  
  return (
    <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-headings:font-mono prose-cyan">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};