import { motion } from 'framer-motion';

const LoadingDots = () => {
  return (
    <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
      {/* Rotating Blue Border */}
      <motion.div
        className="absolute inset-0 rounded-full border-3 sm:border-4 border-transparent border-t-blue-500"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          borderTopColor: '#3b82f6',
        }}
      />

      {/* 3 Static Dots in Center - Responsive */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-1.5 h-1.5 sm:w-2 sm:h-2"
            style={{
              borderRadius: '50%',
              background: index === 2
                ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' // Blue
                : 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', // Blue-green
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingDots;
