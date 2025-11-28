import { motion } from 'framer-motion';
import logo from '@/assets/logo.webp';
import { Copyright } from 'lucide-react';

interface FooterProps {
  isVisible: boolean;
}

const Footer = ({ isVisible }: FooterProps) => {
  if (!isVisible) return null;

  return (
    <footer className="border-t border-slate-300/40 relative">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-xl" />
      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-1 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
          <div className="flex items-center space-x-2">
            <Copyright size={14} className="text-slate-600" />
            <p className="text-xs text-slate-700 font-medium">2025 chatz.IO</p>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-400" />
          <div className="flex items-center space-x-2">
            <p className="text-xs bg-gradient-to-r from-emerald-700 to-blue-700 bg-clip-text text-transparent font-bold">
              Powered by
            </p>
            {/* Logo size reduced on mobile */}
            <img
              src={logo}
              alt="Company Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain"
              loading="eager"
            />
          </div>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;