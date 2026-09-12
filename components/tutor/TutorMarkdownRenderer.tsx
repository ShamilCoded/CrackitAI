'use client';

import React from 'react';

interface TutorMarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses inline elements: math, code, bold, and italic without dropping text.
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match:
  // 1. Bold: \*\*(.+?)\*\* or __(.+?)__
  // 2. Inline code: `([^`]+)`
  // 3. Inline math: \$([^$]+)\$
  // 4. Italic: \*([^*]+)\* or _([^_]+)_
  const regex = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\$[^$]+\$|\*[^*]+\*|_[^_]+_)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold **...** or __...__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const boldText = part.slice(2, -2);
      // Recursively parse math/code inside bold if present
      return (
        <strong key={index} className="font-bold text-stone-900 dark:text-stone-50">
          {renderInlineMarkdown(boldText)}
        </strong>
      );
    }

    // Inline code `...`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const codeText = part.slice(1, -1);
      return (
        <code
          key={index}
          className="font-mono text-[11px] sm:text-xs text-teal-800 dark:text-teal-300 bg-stone-200/80 dark:bg-stone-900/90 px-1.5 py-0.5 rounded border border-stone-300/70 dark:border-stone-700"
        >
          {codeText}
        </code>
      );
    }

    // Inline math $...$
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const mathContent = part.slice(1, -1);
      return (
        <span
          key={index}
          className="font-mono text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/70 inline-block my-0.5"
        >
          {mathContent}
        </span>
      );
    }

    // Italic *...* or _..._
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      const italicText = part.slice(1, -1);
      return (
        <em key={index} className="italic text-stone-800 dark:text-stone-200">
          {renderInlineMarkdown(italicText)}
        </em>
      );
    }

    // Regular plain text
    return <span key={index}>{part}</span>;
  });
}

/**
 * Robust, high-contrast Markdown renderer specifically tailored for tutor dialogue.
 * Guarantees explicit readable foreground colors in both light and dark themes.
 */
export function TutorMarkdownRenderer({ content, className = '' }: TutorMarkdownRendererProps) {
  if (!content) {
    return null;
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let currentBulletList: string[] = [];
  let currentNumberedList: { num: string; text: string }[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushLists = () => {
    if (currentBulletList.length > 0) {
      const listItems = [...currentBulletList];
      currentBulletList = [];
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1 my-1.5 pl-1">
          {listItems.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-stone-800 dark:text-stone-100 text-xs sm:text-sm leading-relaxed"
            >
              <span className="text-teal-600 dark:text-teal-400 font-bold shrink-0 mt-0.5 text-xs select-none">
                &bull;
              </span>
              <span className="flex-1">{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (currentNumberedList.length > 0) {
      const listItems = [...currentNumberedList];
      currentNumberedList = [];
      elements.push(
        <ol key={`ol-${elements.length}`} className="space-y-1 my-1.5 pl-1">
          {listItems.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-stone-800 dark:text-stone-100 text-xs sm:text-sm leading-relaxed"
            >
              <span className="text-teal-700 dark:text-teal-400 font-mono font-bold text-xs shrink-0 mt-0.5 select-none">
                {item.num}.
              </span>
              <span className="flex-1">{renderInlineMarkdown(item.text)}</span>
            </li>
          ))}
        </ol>
      );
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check for code block fences ```
    if (trimmed.startsWith('```')) {
      flushLists();
      if (inCodeBlock) {
        // Closing code block
        elements.push(
          <pre
            key={`codeblock-${elements.length}`}
            className="p-2.5 rounded-lg bg-stone-900 text-stone-100 text-[11px] sm:text-xs font-mono overflow-x-auto my-1.5 border border-stone-700"
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        // Opening code block
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Empty line
    if (!trimmed) {
      flushLists();
      continue;
    }

    // Heading 3: ### Heading
    if (trimmed.startsWith('### ')) {
      flushLists();
      const headingText = trimmed.slice(4);
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-sm font-extrabold text-stone-950 dark:text-white mt-2.5 first:mt-0 mb-1 tracking-tight"
        >
          {renderInlineMarkdown(headingText)}
        </h3>
      );
      continue;
    }

    // Heading 2: ## Heading
    if (trimmed.startsWith('## ')) {
      flushLists();
      const headingText = trimmed.slice(3);
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-base font-extrabold text-stone-950 dark:text-white mt-3 first:mt-0 mb-1.5 tracking-tight"
        >
          {renderInlineMarkdown(headingText)}
        </h2>
      );
      continue;
    }

    // Heading 4: #### Heading
    if (trimmed.startsWith('#### ')) {
      flushLists();
      const headingText = trimmed.slice(5);
      elements.push(
        <h4
          key={`h4-${i}`}
          className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-2 first:mt-0 mb-0.5"
        >
          {renderInlineMarkdown(headingText)}
        </h4>
      );
      continue;
    }

    // Blockquote: > text
    if (trimmed.startsWith('> ')) {
      flushLists();
      const quoteText = trimmed.slice(2);
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-2 border-teal-500 pl-3 py-1 my-1.5 text-stone-700 dark:text-stone-200 italic bg-teal-50/40 dark:bg-teal-950/30 rounded-r text-xs sm:text-sm"
        >
          {renderInlineMarkdown(quoteText)}
        </blockquote>
      );
      continue;
    }

    // Bullet points: • or - or *
    const bulletMatch = trimmed.match(/^(?:•|-|\*)\s+(.*)$/);
    if (bulletMatch) {
      currentBulletList.push(bulletMatch[1]);
      continue;
    }

    // Numbered list: 1. or 2.
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      currentNumberedList.push({ num: numberedMatch[1], text: numberedMatch[2] });
      continue;
    }

    // Regular paragraph
    flushLists();
    elements.push(
      <p
        key={`p-${i}`}
        className="leading-relaxed text-stone-800 dark:text-stone-100 text-xs sm:text-sm my-1 first:mt-0 last:mb-0"
      >
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  }

  // Flush any lingering lists or unclosed code blocks
  flushLists();
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre
        key={`codeblock-${elements.length}`}
        className="p-2.5 rounded-lg bg-stone-900 text-stone-100 text-[11px] sm:text-xs font-mono overflow-x-auto my-1.5 border border-stone-700"
      >
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    );
  }

  return (
    <div
      className={`font-sans leading-relaxed text-stone-800 dark:text-stone-100 space-y-1 ${className}`}
    >
      {elements}
    </div>
  );
}
