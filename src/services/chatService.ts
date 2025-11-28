import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { Message, ChatSession } from '@/types/chat';
import { sendToNvidiaAPI, NvidiaMessage } from './nvapi';

// HTML entity decoder
const decodeHtmlEntities = (text: string): string => {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®');
};

// Formula post-processor - converts code blocks with formulas to LaTeX
const processFormulas = (text: string): string => {
  // Remove code blocks that contain mathematical formulas
  // Pattern: ```javascript\n formula content \n```
  text = text.replace(/```(?:javascript|css|python|java|c\+\+|code)\s*\n([^`]*?(?:=|\\frac|\\lambda|\\alpha|\\beta|\\gamma|\\delta|\\theta|\\pi|\\sigma|\\omega|\\sum|\\int|\\sqrt|\\Delta|\\nabla)[^`]*?)\n```/gi, (match, formula) => {
    // Extract the formula content
    const cleanFormula = formula.trim();

    // Check if it looks like a math formula (contains =, Greek letters, or math symbols)
    if (cleanFormula.match(/[=+\-*/^]|\\[a-zA-Z]+/)) {
      // Convert to centered LaTeX format
      return `\n\\[\n${cleanFormula}\n\\]\n`;
    }

    return match; // Keep original if not a formula
  });

  return text;
};

