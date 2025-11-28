export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'code'; content: string; language: string };

export interface ParsedMessage {
  segments: MessageSegment[];
  hasCode: boolean;
  isCodingRelated: boolean;
  userRequest?: string; // Track original user request
  responseType?: 'coding' | 'general'; // Categorize response type
}

const CODE_BLOCK_REGEX = /(```|~~~)([^\n]*)\n([\s\S]*?)\1/g;

// Enhanced code detection patterns
const CODE_INDICATORS = [
  /\b(function|const|let|var|class|interface|import|export|def|return|if|else|for|while|try|catch)\b/,
  /[{}();=<>[\]]/,
  /\b(console\.log|print|printf|System\.out)/,
  /^\s*(def|function|class|import|export|const|let|var)\s+/m,
];

// Enhanced coding detection with better accuracy
const isCodingRelated = (content: string): boolean => {
  const lowerContent = content.toLowerCase();
  const codingKeywords = [
    'code', 'programming', 'function', 'variable', 'algorithm', 'syntax',
    'debug', 'error', 'bug', 'compile', 'script', 'javascript', 'python',
    'java', 'react', 'node', 'html', 'css', 'api', 'database', 'sql',
    'array', 'object', 'class', 'method', 'framework', 'library',
    'component', 'props', 'state', 'hook', 'typescript', 'jsx', 'tsx',
    'write', 'create', 'build', 'make', 'generate', 'show', 'fix',
    'implement', 'develop', 'program', 'script', 'application', 'app',
    'software', 'web', 'mobile', 'backend', 'frontend', 'fullstack'
  ];

  // Check for code patterns and keywords
  const hasKeywords = codingKeywords.some(keyword => lowerContent.includes(keyword));
  const hasCodePatterns = CODE_INDICATORS.some(pattern => pattern.test(content));
  const hasCodeBlocks = /(```|~~~)[\s\S]*?\1/.test(content);

  // Additional check for coding questions
  const codingQuestionPatterns = [
    /\bhow\s+to\b.*\b(code|program|implement|create|build|write)\b/i,
    /\b(write|create|build|make|generate)\s+.*\bcode\b/i,
    /\bcode\s+for\b.*\b(function|class|component|program)\b/i,
    /\bimplement\s+.*\b(in|using|with)\b.*\b(javascript|python|java|react|html|css)\b/i
  ];

  const hasCodingQuestions = codingQuestionPatterns.some(pattern => pattern.test(content));

  return hasKeywords || hasCodePatterns || hasCodeBlocks || hasCodingQuestions;
};

