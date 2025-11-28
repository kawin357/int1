import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Volume2, VolumeX, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import CodeCanvas from './CodeCanvas';
import { parseMessageForCode } from '@/utils/codeParser';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface UnifiedMessageRendererProps {
  content: string;
  messageId: string;
  onSpeak: (messageId: string, text: string) => void;
  onCopy: (content: string, messageId: string) => void;
  speakingMessageId: string | null;
  copiedMessageId: string | null;
  isHovered: boolean;
  isMobile: boolean;
  clickedAIMessageId: string | null;
}

const UnifiedMessageRenderer = ({
  content,
  messageId,
  onSpeak,
  onCopy,
  speakingMessageId,
  copiedMessageId,
  isHovered,
  isMobile,
  clickedAIMessageId
}: UnifiedMessageRendererProps) => {
  const [localCopied, setLocalCopied] = useState(false);
  const parsed = parseMessageForCode(content);
  const segments = parsed.segments;

  const formatText = (text: string) => {
    // Extract and preserve links first
    const links: { [key: string]: string } = {};
    let linkCounter = 0;
    const textWithLinkPlaceholders = text.replace(/<a\s+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi, (match, href, linkText) => {
      const placeholder = `__LINK_${linkCounter}__`;
      links[placeholder] = match;
      linkCounter++;
      return placeholder;
    });

    // Clean HTML entities and preserve proper formatting
    let formatted = textWithLinkPlaceholders
      .replace(/&lt;strong&gt;/g, '<strong>')
      .replace(/&lt;\/strong\&gt;/g, '</strong>')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&')
      // Remove markdown bold characters and just make text bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
      // Remove markdown headers and just make text bold with larger size
      .replace(/^####\s+(.+)$/gm, '<h5 style="fontWeight: bold; fontSize: 14px; marginTop: 8px; marginBottom: 6px;">$1</h5>')
      .replace(/^###\s+(.+)$/gm, '<h4 style="fontWeight: bold; fontSize: 16px; marginTop: 12px; marginBottom: 8px;">$1</h4>')
      .replace(/^##\s+(.+)$/gm, '<h3 style="fontWeight: bold; fontSize: 18px; marginTop: 16px; marginBottom: 8px;">$1</h3>')
      .replace(/^#\s+(.+)$/gm, '<h2 style="fontWeight: bold; fontSize: 20px; marginTop: 16px; marginBottom: 8px;">$1</h2>');

    // Restore links AFTER markdown processing
    Object.entries(links).forEach(([placeholder, linkHtml]) => {
      formatted = formatted.replace(placeholder, linkHtml);
    });

    // Render LaTeX formulas before processing lines
    formatted = renderLatexInText(formatted);

    // Split by lines
    const lines = formatted.split('\n');
    const result: JSX.Element[] = [];
    let tableRows: string[][] = [];
    let isInTable = false;
    let tableHeaders: string[] = [];

    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();

      // Check if this is a table row
      if (/^\|.*\|$/.test(trimmedLine) && trimmedLine.includes('|')) {
        const cells = trimmedLine.split('|').filter(c => c.trim()).map(c => c.trim());

        // Check if this is a separator line
        const isSeparator = /^[\|\s\-:]+$/.test(trimmedLine);

        if (!isSeparator && cells.length > 1) {
          if (!isInTable) {
            // Start of table - this is the header
            isInTable = true;
            tableHeaders = cells;
          } else {
            // Table data row
            tableRows.push(cells);
          }
        }
      } else {
        // Not a table line - render accumulated table if any
        if (isInTable && tableHeaders.length > 0) {
          result.push(
            <div key={`table-${idx}`} className="my-3 overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full min-w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-200 dark:bg-slate-700">
                    {tableHeaders.map((cell, cellIdx) => {
                      const processedCell = cell
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .trim();
                      return (
                        <th
                          key={cellIdx}
                          className="px-2 py-1.5 sm:px-3 sm:py-2 border border-slate-300 dark:border-slate-600 font-bold text-left text-xs sm:text-sm"
                          dangerouslySetInnerHTML={{ __html: processedCell }}
                        />
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-slate-300 dark:border-slate-600">
                      {row.map((cell, cellIdx) => {
                        const processedCell = cell
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .trim();
                        return (
                          <td
                            key={cellIdx}
                            className="px-2 py-1.5 sm:px-3 sm:py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm"
                            dangerouslySetInnerHTML={{ __html: processedCell }}
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          // Reset table state
          isInTable = false;
          tableRows = [];
          tableHeaders = [];
        }

        // Render non-table content
        if (!trimmedLine) {
          result.push(<br key={idx} />);
        } else if (trimmedLine.includes('<h') && trimmedLine.includes('</h')) {
          result.push(
            <div
              key={idx}
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: trimmedLine }}
            />
          );
        } else if (/<[^>]+>/.test(trimmedLine)) {
          result.push(
            <div
              key={idx}
              className="my-1.5 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: trimmedLine
              }}
              style={{
                wordBreak: 'break-word'
              }}
            />
          );
        } else if (trimmedLine.startsWith('• ') || trimmedLine.match(/^\d+\.\s/)) {
          result.push(
            <div key={idx} className="my-1.5 ml-4 leading-relaxed">
              {trimmedLine}
            </div>
          );
        } else {
          result.push(<div key={idx} className="my-1.5 leading-relaxed">{trimmedLine}</div>);
        }
      }
    });

    // Render any remaining table at the end
    if (isInTable && tableHeaders.length > 0) {
      result.push(
        <div key="table-end" className="my-3 overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full min-w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-200 dark:bg-slate-700">
                {tableHeaders.map((cell, cellIdx) => {
                  const processedCell = cell
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .trim();
                  return (
                    <th
                      key={cellIdx}
                      className="px-2 py-1.5 sm:px-3 sm:py-2 border border-slate-300 dark:border-slate-600 font-bold text-left text-xs sm:text-sm"
                      dangerouslySetInnerHTML={{ __html: processedCell }}
                    />
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-slate-300 dark:border-slate-600">
                  {row.map((cell, cellIdx) => {
                    const processedCell = cell
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .trim();
                    return (
                      <td
                        key={cellIdx}
                        className="px-2 py-1.5 sm:px-3 sm:py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm"
                        dangerouslySetInnerHTML={{ __html: processedCell }}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return result;
  };

  // Function to render LaTeX formulas in text
  const renderLatexInText = (text: string): string => {
    try {
      // Replace display math \[ ... \] with rendered KaTeX
      text = text.replace(/\\\[([^\]]+)\\\]/g, (match, formula) => {
        try {
          const html = katex.renderToString(formula.trim(), {
            displayMode: true,
            throwOnError: false,
            output: 'html',
            strict: false,
          });
          return `<div class="katex-display my-3">${html}</div>`;
        } catch (e) {
          console.error('KaTeX display error:', e);
          return `<div class="katex-error my-3">\\[${formula}\\]</div>`;
        }
      });

      // Replace inline math \( ... \) with rendered KaTeX
      text = text.replace(/\\\(([^\)]+)\\\)/g, (match, formula) => {
        try {
          const html = katex.renderToString(formula.trim(), {
            displayMode: false,
            throwOnError: false,
            output: 'html',
            strict: false,
          });
          return `<span class="katex-inline">${html}</span>`;
        } catch (e) {
          console.error('KaTeX inline error:', e);
          return `\\(${formula}\\)`;
        }
      });

      return text;
    } catch (error) {
      console.error('LaTeX rendering error:', error);
      return text;
    }
  };

  const processInlineFormatting = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    // Bold text **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="font-bold text-slate-900">{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const handleLocalCopy = async () => {
    try {
      const parsed = parseMessageForCode(content);
      const combinedText = parsed.segments
        .map((segment) => {
          if (segment.type === 'text') {
            return segment.content
              .replace(/<[^>]+>/g, '')
              .replace(/</g, '<')
              .replace(/>/g, '>')
              .replace(/"/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&#x27;/g, "'")
              .replace(/&amp;/g, '&');
          }
          return segment.content;
        })
        .filter(Boolean)
        .join('\n\n');
      await navigator.clipboard.writeText(combinedText);
      setLocalCopied(true);
      setTimeout(() => setLocalCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleLocalSpeak = () => {
    const parsed = parseMessageForCode(content);
    const cleanText = parsed.segments
      .filter((segment) => segment.type === 'text')
      .map((segment) => segment.content)
      .join('\n')
      .replace(/[*_~`#]/g, '');

    onSpeak(messageId, cleanText);
  };

  const handleLocalShare = async () => {
    const textContent = content.replace(/<[^>]+>/g, '').trim();
    // Limit text length for URL to prevent issues (WhatsApp has URL length limits)
    const truncatedText = textContent.length > 500 ? textContent.substring(0, 500) + '...' : textContent;
    const encodedText = encodeURIComponent(truncatedText);
    const shareUrl = `${window.location.origin}${window.location.pathname}`;
    const encodedUrl = encodeURIComponent(shareUrl);

    if (navigator.share) {
      try {
        await navigator.share({
          title: '📚 chatz.IO Response',
          text: textContent, // Share FULL response
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled:', err);
      }
    } else {
      // Fallback: Share to WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodedText}%20-%20${encodedUrl}`;

      // Open in same tab for proper navigation
      window.location.href = whatsappUrl;
    }
  };

  return (
    <div className="relative w-full">
      {/* Render segments in their original order - mixed content and code */}
      <div className="space-y-3 w-full">
        {parsed.segments.map((segment, idx) => {
          if (segment.type === 'text') {
            // Render text segment
            return (
              <div key={`segment-wrapper-${idx}`} className="w-full overflow-x-hidden max-w-full">
                <motion.div
                  key={`segment-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl shadow-sm bg-white text-slate-900 border border-emerald-300 border-l-[2.5px] border-l-emerald-400 overflow-x-hidden w-full max-w-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 2px 4px rgba(5, 150, 105, 0.08)',
                    outline: '1px solid rgba(5, 150, 105, 0.15)',
                    outlineOffset: '1px'
                  }}
                >
                  <div className="px-2 py-2 sm:px-4 sm:py-3 w-full overflow-x-hidden max-w-full">
                    <div className="prose prose-sm sm:prose max-w-none overflow-x-hidden w-full">
                      {formatText(segment.content)}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          } else if (segment.type === 'code') {
            // Render code segment
            return (
              <div key={`segment-${idx}`} className="w-full overflow-x-hidden max-w-full my-2">
                <CodeCanvas
                  code={segment.content}
                  language={segment.language}
                />
              </div>
            );
          }
          return null;
        })}


        {/* Action buttons for AI messages - Always reserve space, fade in/out smoothly */}
        <div
          className={`flex gap-2 mt-1 transition-opacity duration-200 ${((isHovered && !isMobile) || (clickedAIMessageId === messageId && isMobile))
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
            }`}
        >
          {/* Copy Button */}
          <motion.button
            onClick={handleLocalCopy}
            className="p-1.5 hover:bg-green-100 rounded-lg transition-all duration-200 text-slate-600 hover:text-green-600 border border-green-200 bg-white shadow-md hover:shadow-lg"
            title="Copy message"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {localCopied || copiedMessageId === messageId ? (
              <Check size={14} className="sm:w-4 sm:h-4 text-green-600" />
            ) : (
              <Copy size={14} className="sm:w-4 sm:h-4" />
            )}
          </motion.button>

          {/* Speak Button */}
          <motion.button
            onClick={handleLocalSpeak}
            className="p-1.5 hover:bg-purple-100 rounded-lg transition-all duration-200 text-slate-600 hover:text-purple-600 border border-purple-200 bg-white shadow-md hover:shadow-lg"
            title="Read aloud"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {speakingMessageId === messageId ? (
              <VolumeX size={14} className="sm:w-4 sm:h-4 text-purple-600" />
            ) : (
              <Volume2 size={14} className="sm:w-4 sm:h-4" />
            )}
          </motion.button>

          {/* Share Button */}
          <motion.button
            onClick={handleLocalShare}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-all duration-200 text-slate-600 hover:text-blue-600 border border-blue-200 bg-white shadow-md hover:shadow-lg"
            title="Share"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 size={14} className="sm:w-4 sm:h-4" />
          </motion.button>
        </div>
      </div>

    </div>
  );
};

export default UnifiedMessageRenderer;