const scrapeTimeFromWeb = async (): Promise<string | null> => {
  try {
    // Using timeapi.io - no CORS issues
    const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Kolkata');
    if (response.ok) {
      const data = await response.json();
      const date = new Date(data.dateTime);
      return `⏰ **Current Time (from TimeAPI)**\n\n` +
        `🕐 ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}\n` +
        `🌍 **Timezone:** ${data.timeZone}\n` +
        `📅 **Date:** ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    }
    throw new Error('TimeAPI failed');
  } catch (error) {
    console.warn('Time scraping failed, falling back to system time', error);
    return null;
  }
};

const scrapeNewsFromWeb = async (): Promise<string | null> => {
  // Disabled: Google News RSS has CORS issues
  // Would need a backend proxy to work
  console.warn('News scraping disabled - CORS issues with RSS feeds');
  return null;
};

const scrapeTrendingFromWeb = async (): Promise<string | null> => {
  // Disabled: Google Trends RSS has CORS issues
  // Would need a backend proxy to work
  console.warn('Trending scraping disabled - CORS issues with RSS feeds');
  return null;
};

// Firebase chat session management
export const saveChatSession = async (userId: string, messages: Message[]): Promise<string> => {
  try {
    const chatSessionData = {
      userId,
      title: messages[0]?.content.substring(0, 50) + '...' || 'New Chat',
      messages: messages.map(msg => ({
        ...msg,
        timestamp: serverTimestamp()
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'chatSessions'), chatSessionData);
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const updateChatSession = async (sessionId: string, messages: Message[]): Promise<void> => {
  try {
    const sessionRef = doc(db, 'chatSessions', sessionId);
    await updateDoc(sessionRef, {
      messages: messages.map(msg => ({
        ...msg,
        timestamp: serverTimestamp()
      })),
      updatedAt: serverTimestamp()
    });
    // console.('✅ Chat session updated:', sessionId);
  } catch (error) {
    // console.('❌ Error updating chat session:', error);
    throw error;
  }
};

export const getUserChatSessions = async (userId: string): Promise<ChatSession[]> => {
  try {
    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatSession[];

    // console.(`✅ Retrieved ${sessions.length} chat sessions`);
    return sessions;
  } catch (error) {
    // console.('❌ Error getting chat sessions:', error);
    throw error;
  }
};

export const saveMessage = async (sessionId: string, message: Message): Promise<void> => {
  try {
    await addDoc(collection(db, 'messages'), {
      ...message,
      sessionId,
      timestamp: serverTimestamp()
    });
    // console.('✅ Message saved to session:', sessionId);
  } catch (error) {
    // console.('❌ Error saving message:', error);
    throw error;
  }
};

// Keywords that indicate need for real-time web search
const currentInfoKeywords = [
  'current', 'latest', 'today', 'now', 'recent', 'this year', '2024', '2025',
  'prime minister', 'pm of', 'president of',
  'chief minister', 'cm of', 'governor of', 'minister of',
  'who is the', 'what is the current',
  'season', 'weather', 'news', 'winner', 'champion',
  'trending', 'popular now', 'viral'
];

// Subject-specific fine-tuning keywords
const subjectKeywords = {
  coding: ['python', 'javascript', 'java', 'c++', 'code', 'program', 'debug', 'function', 'algorithm', 'database', 'api', 'framework', 'react', 'node', 'sql', 'typescript', 'html', 'css', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin'],
  mathematics: ['algebra', 'geometry', 'calculus', 'trigonometry', 'equation', 'theorem', 'proof', 'integration', 'derivative', 'matrix', 'statistics', 'probability', 'arithmetic', 'math', 'mathematical', 'formula', 'equation', 'solve', 'calculate'],
  science: ['physics', 'chemistry', 'biology', 'electron', 'atom', 'molecule', 'reaction', 'force', 'energy', 'cell', 'organism', 'experiment', 'hypothesis', 'theory', 'scientific', 'laboratory', 'research'],
  physics: ['newton', 'force', 'motion', 'energy', 'quantum', 'gravity', 'velocity', 'acceleration', 'momentum', 'pressure', 'electricity', 'magnetism', 'thermodynamics', 'optics', 'mechanics', 'relativity'],
  chemistry: ['element', 'compound', 'reaction', 'acid', 'base', 'ion', 'bond', 'oxidation', 'molar', 'solution', 'periodic', 'table', 'chemical', 'molecule', 'atom', 'valence', 'catalyst', 'equilibrium'],
  biology: ['cell', 'gene', 'protein', 'dna', 'evolution', 'organism', 'photosynthesis', 'metabolism', 'anatomy', 'respiration', 'ecosystem', 'genetics', 'microorganism', 'physiology', 'botany', 'zoology'],
  literature: ['novel', 'poetry', 'author', 'character', 'plot', 'theme', 'metaphor', 'analysis', 'essay', 'prose', 'literary', 'fiction', 'drama', 'poem', 'story', 'narrative', 'symbolism'],
  english: ['grammar', 'writing', 'vocabulary', 'sentence', 'verb', 'noun', 'tense', 'punctuation', 'essay', 'composition', 'language', 'linguistics', 'phonetics', 'syntax', 'semantics', 'reading', 'comprehension'],
  history: ['war', 'revolution', 'empire', 'dynasty', 'independence', 'civilisation', 'culture', 'era', 'historical', 'ancient', 'medieval', 'modern', 'timeline', 'archaeology', 'civilization'],
  socialstudies: ['society', 'government', 'economy', 'culture', 'politics', 'geography', 'population', 'development', 'social', 'civic', 'democracy', 'constitution', 'citizenship', 'globalization', 'anthropology']
};

// Detect subject from query
const detectSubject = (query: string): string | null => {
  const lowercaseQuery = query.toLowerCase();
  for (const [subject, keywords] of Object.entries(subjectKeywords)) {
    if (keywords.some(keyword => lowercaseQuery.includes(keyword))) {
      return subject;
    }
  }
  return null;
};

// Get subject-specific system prompt
const getSubjectSystemPrompt = (subject: string | null): string => {
  const basePrompt = `You are an expert educational AI assistant designed to help students understand and learn effectively.
Always provide clear, concise, and accurate explanations. Use examples where appropriate.
Format your responses with proper markdown for better readability.
When explaining concepts, break them down into simple, understandable parts.
Generate responses in a step-by-step manner, mixing text explanations with code examples naturally when appropriate.
Use proper markdown formatting for code blocks and ensure content flows conversationally.`;

  const subjectPrompts: Record<string, string> = {
    coding: basePrompt + `\n\nYou are a coding expert specializing in multiple programming languages. When helping with code:
- Provide well-commented, clean code examples with proper syntax highlighting
- Explain the logic, algorithms, and data structures used
- Suggest best practices, security considerations, and performance optimizations
- Help debug errors systematically with clear explanations
- Focus on readable, maintainable, and scalable code
- Include error handling and edge cases
- Provide multiple approaches when applicable
- Explain time/space complexity when relevant
- Generate responses that mix explanations with code blocks naturally, showing code examples interspersed with text explanations`,

    mathematics: basePrompt + `\n\nYou are a mathematics tutor specializing in all mathematical disciplines. When helping with math:
- Show detailed step-by-step solutions with clear reasoning
- Explain concepts, formulas, and theorems from first principles
- Provide practice problems with complete solutions
- Help visualize mathematical concepts with diagrams and examples
- Verify calculations carefully and check for common mistakes
- Explain why methods work and their limitations
- Connect different mathematical concepts
- Provide real-world applications and examples`,

    physics: basePrompt + `\n\nYou are a physics educator specializing in classical and modern physics. When explaining physics:
- Use clear analogies and real-world examples to illustrate concepts
- Explain concepts from first principles with mathematical derivations
- Show relevant equations, units, and their physical meanings
- Help with problem-solving strategies and dimensional analysis
- Connect theoretical concepts to practical applications
- Clarify common misconceptions and intuitive traps
- Explain experimental methods and measurements
- Discuss historical context and current research`,

    chemistry: basePrompt + `\n\nYou are a chemistry expert specializing in all branches of chemistry. When teaching chemistry:
- Explain molecular structures, bonding, and reactions clearly
- Show balanced chemical equations with state symbols
- Help with stoichiometry, calculations, and unit conversions
- Explain periodic table trends and atomic structure
- Connect theoretical concepts to laboratory applications
- Clarify electron configurations and quantum chemistry
- Discuss reaction mechanisms and kinetics
- Explain analytical techniques and instrumentation`,

    biology: basePrompt + `\n\nYou are a biology educator specializing in all biological sciences. When teaching biology:
- Explain biological systems, processes, and mechanisms clearly
- Use detailed descriptions of cellular and molecular processes
- Help with taxonomy, classification, and evolutionary relationships
- Explain genetics, inheritance, and biotechnology
- Connect concepts to real organisms and ecosystems
- Clarify cellular, tissue, and organ-level biology
- Discuss ecological principles and environmental biology
- Explain research methods and current discoveries`,

    literature: basePrompt + `\n\nYou are a literature expert specializing in literary analysis and criticism. When analyzing literature:
- Provide deep literary analysis and interpretation of texts
- Discuss themes, characters, symbolism, and narrative techniques
- Explain literary devices, genres, and historical contexts
- Help with essay writing, thesis development, and argumentation
- Provide context about authors, periods, and literary movements
- Encourage critical thinking and textual evidence-based analysis
- Compare and contrast different works and authors
- Discuss cultural and social implications of literature`,

    english: basePrompt + `\n\nYou are an English language expert specializing in language and communication. When teaching English:
- Explain grammar rules, syntax, and linguistic structures clearly
- Help improve writing skills across different genres and formats
- Correct errors with detailed explanations and examples
- Suggest vocabulary improvements and word choice strategies
- Help with essay writing, composition, and rhetorical strategies
- Clarify pronunciation, phonetics, and language variations
- Explain reading comprehension and analytical techniques
- Discuss language evolution and sociolinguistic factors`,

    socialstudies: basePrompt + `\n\nYou are a social studies educator specializing in social sciences. When teaching social studies:
- Explain social, cultural, political, and economic concepts clearly
- Provide historical context and chronological understanding
- Discuss diverse perspectives, cultural relativism, and global issues
- Explain cause-and-effect relationships in social systems
- Connect local, national, and international developments
- Encourage critical thinking about society and governance
- Discuss research methods in social sciences
- Analyze current events through social science frameworks`,

    science: basePrompt + `\n\nYou are a science educator specializing in integrated science education. When teaching science:
- Explain scientific principles, methods, and discoveries clearly
- Connect physics, chemistry, and biology concepts
- Discuss the scientific method and experimental design
- Help with data analysis and interpretation
- Explain current research and technological applications
- Clarify common misconceptions about science
- Discuss environmental and sustainability issues
- Encourage scientific literacy and critical thinking`,

    history: basePrompt + `\n\nYou are a history educator specializing in world and local history. When teaching history:
- Explain historical events, causes, and consequences clearly
- Provide chronological context and timelines
- Discuss multiple perspectives and historical interpretations
- Connect historical events to current developments
- Explain cultural, social, and political changes over time
- Discuss primary sources and historical methodology
- Analyze patterns and cycles in historical development
- Encourage understanding of historical context in decision-making`
  };

  return subjectPrompts[subject] || basePrompt;
};

// Format code blocks for better readability
const formatCodeBlocks = (text: string): string => {
  // Detect and format code blocks with language specification
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
    const lang = language || 'code';
    return `\`\`\`${lang}\n${code.trim()}\n\`\`\``;
  });

  // Format inline code
  text = text.replace(/`([^`]+)`/g, '`$1`');

  return text;
};

// Enhance response formatting
const enhanceFormatting = (text: string): string => {
  // Add section headers
  text = text.replace(/^(#{1,3})\s+(.+)$/gm, '$1 $2');

  // Format lists
  text = text.replace(/^(\d+\.)\s+(.+)$/gm, '$1 $2');
  text = text.replace(/^[-*]\s+(.+)$/gm, '• $1');

  // Add emphasis to important terms
  text = text.replace(/\*\*([^*]+)\*\*/g, '**$1**');
  text = text.replace(/\*([^*]+)\*/g, '*$1*');

  return text;
};

// Main AI response generator
// Helper to scrape Wikipedia summary
const scrapeWikipediaSummary = async (query: string): Promise<string | null> => {
  try {
    // Extract potential entity name
    let entity = query.replace(/who is|what is|tell me about|the|current|president of|minister of|ceo of/gi, '').trim();
    if (!entity) return null;

    console.log('🔍 Scraping Wikipedia for:', entity);

    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(entity)}`;
    console.log('📡 Wikipedia URL:', wikiUrl);

    const response = await fetch(wikiUrl);
    console.log('📊 Wikipedia response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Wikipedia data received:', data.title);
      if (data.extract) {
        return `Source: Wikipedia\n${data.extract}`;
      }
    }
  } catch (error) {
    console.error('❌ Wikipedia scraping failed:', error);
  }
  return null;
};

