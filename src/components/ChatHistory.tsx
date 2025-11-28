import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Trash2, MessageSquare, ArrowRight } from 'lucide-react';
import { ChatSession } from '@/types/chat';
import { getChatHistory, deleteChatFromHistory } from '@/services/chatHistory';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface ChatHistoryProps {
  onLoadChat: (session: ChatSession) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const ChatHistory = ({ 
  onLoadChat, 
  isOpen: externalIsOpen, 
  onClose: externalOnClose
}: ChatHistoryProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>(getChatHistory());

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnClose ? (value: boolean) => {
    if (!value) externalOnClose();
  } : setInternalIsOpen;

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChatFromHistory(sessionId);
    setHistory(getChatHistory());
  };

  const handleLoadChat = (session: ChatSession) => {
    onLoadChat(session);
    setIsOpen(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-[85%] sm:w-[400px] bg-slate-100 shadow-2xl z-[151] flex flex-col"
            >
              {/* Simple Header Bar */}
              <div className="flex-shrink-0 flex items-center justify-end p-3 sm:p-4 border-b border-slate-300 bg-slate-200/80">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full hover:bg-red-100 hover:text-red-600 transition-colors h-8 w-8"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* History Title Section */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b-2 border-slate-300 bg-slate-200/80 flex-shrink-0">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <History className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                  <h2 className="text-sm sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Chat History
                  </h2>
                </div>
              </div>

              <ScrollArea className="flex-1 p-3 sm:p-4 bg-slate-100">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
                    <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400" />
                    <p className="text-sm sm:text-base text-slate-600">
                      No chat history yet
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Start a conversation to see it here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative bg-white rounded-lg p-3 sm:p-4 hover:bg-slate-50 transition-all duration-200 border border-slate-300 shadow-sm hover:shadow-md cursor-pointer"
                        onClick={() => handleLoadChat(session)}
                      >
                        <div className="flex items-start justify-between space-x-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate mb-1">
                              {session.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500">
                              {session.messages.length} messages
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {formatDate(session.updatedAt)}
                            </p>
                          </div>
                          {index === 0 && (
                            <div className="flex items-center space-x-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLoadChat(session);
                                }}
                                className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                                title="Open chat"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleDelete(session.id, e)}
                                className="h-8 w-8 hover:bg-red-100 hover:text-red-600 text-red-500"
                                title="Delete chat"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatHistory;
