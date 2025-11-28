import { useState, useCallback, useEffect, useRef } from 'react';

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() => 'speechSynthesis' in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  // Handle visibility change for background speech
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Don't interrupt speech when switching tabs - let it continue in background
      // Speech synthesis should work in background tabs in modern browsers
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) {
      console.warn('Speech synthesis not supported or no text provided');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    // Wait a bit for cancel to complete on mobile
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };
      
      utterance.onerror = (event) => {
        // Ignore 'interrupted' errors - they're not real errors
        if (event.error !== 'interrupted') {
          console.error('Speech synthesis error:', event);
        } else {
          console.log('Speech synthesis interrupted (normal behavior)');
        }
        setIsSpeaking(false);
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };

      utteranceRef.current = utterance;
      
      try {
        window.speechSynthesis.speak(utterance);
        
        // Fallback check for mobile browsers that might not fire events properly
        checkIntervalRef.current = setInterval(() => {
          if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            setIsSpeaking(false);
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
            }
          }
        }, 100);
      } catch (error) {
        console.error('Error starting speech:', error);
        setIsSpeaking(false);
      }
    }, 50);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (isSupported) {
      try {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      } catch (error) {
        console.error('Error stopping speech:', error);
        setIsSpeaking(false);
      }
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  };
};
