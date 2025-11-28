import { ChatSession, Message } from '@/types/chat';

const STORAGE_KEY = 'chatHistory';

export const generateChatTitle = (messages: Message[]): string => {
  if (messages.length === 0) return 'New Chat';

  const firstUserMessage = messages.find(m => m.type === 'user');
  if (!firstUserMessage) return 'New Chat';

  const content = firstUserMessage.content.trim();
  const words = content.split(' ').slice(0, 5).join(' ');
  return words.length > 40 ? words.substring(0, 40) + '...' : words;
};

export const saveChatToHistory = (session: ChatSession): void => {
  try {
    const history = getChatHistory();
    const existingIndex = history.findIndex(s => s.id === session.id);

    if (existingIndex >= 0) {
      history[existingIndex] = session;
    } else {
      history.unshift(session);
    }

    const limitedHistory = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
// console.('Error saving chat to history:', error);
  }
};

export const getChatHistory = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored);
    return history.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  } catch (error) {
// console.('Error loading chat history:', error);
    return [];
  }
};

export const deleteChatFromHistory = (sessionId: string): void => {
  try {
    const history = getChatHistory();
    const filtered = history.filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
// console.('Error deleting chat from history:', error);
  }
};

export const clearChatHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
// console.('Error clearing chat history:', error);
  }
};
