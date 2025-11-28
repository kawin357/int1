import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';

interface CodeCanvasProps {
  code: string;
  language?: string;
  enableTyping?: boolean;
}

const CodeCanvas = ({ code, language = 'javascript', enableTyping = false }: CodeCanvasProps) => {
  const [displayedCode, setDisplayedCode] = useState(enableTyping ? '' : code);
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (!enableTyping) {
      setDisplayedCode(code);
      return;
    }

    let currentIndex = 0;
    setDisplayedCode('');

    const interval = setInterval(() => {
      if (currentIndex < code.length) {
        setDisplayedCode(code.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 0.5);

    return () => clearInterval(interval);
  }, [code, enableTyping]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Determine border color for Python and C code blocks
  const isSpecialLanguage = ['python', 'c'].includes(language.toLowerCase());
  const borderClass = isSpecialLanguage ? 'border-blue-700 dark:border-blue-500' : 'border-slate-200 dark:border-slate-700';
  const headerClass = 'bg-black text-white';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`w-full max-w-full overflow-hidden rounded-xl border-2 ${borderClass} bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300`}
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Header with Copy Button */}
      <div
        className={`flex items-center justify-between px-2 py-1 sm:px-3 sm:py-1.5 ${headerClass} relative overflow-hidden`}
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
        }}
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        />

        {/* Language Badge */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 relative z-10">
          <Code size={14} className="sm:w-4 sm:h-4 text-blue-400" />
          <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            {language}
          </span>
        </div>

        {/* Copy Button */}
        <motion.button
          onClick={handleCopy}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-all relative z-10"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} className="sm:w-4 sm:h-4 text-green-400" />
              <span className="text-xs text-green-400 font-medium hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} className="sm:w-4 sm:h-4 text-slate-300" />
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">Copy</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Code Content - X-axis scroll only when needed */}
      <div
        className="relative w-full code-canvas-wrapper"
        style={{
          maxWidth: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          maxHeight: 'none',
        }}
      >
        <style>{`
          /* CodeCanvas scrolling - Show X-axis scrollbar, hide Y-axis */
          .code-canvas-wrapper {
            overflow-y: hidden !important;
            overflow-x: auto !important;
            max-height: none !important;
          }
          
          /* Horizontal scrollbar styling - VISIBLE */
          .code-canvas-wrapper::-webkit-scrollbar {
            width: 0px !important;  /* No vertical scrollbar */
            height: 8px !important; /* Horizontal scrollbar visible */
          }
          
          .code-canvas-wrapper::-webkit-scrollbar-track {
            background: rgba(226, 232, 240, 0.8);
            border-radius: 4px;
          }
          
          .code-canvas-wrapper::-webkit-scrollbar-thumb {
            background: #94a3b8;
            border-radius: 4px;
            transition: background 0.2s;
          }
          
          .code-canvas-wrapper::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
          
          /* Firefox scrollbar */
          .code-canvas-wrapper {
            scrollbar-width: thin;
            scrollbar-color: #94a3b8 rgba(226, 232, 240, 0.8);
          }
          
          /* Prevent vertical scrolling in child elements */
          .code-canvas-wrapper *,
          .code-canvas-wrapper div,
          .code-canvas-wrapper pre,
          .code-canvas-wrapper code {
            overflow-y: hidden !important;
            max-height: none !important;
          }
          
          /* Hide vertical scrollbar components only */
          .code-canvas-wrapper *::-webkit-scrollbar-track-piece:vertical,
          .code-canvas-wrapper *::-webkit-scrollbar-button:vertical,
          .code-canvas-wrapper *::-webkit-scrollbar-corner {
            display: none !important;
          }
        `}</style>
        <SyntaxHighlighter
          language={language}
          style={theme === 'dark' ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: 'clamp(0.5rem, 2vw, 0.75rem)',
            fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)',
            lineHeight: '1.6',
            backgroundColor: 'transparent',
            fontWeight: '500',
            maxWidth: '100%',
            width: '100%',
            borderRadius: 0,
            whiteSpace: 'pre',
            wordBreak: 'normal',
            overflowWrap: 'normal',
            overflow: 'hidden',
          }}
          codeTagProps={{
            style: {
              fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)',
              fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
              whiteSpace: 'pre',
              display: 'block',
            }
          }}
          wrapLines={false}
          showLineNumbers={false}
          PreTag="div"
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </motion.div>
  );
};

export default CodeCanvas;
