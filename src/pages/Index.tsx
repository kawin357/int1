
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Message, ChatSession } from '@/types/chat';
import { generateAIResponse } from '@/services/chatService';
import { generateChatTitle, saveChatToHistory } from '@/services/chatHistory';
import ChatInterface from '@/components/ChatInterface';
import ChatHistory from '@/components/ChatHistory';
import AuthModal from '@/components/AuthModal';
import ContactModal from '@/components/ContactModal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WelcomeScreen from '@/components/WelcomeScreen';
import BackgroundAnimation from '@/components/BackgroundAnimation';
import Network3D from '@/components/Network3D';
import { initializeSEO, getHomePageSEO, getOrganizationSchema, getWebApplicationSchema } from '@/utils/seo';
import botLogo from '@/assets/bot-logo.webp';

import { AIModel } from '@/components/ModelSelector';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChatting, setHasStartedChatting] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('int');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('Thinking...');

  // Initialize SEO on component mount
  useEffect(() => {
    const organizationSchema = getOrganizationSchema();
    const webAppSchema = getWebApplicationSchema();
    const seoConfig = getHomePageSEO();

    // Combine schemas
    const combinedSchema = {
      '@context': 'https://schema.org',
      '@graph': [organizationSchema, webAppSchema]
    };

    initializeSEO(seoConfig, combinedSchema);
  }, []);

  // Restore chat state from localStorage on mount
  useEffect(() => {
    try {
      const savedChatState = localStorage.getItem('chatState');
      if (savedChatState) {
        const { messages: savedMessages, hasStartedChatting: savedChatting } = JSON.parse(savedChatState);
        if (savedMessages && savedMessages.length > 0) {
          // Convert timestamp strings back to Date objects
          const messagesWithDates = savedMessages.map((msg: Message) => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
          }));
          setMessages(messagesWithDates);
          setHasStartedChatting(savedChatting || true);
        }
      }
    } catch (error) {
      console.error('Error restoring chat state:', error);
    }
  }, []);

  // Save chat state to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Convert Date objects to ISO strings for storage
        const messagesToSave = messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
        }));

        localStorage.setItem('chatState', JSON.stringify({
          messages: messagesToSave,
          hasStartedChatting
        }));
      } catch (error) {
        console.error('Error saving chat state:', error);
      }
    }
  }, [messages, hasStartedChatting]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);

      // Ensure loading screen shows for at least 2 seconds
      const minLoadingTime = 400;
      const loadStartTime = Date.now();

      setTimeout(() => {
        const elapsed = Date.now() - loadStartTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsed);

        setTimeout(() => {
          setAuthLoading(false);
        }, remainingTime);
      }, 0);

      // Don't clear messages on user change - keep chat state
    });

    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!currentSessionId) {
      setCurrentSessionId(Date.now().toString());
    }

    setHasStartedChatting(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      type: 'user',
      timestamp: new Date(),
      userId: user.uid
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Check if query is simple (instant response expected)
    const isSimpleQuery = content.length < 100 && (
      /^(hi|hello|hey|thanks|thank you|bye|goodbye)$/i.test(content.trim()) ||
      content.toLowerCase().includes('who are you') ||
      content.toLowerCase().includes('tell me about you') ||
      content.toLowerCase().includes('introduce yourself') ||
      content.toLowerCase().includes('who developed') ||
      content.toLowerCase().includes('ceo') ||
      content.toLowerCase().includes('founder') ||
      content.toLowerCase().includes('about company')
    );

    // Show loader immediately for complex queries, delay for simple ones
    let loaderTimeout: NodeJS.Timeout | null = null;
    if (isSimpleQuery) {
      // No loader for simple queries - instant response expected
    } else {
      // Show loader immediately for complex queries
      // Show loader immediately for complex queries
      setIsLoading(true);
      setLoadingStatus('Thinking...');
    }

    try {
      // Create abort controller for this request
      const controller = new AbortController();
      setAbortController(controller);

      // Generate response
      const aiResponse = await generateAIResponse(
        updatedMessages,
        selectedModel,
        controller.signal,
        (status) => setLoadingStatus(status)
      );

      if (!aiResponse) {
        throw new Error('No response from AI service');
      }

      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMessageId,
        content: '',
        type: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      if (typeof aiResponse === 'object' && 'getReader' in aiResponse) {
        // Handle streaming response with real-time updates
        const reader = (aiResponse as ReadableStream<Uint8Array>).getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    accumulatedContent += content;
                    // Real-time update - ChatGPT style streaming
                    setMessages(prev => prev.map(msg =>
                      msg.id === aiMessageId ? {
                        ...msg,
                        content: accumulatedContent
                      } : msg
                    ));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else if (typeof aiResponse === 'string') {
        // Handle instant response (simple queries)
        if (isSimpleQuery) {
          // Instant display for simple queries
          setMessages(prev => prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, content: aiResponse } : msg
          ));
        } else {
          // Direct display for non-streaming responses
          setMessages(prev => prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, content: aiResponse } : msg
          ));
        }
      } else {
        throw new Error('Invalid response from AI service');
      }

      // Get final messages after streaming is complete
      const finalMessages = [...updatedMessages, {
        id: aiMessageId,
        content: typeof aiResponse === 'string' ? aiResponse : '',
        type: 'ai' as const,
        timestamp: new Date()
      }];

      // Save to history after a delay to ensure content is complete
      setTimeout(() => {
        setMessages(currentMessages => {
          const sessionToSave: ChatSession = {
            id: currentSessionId || Date.now().toString(),
            userId: user.uid,
            title: generateChatTitle(currentMessages),
            messages: currentMessages,
            createdAt: new Date(parseInt(currentSessionId) || Date.now()),
            updatedAt: new Date(),
          };
          saveChatToHistory(sessionToSave);
          return currentMessages;
        });
      }, 500);
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      if (loaderTimeout) clearTimeout(loaderTimeout);
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleStopResponse = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 relative overflow-hidden">
        {/* Network3D Background - same as home page */}
        <div className="fixed inset-0 -z-30 bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
          <Network3D />
        </div>

        {/* Grid pattern overlay */}
        <div className="fixed inset-0 -z-20 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="loading-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#loading-grid)" />
          </svg>
        </div>

        {/* Floating mathematical symbols */}
        <div className="fixed inset-0 -z-15 overflow-hidden pointer-events-none">
          <div className="absolute top-[15%] left-[10%] text-6xl text-blue-400/15 animate-float drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]" style={{ animationDelay: '0s' }}>∑</div>
          <div className="absolute top-[25%] right-[15%] text-5xl text-purple-400/15 animate-float drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]" style={{ animationDelay: '1s' }}>∫</div>
          <div className="absolute bottom-[20%] left-[20%] text-7xl text-green-400/15 animate-float drop-shadow-[0_0_25px_rgba(34,197,94,0.3)]" style={{ animationDelay: '2s' }}>π</div>
          <div className="absolute top-[60%] right-[25%] text-6xl text-indigo-400/15 animate-float drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]" style={{ animationDelay: '1.5s' }}>∞</div>
          <div className="absolute bottom-[35%] right-[10%] text-5xl text-teal-400/15 animate-float drop-shadow-[0_0_20px_rgba(20,184,166,0.3)]" style={{ animationDelay: '0.5s' }}>√</div>
          <div className="absolute top-[40%] left-[15%] text-6xl text-cyan-400/15 animate-float drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]" style={{ animationDelay: '2.5s' }}>α</div>

          <div className="absolute top-[50%] left-[50%] w-64 h-64 bg-blue-400/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-[20%] right-[20%] w-48 h-48 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Main loading content */}
        <div className="relative z-10 text-center px-4">
          {/* Company Logo with pulse animation */}
          <div className="mb-6">
            <img
              src={botLogo}
              alt="chatz.IO Logo"
              className="w-24 h-24 md:w-32 md:h-32 mx-auto drop-shadow-2xl"
            />
          </div>

          {/* Logo text with gradient - same style as home page */}
          <div className="mb-8 relative">
            <h1 className="relative text-6xl md:text-7xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent animate-gradient-x">
              chatz.IO
            </h1>
          </div>

          {/* Loading spinner */}
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-blue-200/40 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-emerald-600 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin-reverse"></div>
            </div>
          </div>

          {/* Loading text - same color as home page */}
          <p className="text-slate-800 text-lg font-semibold mb-2 animate-pulse">
            Initializing AI Experience
          </p>

          {/* Loading dots */}
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>

        {/* Add custom animations in style tag */}
        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
            }
            50% {
              transform: translateY(-20px) rotate(5deg);
            }
          }
          @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 5s ease infinite;
          }
          .animate-spin-reverse {
            animation: spin-reverse 1.5s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  const handleGoToWelcome = () => {
    setHasStartedChatting(false);
    setMessages([]);
    setCurrentSessionId('');
    localStorage.removeItem('chatState'); // Clear saved chat state
  };

  const handleNewChat = () => {
    setMessages([]);
    setHasStartedChatting(false);
    setCurrentSessionId('');
    localStorage.removeItem('chatState'); // Clear saved chat state
  };

  const handleLoadChat = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setHasStartedChatting(true);
  };

  return (
    <div className="flex flex-col h-screen relative overflow-x-hidden">
      {/* Enhanced 3D Background Animation - Hidden when contact is open */}
      {!isContactOpen && <BackgroundAnimation />}
      <Header
        user={user}
        onAuthClick={() => setShowAuthModal(true)}
        onGoToWelcome={handleGoToWelcome}
        isChatActive={hasStartedChatting}
        isWelcomeScreen={!hasStartedChatting}
        onNewChat={handleNewChat}
        onOpenHistory={() => setShowHistoryModal(true)}
        isHidden={(showHistoryModal && !hasStartedChatting) || isContactOpen}
        onContactOpen={setIsContactOpen}
      />

      <ChatHistory
        onLoadChat={handleLoadChat}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      {!isContactOpen && (
        <>
          <main className="flex-1 flex flex-col w-full">
            {!hasStartedChatting ? (
              <WelcomeScreen
                user={user}
                onSendMessage={handleSendMessage}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            ) : (
              <ChatInterface
                onSendMessage={handleSendMessage}
                messages={messages}
                isLoading={isLoading}
                isAuthenticated={!!user}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onNewChat={handleNewChat}
                onStopResponse={handleStopResponse}
                loadingText={loadingStatus}
              />
            )}
          </main>

          <Footer isVisible={!hasStartedChatting} />
        </>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Contact Modal Overlay */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

    </div>
  );
};

export default Index;
