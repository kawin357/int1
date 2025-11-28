import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Copy, Check, Mic, MicOff, AlertCircle, Edit2, X as CloseIcon, Square } from 'lucide-react';

const MotionButton = motion.button;
import { Message } from '@/types/chat';
import botLogo from '@/assets/bot-logo.webp';
import { parseMessageForCode } from '@/utils/codeParser';
import UnifiedMessageRenderer from './UnifiedMessageRenderer';
import ModelSelector, { AIModel } from './ModelSelector';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useIsMobile } from '@/hooks/use-mobile';
import { sanitizeChatMessage } from '@/utils/inputSanitizer';
import LoadingDots from './LoadingDots';
import BackgroundAnimation from './BackgroundAnimation';
import '../styles/scroll-fix.css';

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
  messages: Message[];
  isLoading: boolean;
  isAuthenticated: boolean;
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  onNewChat: () => void;
  onStopResponse?: () => void;
  loadingText?: string;
}

const ChatInterface = ({ onSendMessage, messages, isLoading, isAuthenticated, selectedModel, onModelChange, onNewChat, onStopResponse, loadingText = "Thinking..." }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [clickedMessageId, setClickedMessageId] = useState<string | null>(null);
  const [clickedAIMessageId, setClickedAIMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  useEffect(() => {
    maintainScrollPosition();
  }, [messages.length]);

  const isMobile = useIsMobile();
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const { isListening, transcript, isSupported: isSpeechRecognitionSupported, permissionDenied, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isSupported: isSpeechSynthesisSupported } = useSpeechSynthesis();

  // Keyboard detection for mobile
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !isMobile) return;

    const handleFocus = () => {
      document.body.classList.add('keyboard-open');
    };

    const handleBlur = () => {
      document.body.classList.remove('keyboard-open');
    };

    textarea.addEventListener('focus', handleFocus);
    textarea.addEventListener('blur', handleBlur);

    return () => {
      textarea.removeEventListener('focus', handleFocus);
      textarea.removeEventListener('blur', handleBlur);
    };
  }, [isMobile]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const maxLines = isMobile ? 2 : 7; // Reduced lines on mobile for fixed height
    const lineHeight = 24; // Adjusted for mobile
    const padding = 16;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate line count
    const lineCount = (input.match(/\n/g)?.length ?? 0) + 1;
    const maxHeight = isMobile ? 60 : (maxLines * lineHeight + padding); // Fixed 60px max on mobile

    // Set height based on content, capped at max
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;

    // Always hidden overflow on mobile, auto on desktop if exceeds
    textarea.style.overflowY = isMobile ? 'hidden' : (textarea.scrollHeight > maxHeight ? 'auto' : 'hidden');
  }, [input, isMobile]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive - force scroll
  useEffect(() => {
    // Force scroll to bottom when messages change, reset user scroll state
    setIsUserScrolling(false);
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Auto-scroll when typing completes
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(scrollToBottom, 200);
    }
  }, [isLoading]);

  // Scroll detection - simplified
  useEffect(() => {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        const isNearBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 100;
        setIsUserScrolling(!isNearBottom);
      }, 150);
    };

    messagesContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      messagesContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  // Continue generation in background when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Don't stop generation when tab becomes hidden
      // The API will continue processing in background
      if (document.hidden) {
        console.log('Tab hidden - generation continues in background');
      } else {
        if (isLoading) setTimeout(scrollToBottom, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLoading]);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Sanitize message before sending
      const sanitizedMessage = sanitizeChatMessage(input.trim());
      if (sanitizedMessage) {
        onSendMessage(sanitizedMessage);
        setInput('');
        resetTranscript();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      }
    }
  };



  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!isSpeechRecognitionSupported) {
        // console.error('Speech recognition not supported');
        return;
      }
      if (permissionDenied) {
        // console.error('Microphone permission denied');
        return;
      }
      startListening();
    }
  };

  const handleSpeak = (messageId: string, text: string) => {
    if (!isSpeechSynthesisSupported) {
      // console.error('Text-to-speech not supported');
      return;
    }

    if (speakingMessageId === messageId) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      stopSpeaking();
      setSpeakingMessageId(messageId);

      const parsed = parseMessageForCode(text);
      const cleanText = parsed.segments
        .filter((segment) => segment.type === 'text')
        .map((segment) => segment.content)
        .join('\n')
        .replace(/[*_~`#]/g, '');

      speak(cleanText);

      const checkSpeaking = setInterval(() => {
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          setSpeakingMessageId(null);
          clearInterval(checkSpeaking);
        }
      }, 200);

      setTimeout(() => {
        clearInterval(checkSpeaking);
        if (speakingMessageId === messageId) setSpeakingMessageId(null);
      }, 60000);
    }
  };

  const formatTime = (timestamp: Date | undefined) => {
    if (!timestamp) return '';

    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }

      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      const parsed = parseMessageForCode(content);
      const combinedText = parsed.segments
        .map((segment) => {
          if (segment.type === 'text') {
            // Clean HTML tags for plain text copy
            return segment.content
              .replace(/<[^>]+>/g, '')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&#x27;/g, "'")
              .replace(/&amp;/g, '&');
          }
          return segment.content;
        })
        .filter(Boolean)
        .join('\n\n');
      await navigator.clipboard.writeText(combinedText);
      setCopiedMessageId(messageId);
      setTimeout(() => {
        setCopiedMessageId(current => current === messageId ? null : current);
      }, 2000);
    } catch (err) {
      // console.error('Failed to copy:', err);
    }
  };


  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditText(content);
  };

  const handleSaveEdit = (messageId: string) => {
    if (editText.trim() && editText !== messages.find(m => m.id === messageId)?.content) {
      onSendMessage(editText.trim());
    }
    setEditingMessageId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const maintainScrollPosition = () => {
    const container = document.querySelector('.flex-1.overflow-y-auto');
    if (container) {
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
      if (isNearBottom) setTimeout(scrollToBottom, 100);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setClickedMessageId(null);
      setClickedAIMessageId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      {/* Background Animation */}
      <div className="fixed inset-0 -z-10">
        <BackgroundAnimation />
      </div>

      <div
        className="chat-container fixed inset-0 flex flex-col overflow-hidden bg-transparent"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100dvh', // Dynamic viewport height for mobile
          zIndex: 1,
        }}
      >
        {/* Messages Container - Scrollable */}
        <div
          ref={messagesContainerRef}
          className="chat-messages flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-4 py-2 sm:py-3"
          style={{
            paddingTop: isMobile ? '60px' : '100px',
            paddingBottom: isMobile ? '100px' : '140px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            height: '100%',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
          }}
          onScroll={() => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            setIsUserScrolling(true);
            scrollTimeoutRef.current = setTimeout(() => {
              const container = messagesContainerRef.current;
              if (container) {
                const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
                setIsUserScrolling(!isNearBottom);
              }
            }, 300);
          }}
        >
          <div className="max-w-4xl mx-auto space-y-0.5 sm:space-y-2 w-full overflow-x-hidden">
            <AnimatePresence>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-64 text-center space-y-4"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg">
                    <img src={botLogo} alt="AI" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" loading="eager" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 px-4 font-medium">
                      Ask me anything and I'll help with detailed responses
                    </p>
                  </div>
                </motion.div>
              )}

              {messages.map((message, index) => {
                const isLastAIMessage = message.type === 'ai' && index === messages.length - 1;
                const isResponseFinished = !isLoading || !isLastAIMessage;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      delay: isMobile ? 0 : index * 0.05 // No delay on mobile for better performance
                    }}
                    className="flex justify-center"
                  >
                    <div className="w-full max-w-4xl overflow-x-hidden">
                      <div
                        className={`flex ${message.type === 'user' ? isMobile ? 'flex-col items-end gap-0.5 px-4' : 'items-start gap-0 flex-row-reverse ml-auto' : isMobile ? 'flex-col items-start gap-2 px-4' : 'items-start gap-2 sm:gap-3 justify-start'} w-full overflow-x-hidden`}
                      >
                        {message.type === 'ai' && (
                          <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm ${isMobile ? 'ml-0' : ''}`}>
                            <img src={botLogo} alt="AI" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" loading="eager" />
                          </div>
                        )}
                        {message.type === 'user' && (
                          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-sm">
                            <User size={18} className="sm:w-5 sm:h-5 text-white" />
                          </div>
                        )}

                        <div className={`message-container group flex flex-col ${message.type === 'user' ? 'max-w-[85%] sm:max-w-[75%] items-end' : 'w-full max-w-full items-start'} relative z-30 overflow-x-hidden`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (message.type === 'user') {
                              setClickedMessageId(message.id === clickedMessageId ? null : message.id);
                            } else {
                              setClickedAIMessageId(message.id === clickedAIMessageId ? null : message.id);
                            }
                          }}
                          style={{ transition: 'none' }}
                        >
                          {/* Message Content - Direct Rendering */}
                          {message.type === 'ai' ? (
                            <div
                              className="relative w-full max-w-full"
                              onMouseEnter={() => {
                                if (!isMobile) setHoveredMessageId(message.id);
                              }}
                              onMouseLeave={() => {
                                if (!isMobile) setHoveredMessageId(null);
                              }}
                            >
                              <UnifiedMessageRenderer
                                key={`unified - ${message.id} `}
                                content={message.content}
                                messageId={message.id}
                                onSpeak={handleSpeak}
                                onCopy={handleCopyMessage}
                                speakingMessageId={speakingMessageId}
                                copiedMessageId={copiedMessageId}
                                isHovered={hoveredMessageId === message.id}
                                isMobile={isMobile}
                                clickedAIMessageId={clickedAIMessageId}
                              />
                            </div>
                          ) : (
                            <div
                              className="relative"
                              onMouseEnter={() => {
                                if (!isMobile) setHoveredMessageId(message.id);
                              }}
                              onMouseLeave={() => {
                                if (!isMobile) setHoveredMessageId(null);
                              }}
                            >
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-sm bg-white text-slate-900 ml-auto border border-blue-300 border-r-[2.5px] border-r-blue-400 max-w-full overflow-hidden transition-all duration-200 ${hoveredMessageId === message.id || clickedMessageId === message.id ? 'ring-2 ring-blue-400 shadow-lg bg-blue-50/30' : ''}`}
                                style={{
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  boxShadow: hoveredMessageId === message.id || clickedMessageId === message.id ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 2px 4px rgba(59, 130, 246, 0.08)',
                                  outline: '1px solid rgba(59, 130, 246, 0.15)',
                                  outlineOffset: '1px'
                                }}
                              >
                                <div
                                  className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap max-w-full"
                                  style={{
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word'
                                  }}
                                >
                                  {message.content}
                                </div>
                              </motion.div>

                              {/* Action buttons for user messages - Always reserve space */}
                              <div
                                className={`flex gap-2 mt-1 justify-end transition-opacity duration-200 ${((hoveredMessageId === message.id && !isMobile) || (clickedMessageId === message.id && isMobile))
                                  ? 'opacity-100'
                                  : 'opacity-0 pointer-events-none'
                                  }`}
                              >
                                {/* Copy Button */}
                                <MotionButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyMessage(message.content, message.id);
                                  }}
                                  className="p-1.5 hover:bg-green-100 rounded-lg transition-all duration-200 text-slate-600 hover:text-green-600 border border-green-200 bg-white shadow-md hover:shadow-lg z-[100]"
                                  title="Copy message"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check size={14} className="sm:w-4 sm:h-4 text-green-600" />
                                  ) : (
                                    <Copy size={14} className="sm:w-4 sm:h-4" />
                                  )}
                                </MotionButton>

                                {/* Edit Button */}
                                <MotionButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditMessage(message.id, message.content);
                                    setClickedMessageId(null);
                                    setHoveredMessageId(null);
                                  }}
                                  className="p-1.5 hover:bg-blue-100 rounded-lg transition-all duration-200 text-slate-600 hover:text-blue-600 border border-blue-200 bg-white shadow-md hover:shadow-lg z-[100]"
                                  title="Edit message"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Edit2 size={14} className="sm:w-4 sm:h-4" />
                                </MotionButton>
                              </div>
                            </div>
                          )}

                          <span className="text-xs text-slate-400 mt-1 px-1">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      </div>



                    </div>
                  </motion.div>
                );
              })}

              {/* Loading Animation - Bot Side with Delay */}
              {isLoading && (
                <motion.div
                  key="loading-indicator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: 1.5 }}
                  className="flex items-start space-x-2 sm:space-x-3 w-full max-w-4xl"
                >
                  {/* Bot Avatar */}
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
                    <img src={botLogo} alt="AI" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" loading="eager" />
                  </div>

                  {/* Loader Container */}
                  <div className="flex flex-col items-start gap-2">
                    {/* Rotating Border Loader with Dots */}
                    <LoadingDots />

                    {/* Loading Text - Dynamic */}
                    <p className="text-xs sm:text-sm text-slate-400">
                      {loadingText}
                    </p>
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {editingMessageId && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={handleCancelEdit}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Edit Message</h3>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all"
                        >
                          <CloseIcon size={20} className="text-slate-600 dark:text-slate-300" />
                        </button>
                      </div>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full min-h-[120px] p-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        autoFocus
                      />
                      <div className="flex justify-end gap-3 mt-4">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(editingMessageId)}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-primary to-secondary text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                          Send
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>


            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Container - Fixed at Bottom */}
        <motion.div
          className="chat-input-fixed"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 150,
            paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 10px)' : '0',
            backgroundColor: 'transparent',
            transform: 'translateZ(0)', // Force GPU acceleration to prevent scroll
            willChange: 'transform', // Optimize for animations
          }}
        >
          <div className={`max-w-4xl mx-auto ${isMobile ? 'px-2 py-0.5 mb-2' : 'px-4 py-2'}`}>
            <div
              className={`bg-white/20 backdrop-blur-[40px] backdrop-saturate-[180%] rounded-2xl border-2 border-cyan-400/60 shadow-lg ${isMobile ? 'p-2' : 'p-2'}`}
              style={{
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                backdropFilter: 'blur(40px) saturate(180%)',
              }}
            >
              {!isSpeechRecognitionSupported && (
                <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Voice features work best in Chrome or Safari
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="relative">
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="hidden sm:flex flex-shrink-0 items-center">
                    <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} />
                  </div>

                  <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1 flex-1 focus-within:border-blue-500 transition-all duration-200 min-w-0">
                    <div className="flex-shrink-0 sm:hidden">
                      <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} />
                    </div>

                    <div className="flex-1 relative min-w-0">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Listening..." : isMobile ? "Type here..." : "Type your message..."}
                        className="w-full bg-white text-sm sm:text-base text-black placeholder:text-slate-400 outline-none px-2 py-1.5 rounded-lg resize-none scrollbar-thin scrollbar-thumb-slate-300"
                        style={{
                          fontSize: '16px',
                          lineHeight: '20px',
                          minHeight: isMobile ? '30px' : '36px', // Reduced mobile height
                        }}
                        disabled={isLoading}
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (input.trim()) {
                              handleSubmit(e);
                            }
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <MotionButton
                        type="button"
                        onClick={toggleVoiceInput}
                        disabled={isLoading}
                        className={`flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 ${isListening
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-white/70 hover:bg-white/90 text-slate-600'
                          } rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        {isListening ? (
                          <MicOff size={16} className="sm:w-[18px] sm:h-[18px]" />
                        ) : (
                          <Mic size={16} className="sm:w-[18px] sm:h-[18px]" />
                        )}
                      </MotionButton>

                      {isLoading ? (
                        <MotionButton
                          type="button"
                          onClick={() => {
                            onStopResponse?.();
                          }}
                          className="flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          title="Stop"
                        >
                          <Square size={14} className="sm:w-4 sm:h-4" />
                        </MotionButton>
                      ) : (
                        <MotionButton
                          type="submit"
                          disabled={!input.trim() || isLoading}
                          className="flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-primary to-secondary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </MotionButton>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ChatInterface;
