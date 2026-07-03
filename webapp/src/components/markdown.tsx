'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Shared markdown renderer with dark, Blue-Team-styled elements. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm leading-relaxed text-zinc-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-2 text-xl font-bold text-white">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-lg font-semibold text-white">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3 text-base font-semibold text-emerald-400">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-3">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="text-zinc-300">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          a: ({ children, href }) => (
            <a href={href} className="text-emerald-400 underline" target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-emerald-300">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-emerald-500/50 bg-emerald-500/5 py-1 pl-4 text-zinc-400">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="border-b border-zinc-700">{children}</thead>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-medium text-zinc-300">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-zinc-800 px-3 py-2 text-zinc-400">{children}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}