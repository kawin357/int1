import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, BookOpen, Calculator, Code, Globe, Sparkles, Lightbulb } from 'lucide-react';
import botLogo from '@/assets/bot-logo.webp';
import ModelSelector, { AIModel } from './ModelSelector';
import { useIsMobile } from '@/hooks/use-mobile';


interface WelcomeScreenProps {
  user: any;
  onSendMessage: (message: string) => void;
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

const WelcomeScreen = ({ user, onSendMessage, selectedModel, onModelChange }: WelcomeScreenProps) => {
  const [input, setInput] = useState('');
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };



  const features = [
    { icon: Sparkles, title: "Smart AI", desc: "Powered by advanced AI models" },
    { icon: Lightbulb, title: "24/7 Help", desc: "Always ready to assist you" },
    { icon: BookOpen, title: "All Subjects", desc: "Math, Science, History & more" }
  ];

  const userName = user?.email?.split('@')[0] || 'Guest';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 px-4 relative overflow-hidden">
      {/* Floating particles animation - Reduced for performance */}
      {!isMobile && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20"
              initial={{ x: Math.random() * 100, y: -20 }}
              animate={{
                y: '100vh',
                x: `${Math.random() * 100}vw`
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                delay: i * 2,
                ease: 'linear'
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-4xl w-full relative z-10"
      >
        {/* Logo with pulse animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <img
            src={botLogo}
            alt="chatz.IO Logo"
            className="w-20 h-20 sm:w-28 sm:h-28 mx-auto drop-shadow-2xl"
          />
        </motion.div>

        {/* Animated title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent px-2"
        >
          {user ? `Welcome ${userName}!` : 'Welcome to chatz.IO'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-base sm:text-lg md:text-xl text-slate-800 mb-6 sm:mb-8 px-2 font-semibold"
        >
          Your AI Study Assistant - Homework Help, Exam Prep & More
        </motion.p>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="grid grid-cols-3 gap-3 mb-4 max-w-1xl mx-auto"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              whileHover={isMobile ? {} : { scale: 1.05, y: -5 }}
              className="bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border-2 border-blue-200/50 shadow-lg"
            >
              <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">{feature.title}</h3>
              <p className="text-[10px] sm:text-xs text-slate-600 mt-1">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Input Form with Model Selector Inside */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="w-full mb-4 mt-10"
        >
          <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xl border-2 border-slate-300 hover:border-slate-400 focus-within:border-blue-300 p-2 rounded-2xl shadow-md hover:shadow-lg focus-within:shadow-xl transition-all duration-300 min-w-0">
              {/* Model Selector - Inside input box */}
              <div className="flex-shrink-0">
                <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} />
              </div>

              {/* Input field */}
              <motion.input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your studies..."
                className="flex-1 px-3 py-2 bg-transparent text-slate-900 placeholder:text-slate-500 outline-none text-sm sm:text-base font-medium min-w-0"
                whileFocus={{ scale: 1.0 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              />

              {/* Send button */}
              <motion.button
                type="submit"
                disabled={!input.trim()}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-emerald-600 via-blue-600 to-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                whileHover={{ scale: input.trim() ? 1.05 : 1 }}
                whileTap={{ scale: input.trim() ? 0.95 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-3xl mx-auto"
        >

        </motion.div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