// Helper to scrape general context
const scrapeContextFromWeb = async (query: string): Promise<string | null> => {
  let context = null;

  // 1. Try Wikipedia API first (High reliability, no CORS)
  if (/who is|what is|president|minister|ceo/i.test(query)) {
    context = await scrapeWikipediaSummary(query);
    if (context) return context;
  }

  // 2. Try DuckDuckGo Instant Answer API (no CORS)
  try {
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    console.log('🔍 Trying DuckDuckGo API:', searchUrl);

    const response = await fetch(searchUrl);
    if (response.ok) {
      const data = await response.json();
      console.log('📊 DuckDuckGo response:', data);

      // DuckDuckGo returns Abstract, AbstractText, or RelatedTopics
      if (data.AbstractText) {
        return `Source: DuckDuckGo\n${data.AbstractText}`;
      }

      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        const firstTopic = data.RelatedTopics[0];
        if (firstTopic.Text) {
          return `Source: DuckDuckGo\n${firstTopic.Text}`;
        }
      }
    }
  } catch (error) {
    console.warn('DuckDuckGo API failed:', error);
  }

  return context;
};

export const generateAIResponse = async (
  messages: Message[],
  selectedModel: 'int' | 'int.go' | 'int.do' = 'int',
  signal?: AbortSignal,
  onStatusChange?: (status: string) => void
): Promise<string | ReadableStream<Uint8Array>> => {
  try {
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content?.toLowerCase() || '';
    const isOnline = navigator.onLine;

    // PRIORITY: Predefined responses (return immediately, no AI API call)



    // Detect subject for fine-tuning
    const detectedSubject = detectSubject(userQuery);

    // Quick responses for simple greetings (instant, no API call)
    const simpleGreetings: Record<string, string> = {
      'hi': '👋 **Hello!** How can I help you today?',
      'hello': '👋 **Hello!** How can I assist you?',
      'hey': '👋 **Hey there!** What can I do for you?',
      'thanks': '😊 **You\'re welcome!** Let me know if you need anything else.',
      'thank you': '😊 **You\'re welcome!** Happy to help!',
      'bye': '👋 **Goodbye!** Have a great day!',
      'goodbye': '👋 **Goodbye!** Feel free to come back anytime!'
    };

    const trimmedQuery = userQuery.trim();
    if (simpleGreetings[trimmedQuery]) {
      return simpleGreetings[trimmedQuery];
    }

    // Check if offline
    if (!isOnline) {
      return `🔌 **You're currently offline**\n\n` +
        `I need an internet connection to generate responses. Please check your connection and try again.\n\n` +
        `💡 **Once you're back online, I can help you with:**\n` +
        `• Writing and debugging code\n` +
        `• Explaining programming concepts\n` +
        `• Creating content and documents\n` +
        `• Answering questions on any topic\n` +
        `• And much more!`;
    }

    // Time query handling (Web Scraping Priority)
    if ((userQuery === 'time' || userQuery.includes('what time') || userQuery.includes('current time')) && !userQuery.includes('date')) {
      onStatusChange?.('⏰ Checking time...');
      const scrapedTime = await scrapeTimeFromWeb();
      if (scrapedTime) {
        return scrapedTime;
      }

      // Fallback to system time
      const now = new Date();
      return `⏰ **Current Time (System Fallback)**\n\n` +
        `🕐 ${now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })}\n\n` +
        `🌍 **Timezone:** ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n` +
        `📅 **Day:** ${now.toLocaleDateString('en-US', { weekday: 'long' })}`;
    }

    // News query handling
    if (userQuery.includes('news') || userQuery.includes('headlines') || userQuery.includes('current events')) {
      onStatusChange?.('📰 Fetching headlines...');
      const scrapedNews = await scrapeNewsFromWeb();
      if (scrapedNews) {
        return scrapedNews;
      }
      return `📅 **Current Date**\n\n` +
        `📆 ${now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}\n\n` +
        `🗓️ **Week:** Week ${Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)} of ${now.toLocaleDateString('en-US', { month: 'long' })}\n` +
        `📊 **Day of Year:** Day ${dayOfYear} of ${now.getFullYear()}`;
    }

    // Date and time query
    if ((userQuery.includes('date') && userQuery.includes('time')) || userQuery.includes('date and time')) {
      const now = new Date();
      return `📅 **Current Date & Time**\n\n` +
        `🗓️ **Date:** ${now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}\n\n` +
        `⏰ **Time:** ${now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })}\n\n` +
        `🌍 **Timezone:** ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    }

    // Simple "who are you" query - Basic introduction
    //     if (userQuery.includes('who are you') || userQuery.includes('what are you') || userQuery.includes('tell me about you') || userQuery.includes('tell about you') || userQuery.includes('introduce yourself')) {
    //       return `🤖 I am Chatz.IO developed by Kawin M.S, CEO/Founder of Integer.IO

    // Integer.IO is an AI Education Technology Company creating innovative learning tools for students worldwide.

    // 🌐 Visit our <a href="https://integer-io.netlify.app/" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">Website</a>`;
    //     }

    //     // Detailed Developer/Company info - For specific questions about company, CEO, developer, organization
    //     if (userQuery.includes('who developed') || userQuery.includes('developer') || userQuery.includes('who made') || userQuery.includes('who created') || userQuery.includes('ceo') || userQuery.includes('founder') || userQuery.includes('about company') || userQuery.includes('company details') || userQuery.includes('about us') || userQuery.includes('organization') || userQuery.includes('integer') || userQuery.includes('what is chatz') || userQuery.includes('tell about company') || userQuery.includes('tell about ceo') || userQuery.includes('tell about your organization')) {
    //       return `🤖 I am Chatz.IO - developed by Kawin M.S, CEO/Founder of Integer.IO

    // 👨‍💼 About the Developer:
    // Kawin M.S is a passionate innovator in AI and education technology, dedicated to creating cutting-edge learning solutions.

    // 🔗 Connect with Kawin:
    // <a href="https://kawin-portfolio.netlify.app/" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">Portfolio</a> | <a href="https://www.instagram.com/https_kawin.19/" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">Instagram</a> | <a href="https://www.linkedin.com/in/kawin-m-s-570961285/" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">LinkedIn</a>

    // 🏢 About Integer.IO:
    // Integer.IO is an AI Education Technology Company founded by Kawin M.S. We create innovative learning tools and AI-powered solutions for students worldwide, making education more accessible and engaging.

    // 🌐 Connect with us:
    // <a href="https://integer-io.netlify.app/" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">Website</a> | <a href="https://www.linkedin.com/company/integer-io-services/" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">LinkedIn</a> | <a href="https://www.instagram.com/integer.io/" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">Instagram</a> | <a href="https://www.youtube.com/@integer-io" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">YouTube</a>

    // 📧 Contact: <a href="mailto:integer.ai.io@gmail.com" style="color: #3b82f6; text-decoration: underline;">integer.ai.io@gmail.com</a>`;
    //     }

    // Capabilities query
    if (userQuery.includes('what can you do') || userQuery.includes('your capabilities') || userQuery.includes('how can you help')) {
      return `🤖 **My Capabilities**\n\n` +
        `I'm an advanced AI assistant designed to help you with a wide range of tasks:\n\n` +
        `**💻 Code Generation & Development**\n` +
        `• Write clean, efficient code in any programming language\n` +
        `• Debug and fix code errors\n` +
        `• Explain complex programming concepts\n` +
        `• Design algorithms and data structures\n` +
        `• Review and optimize code\n` +
        `• Create complete projects from scratch\n\n` +
        `**✍️ Content Creation**\n` +
        `• Write articles, essays, and blog posts\n` +
        `• Create marketing copy and social media content\n` +
        `• Draft emails and professional documents\n` +
        `• Generate creative stories and scripts\n` +
        `• Summarize and analyze text\n` +
        `• Translate and proofread content\n\n` +
        `**🎓 Learning & Education (Fine-tuned for):**\n` +
        `• Coding & Programming\n` +
        `• Mathematics (Algebra, Geometry, Calculus)\n` +
        `• Science (Physics, Chemistry, Biology)\n` +
        `• Literature & Language Studies\n` +
        `• Social Studies & History\n` +
        `• English Grammar & Composition\n\n` +
        `**🔍 Research & Analysis**\n` +
        `• Analyze data and provide insights\n` +
        `• Compare and contrast different options\n` +
        `• Provide comprehensive information on topics\n` +
        `• Help with decision making\n\n` +
        `**💡 Problem Solving**\n` +
        `• Brainstorm creative solutions\n` +
        `• Break down complex problems\n` +
        `• Provide strategic advice\n` +
        `• Offer multiple perspectives\n\n` +
        `💬 **Just ask me anything!** I'm here to help you succeed.`;
    }

    // Check if query needs web search - DISABLED (user wants only API responses)
    // const isWebsiteInfoRequest = userQuery.match(/tell\s+(me\s+)?(about|information|details|facts)\s+(on|about)?\s+([a-zA-Z0-9\s]+)(\s+website)?/i) ||
    //   userQuery.match(/what\s+is\s+([a-zA-Z0-9\s.]+)(\s+website)?/i);

    // const needsWebSearch = isWebsiteInfoRequest ||
    //   currentInfoKeywords.some(keyword => userQuery.includes(keyword));

    // if (needsWebSearch) {
    //   return await searchOnline(lastMessage?.content || userQuery);
    // }

    // Prepare messages for AI API
    const nvidiaMessages: NvidiaMessage[] = messages
      .filter(msg => msg.type !== 'system')
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    // Check for informational queries that might need real-time context
    const isInfoQuery = /who is|what is|current|latest|news|president|minister|ceo|price|score|winner/i.test(userQuery);

    if (isInfoQuery) {
      onStatusChange?.('Searching...');
      const context = await scrapeContextFromWeb(userQuery);
      if (context) {
        // Inject context into the last user message
        const lastMsgIndex = nvidiaMessages.length - 1;
        if (lastMsgIndex >= 0) {
          nvidiaMessages[lastMsgIndex].content = `[Real-time Search Result]: ${context}\n\nUser Question: ${nvidiaMessages[lastMsgIndex].content}`;
        }
      } else {
        // Scraping failed - tell AI to inform user
        const lastMsgIndex = nvidiaMessages.length - 1;
        if (lastMsgIndex >= 0) {
          nvidiaMessages[lastMsgIndex].content = `[IMPORTANT]: Web scraping failed. You MUST inform the user that you couldn't fetch real-time data and your knowledge might be outdated. Suggest they search online for the most current information.\n\nUser Question: ${nvidiaMessages[lastMsgIndex].content}`;
        }
      }
    }

    // Add subject context if detected
    if (detectedSubject) {
      const subjectPrompt = getSubjectSystemPrompt(detectedSubject);
      nvidiaMessages.unshift({
        role: 'system',
        content: subjectPrompt
      });
    }

    // Get AI response
    let aiResponse = await sendToNvidiaAPI(nvidiaMessages, selectedModel, signal);

    // Handle streaming response - return the stream for real-time processing
    if (aiResponse instanceof ReadableStream) {
      return aiResponse; // Return stream directly for real-time rendering
    }

    // Process non-streaming response
    if (typeof aiResponse === 'string') {
      aiResponse = formatCodeBlocks(aiResponse);
      aiResponse = enhanceFormatting(aiResponse);
      aiResponse = processFormulas(aiResponse); // Convert code blocks with formulas to LaTeX
      aiResponse = decodeHtmlEntities(aiResponse);
    }

    return aiResponse;

  } catch (error) {
    return `⚠️ **Something went wrong**\n\n` +
      `I encountered an error while processing your request. This could be due to:\n\n` +
      `• Network connectivity issues\n` +
      `• Server temporarily unavailable\n` +
      `• Request timeout\n\n` +
      `**Please try again.** If the issue persists, try:\n` +
      `1. Refreshing the page\n` +
      `2. Checking your internet connection\n` +
      `3. Simplifying your question\n\n` +
      `I'm here to help once we resolve this issue! 💪`;
  }
};

