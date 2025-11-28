import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastTranscriptRef = useRef(''); // Track last transcript to prevent duplicates

  const initializeRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return null;
    }

    setIsSupported(true);
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false; // Changed to false to prevent repetition
    recognitionInstance.interimResults = false; // Only use final results
    recognitionInstance.maxAlternatives = 1;

    // Auto-detect multilingual input (supports Tamil, English, Hindi, etc.)
    recognitionInstance.lang = 'en-IN'; // English-India for multilingual support

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';

      // Only process final results to prevent repetition
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const transcriptPart = result[0].transcript.trim();

          // Prevent duplicate text
          if (transcriptPart && transcriptPart !== lastTranscriptRef.current) {
            finalTranscript += transcriptPart + ' ';
            lastTranscriptRef.current = transcriptPart;
          }
        }
      }

      // Only update if we have new final text
      if (finalTranscript.trim()) {
        setTranscript((prev) => {
          const newText = prev + finalTranscript;
          return newText.trim();
        });
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);

      if (event.error === 'not-allowed') {
        setPermissionDenied(true);
      }

      setIsListening(false);

      // Re-initialize on error for mobile browsers
      if (event.error === 'aborted' || event.error === 'network') {
        recognitionRef.current = initializeRecognition();
      }
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    return recognitionInstance;
  }, []);

  useEffect(() => {
    recognitionRef.current = initializeRecognition();
  }, [initializeRecognition]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = initializeRecognition();
    }

    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        setPermissionDenied(false);

        // For mobile: stop any ongoing recognition first
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // Ignore stop errors
          }
        }

        // Small delay for mobile browsers
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.start();
            setIsListening(true);
          }
        }, 100);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        // Re-initialize and try again
        recognitionRef.current = initializeRecognition();
        if (recognitionRef.current) {
          try {
            setTimeout(() => {
              if (recognitionRef.current) {
                recognitionRef.current.start();
                setIsListening(true);
              }
            }, 150);
          } catch (retryError) {
            console.error('Retry failed:', retryError);
            setIsListening(false);
          }
        }
      }
    }
  }, [isListening, initializeRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setIsListening(false);
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    permissionDenied,
    startListening,
    stopListening,
    resetTranscript,
  };
};