// Enhanced language detection with React support
const detectLanguage = (code: string): string => {
  // React/JSX patterns (check first)
  if (/\breturn\s*\(|<\w+[^>]*>|\bReact\.|\buseState|\buseEffect|\bprops\.|className=/.test(code)) {
    return /\b(interface|type)\s+\w+|:\s*React\.|:\s*(string|number|boolean)/.test(code) ? 'tsx' : 'jsx';
  }

  // HTML patterns
  if (/<\/?[a-z][\s\S]*>/i.test(code) && /<\/(html|body|div|p|span|h[1-6])>/i.test(code)) return 'html';

  // CSS patterns
  if (/\{[^}]*\}|\.[a-z-]+\s*\{|#[a-z-]+\s*\{|@media|@import/.test(code)) return 'css';

  // Python patterns
  if (/\bdef\s+\w+\s*\(|\bimport\s+\w+|\bfrom\s+\w+\s+import|\bprint\s*\(/.test(code)) return 'python';

  // JavaScript/TypeScript patterns
  if (/\b(const|let|var)\s+\w+|\bfunction\s+\w+|\bconsole\.log|=>/.test(code)) {
    return /\b(interface|type)\s+\w+|:\s*\w+\[\]|:\s*(string|number|boolean)/.test(code) ? 'typescript' : 'javascript';
  }

  // Java patterns
  if (/\bpublic\s+(class|static)|\bSystem\.out\.print/.test(code)) return 'java';

  // SQL patterns
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(code)) return 'sql';

  // JSON patterns
  if (/^\s*[{\[]/.test(code.trim()) && /[}\]]\s*$/.test(code.trim())) {
    try { JSON.parse(code); return 'json'; } catch { /* not json */ }
  }

  return 'javascript';
};



// Enhanced auto-detection of code blocks in text
const detectInlineCode = (text: string): Array<{ start: number; end: number; code: string; language: string }> => {
  const codeBlocks: Array<{ start: number; end: number; code: string; language: string }> = [];

  // Enhanced pattern for code-like content
  const codeLinePattern = /^[\s]*(?:function|const|let|var|class|def|import|export|if|for|while|return|console|print|\w+\s*[=:]|[{}();])[\s\S]{0,300}$/gm;
  let match;

  while ((match = codeLinePattern.exec(text)) !== null) {
    const start = match.index;
    let end = start + match[0].length;

    // Get surrounding context to build complete code block
    const lines = text.substring(start).split('\n');
    let codeLines = [lines[0]];

    // Look ahead for more code-like lines
    for (let i = 1; i < Math.min(lines.length, 100); i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check if this line or nearby lines contain LaTeX formulas
      const isLaTeXContext =
        /\\[\[\(]/.test(line) ||                    // LaTeX delimiters \[ or \(
        /\$\$/.test(line) ||                        // Display math $$
        /\\(frac|sqrt|sum|int|cdot|times|div)/.test(line) || // LaTeX commands
        (i > 0 && /\\[\[\(]/.test(lines[i - 1])) ||  // Previous line has LaTeX
        (i < lines.length - 1 && /\\[\[\(]/.test(lines[i + 1])); // Next line has LaTeX

      // Include empty lines and code-like patterns, BUT exclude LaTeX formulas
      if (!isLaTeXContext && (trimmedLine === '' ||
        ((/^[\s]*(?:[{}();=<>[\]]|function|const|let|var|class|def|if|for|while|return|\w+\s*[=:]|[\w.]+\([^)]*\))/.test(line) ||
          /^[\s]*[\w.]+\s*[=:]/.test(line) ||
          /^[\s]*[})]/.test(line))))) {
        codeLines.push(line);
        end = start + codeLines.join('\n').length;
      } else if (codeLines.length > 2) {
        // Stop if we have enough code lines and hit non-code content
        break;
      }
    }

    // Include code blocks that are substantial enough
    if (codeLines.length > 1 || codeLines[0].length > 15) {
      const code = codeLines.join('\n').trim();
      const language = detectLanguage(code);

      codeBlocks.push({ start, end, code, language });
    }
  }

  return codeBlocks;
};

const sanitizeInlineHtml = (value: string): string => {
  // Decode HTML entities and preserve formatting
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .trim();
};

export const parseMessageForCode = (content: string): ParsedMessage => {
  if (!content || content.trim() === '') {
    return { segments: [], hasCode: false, isCodingRelated: false };
  }

  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let hasCodeBlock = false;

  // Reset regex lastIndex to ensure fresh search
  CODE_BLOCK_REGEX.lastIndex = 0;

  // First, extract markdown code blocks
  while ((match = CODE_BLOCK_REGEX.exec(content)) !== null) {
    hasCodeBlock = true;
    const fullMatch = match[0];
    const languageRaw = (match[2] || '').trim();
    const rawCode = (match[3] || '').trim();
    const precedingText = content.slice(lastIndex, match.index);

    // Always preserve preceding text
    if (precedingText.trim()) {
      segments.push({
        type: 'text',
        content: sanitizeInlineHtml(precedingText.trim()),
      });
    }

    // Single code block with proper language detection
    if (rawCode) {
      const detectedLanguage = languageRaw || detectLanguage(rawCode);
      segments.push({
        type: 'code',
        content: rawCode,
        language: detectedLanguage.toLowerCase(),
      });
    }

    lastIndex = match.index + fullMatch.length;
  }

  const remainingText = content.slice(lastIndex);

  // Always preserve remaining text - never collapse content
  if (remainingText.trim()) {
    // Check if remaining text contains code patterns
    if (!hasCodeBlock && isCodingRelated(remainingText)) {
      const inlineCodeBlocks = detectInlineCode(remainingText);

      if (inlineCodeBlocks.length > 0) {
        let textIndex = 0;
        inlineCodeBlocks.forEach(block => {
          // Add text before code block
          if (block.start > textIndex) {
            const textBefore = remainingText.slice(textIndex, block.start).trim();
            if (textBefore) {
              segments.push({
                type: 'text',
                content: sanitizeInlineHtml(textBefore),
              });
            }
          }

          // Add detected code block with proper language detection
          segments.push({
            type: 'code',
            content: block.code,
            language: detectLanguage(block.code),
          });

          textIndex = block.end;
        });

        // Add any remaining text after last code block
        if (textIndex < remainingText.length) {
          const finalText = remainingText.slice(textIndex).trim();
          if (finalText) {
            segments.push({
              type: 'text',
              content: sanitizeInlineHtml(finalText),
            });
          }
        }
      } else {
        // No inline code detected, add as text
        segments.push({
          type: 'text',
          content: sanitizeInlineHtml(remainingText.trim()),
        });
      }
    } else {
      // Add remaining text as normal text
      segments.push({
        type: 'text',
        content: sanitizeInlineHtml(remainingText.trim()),
      });
    }
  }

  // Ensure at least one segment exists to prevent empty responses
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: sanitizeInlineHtml(content.trim()),
    });
  }

  const hasCode = segments.some(s => s.type === 'code');
  const isCodingRelatedQuery = isCodingRelated(content);

  return { segments, hasCode, isCodingRelated: isCodingRelatedQuery };
};

export const hasCodeBlock = (content: string): boolean => {
  return /(```|~~~)[\s\S]*?\1/.test(content);
};

// Helper function to identify user coding requests
export const isUserCodingRequest = (content: string): boolean => {
  const lowerContent = content.toLowerCase();
  const codingRequestPatterns = [
    /\b(write|create|build|make|generate|show|fix|debug|help with|solve)\s+.*\b(code|function|component|script|program|algorithm)\b/,
    /\b(how to|can you|please)\s+.*\b(code|program|implement|create|build)\b/,
    /\berror\b.*\bcode\b|\bbug\b.*\bfix\b/,
    /\bimplement\b|\brefactor\b|\boptimize\b/
  ];

  return codingRequestPatterns.some(pattern => pattern.test(lowerContent)) || isCodingRelated(content);
};
