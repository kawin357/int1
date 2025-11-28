/**
 * Security utility to protect against prompt injection attacks
 * Prevents users from extracting system prompts, API keys, or backend information
 */

// Patterns that indicate potential prompt injection attempts
const INJECTION_PATTERNS = [
    // Direct system prompt extraction attempts
    /system\s*prompt/i,
    /show\s*(me\s*)?(your\s*)?((system|original|initial|base)\s*)?(prompt|instruction)/i,
    /what(\s+is|\s+are)\s+(your\s+)?(system\s+)?(prompt|instruction)/i,
    /tell\s+me\s+(your\s+)?(system\s+)?(prompt|instruction)/i,
    /reveal\s+(your\s+)?(system\s+)?(prompt|instruction)/i,
    /display\s+(your\s+)?(system\s+)?(prompt|instruction)/i,

    // API key extraction attempts
    /api\s*key/i,
    /secret\s*key/i,
    /authorization\s*key/i,
    /access\s*token/i,
    /bearer\s*token/i,
    /(show|tell|reveal|display|what(\s+is|\s+are))\s+(me\s+)?(your\s+)?key/i,

    // Model information extraction
    /what(\s+is|\s+are)\s+(your\s+)?(real|actual|original|true)\s*(model|name)/i,
    /which\s+model\s+(are\s+you|do\s+you\s+use)/i,
    /what\s+model\s+(are\s+you|do\s+you\s+use)/i,
    /tell\s+me\s+(your\s+)?(real|actual|original|true)\s*(model|name)/i,
    /(gpt|claude|llama|deepseek|groq|openai|anthropic)/i,

    // Backend/technical details extraction
    /backend/i,
    /server\s*config/i,
    /environment\s*variable/i,
    /\.env/i,
    /configuration/i,
    /database/i,
    /(show|tell|reveal|display)\s+(me\s+)?(your\s+)?(code|source|config|setup)/i,

    // Jailbreak attempts
    /ignore\s+(previous|all|above)\s*(instruction|prompt|rule)/i,
    /forget\s+(previous|all|above)\s*(instruction|prompt|rule)/i,
    /disregard\s+(previous|all|above)\s*(instruction|prompt|rule)/i,
    /override\s+(previous|all|above)\s*(instruction|prompt|rule)/i,
    /new\s*(instruction|prompt|rule|mode)/i,
    /developer\s*mode/i,
    /debug\s*mode/i,
    /admin\s*mode/i,
    /god\s*mode/i,

    // Role-playing jailbreaks
    /you\s+are\s+now/i,
    /act\s+as\s+(if\s+)?(you\s+are|a)/i,
    /pretend\s+(to\s+be|you\s+are)/i,
    /simulate/i,

    // System manipulation
    /\[SYSTEM\]/i,
    /\[ADMIN\]/i,
    /\[ROOT\]/i,
    /<system>/i,
    /execute\s+command/i,
    /run\s+command/i,

    // Encoding tricks
    /base64/i,
    /hex\s*encode/i,
    /rot13/i,
    /unicode/i,

    // Prompt leaking through conversation
    /repeat\s+(your\s+)?(first|initial|original)\s*(message|instruction|prompt)/i,
    /what\s+(were|was)\s+(your\s+)?(first|initial|original)\s*(message|instruction|prompt)/i,
];

/**
 * Check if user input contains potential prompt injection attempts
 * Returns object with detection result and type of injection
 */
export const detectPromptInjection = (input: string): { detected: boolean; type?: string } => {
    const normalizedInput = input.trim();
    const lowerInput = normalizedInput.toLowerCase();

    // Check for system prompt extraction (highest priority for specific response)
    if (
        /system\s*prompt/i.test(normalizedInput) ||
        /show\s*(me\s*)?(your\s*)?((system|original|initial|base)\s*)?(prompt|instruction)/i.test(normalizedInput) ||
        /what(\s+is|\s+are)\s+(your\s+)?(system\s+)?(prompt|instruction)/i.test(normalizedInput) ||
        /tell\s+me\s+(your\s+)?(system\s+)?(prompt|instruction)/i.test(normalizedInput) ||
        /reveal\s+(your\s+)?(system\s+)?(prompt|instruction)/i.test(normalizedInput) ||
        /repeat\s+(your\s+)?(first|initial|original)\s*(message|instruction|prompt)/i.test(normalizedInput)
    ) {
        console.warn('🚨 System prompt extraction attempt detected:', normalizedInput.substring(0, 100));
        return { detected: true, type: 'system_prompt' };
    }

    // Check against all known injection patterns
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(normalizedInput)) {
            console.warn('🚨 Potential prompt injection detected:', normalizedInput.substring(0, 100));
            return { detected: true, type: 'general' };
        }
    }

    // Check for suspicious character combinations
    if (
        normalizedInput.includes('```') &&
        (lowerInput.includes('system') || lowerInput.includes('prompt'))
    ) {
        return { detected: true, type: 'general' };
    }

    // Check for excessive special characters (potential encoding attacks)
    const specialCharCount = (normalizedInput.match(/[<>{}[\]\\|]/g) || []).length;
    if (specialCharCount > 10) {
        return { detected: true, type: 'general' };
    }

    return { detected: false };
};

/**
 * Get a safe response for rejected prompt injection attempts
 */
export const getInjectionBlockedResponse = (isSystemPromptRequest: boolean = false): string => {
    // Special response for system prompt requests
    if (isSystemPromptRequest) {
        return `🤖 **About My System Configuration**

I'm designed as a learning assistant, and I don't have access to reveal my internal system prompts or configuration details.

**✅ What I can share:**
⭐ I'm **intgo** - an AI learning assistant
⭐ I'm built by Integer.IO to help students learn
⭐ I can help with academic subjects, coding, and problem-solving

**❌ What I cannot reveal:**
⭐ Full internal prompts or instructions
⭐ Hidden safety guidelines
⭐ Developer/internal Integer.IO configuration
⭐ Backend technical implementation
⭐ Policy text in system messages

**That's all I'm allowed to reveal.** These details are private and protected for security reasons.

💡 **Instead, let me help you with your studies!** What would you like to learn today? 📚`;
    }

    // General responses for other injection attempts
    const responses = [
        "⚠️ **I'm here to help with learning and education!**\n\nI notice you're asking about my technical setup. I'm **intgo**, an AI learning assistant focused on helping students with their studies.\n\n💡 **How can I help you today with:**\n⭐ Academic subjects (Math, Science, English, etc.)\n⭐ Programming and coding\n⭐ Homework or assignments\n⭐ Understanding concepts\n\nFeel free to ask me any educational questions! 📚",

        "🎓 **I'm intgo, your AI learning assistant!**\n\nI focus on helping students learn and understand concepts better. My technical details aren't relevant to our educational journey together.\n\n💡 **Let's focus on what I can help you learn:**\n⭐ Academic subjects\n⭐ Programming concepts\n⭐ Problem-solving\n⭐ Study guidance\n\nWhat would you like to learn about today? 🚀",

        "✨ **Hey there!** I'm **intgo**, designed to help you learn!\n\nInstead of discussing my technical background, let's focus on what really matters - **your learning journey!**\n\n📚 **I can help you with:**\n⭐ Math, Science, English, and more\n⭐ Coding and programming\n⭐ Understanding difficult concepts\n⭐ Homework and assignments\n\nWhat can I help you learn today? 🎯",
    ];

    // Return a random response to make it feel more natural
    return responses[Math.floor(Math.random() * responses.length)];
};

/**
 * Sanitize user input to prevent injection
 */
export const sanitizeInput = (input: string): string => {
    // Remove potential command injection characters while preserving normal text
    let sanitized = input
        .replace(/\[SYSTEM\]/gi, '[REDACTED]')
        .replace(/\[ADMIN\]/gi, '[REDACTED]')
        .replace(/\[ROOT\]/gi, '[REDACTED]')
        .replace(/<system>/gi, '[REDACTED]')
        .replace(/<admin>/gi, '[REDACTED]');

    return sanitized;
};

/**
 * Filter AI response to ensure no sensitive information leaks
 */
export const filterSensitiveResponse = (response: string): string => {
    let filtered = response;

    // Replace actual model names with generic name
    filtered = filtered
        .replace(/deepseek/gi, 'intgo')
        .replace(/groq/gi, 'intgo')
        .replace(/llama[\s-]*\d*\.?\d*/gi, 'intgo')
        .replace(/gpt[\s-]*\d*/gi, 'intgo')
        .replace(/claude/gi, 'intgo')
        .replace(/openrouter/gi, 'our AI service')
        .replace(/api[\s-]*key[s]?/gi, '[REDACTED]')
        .replace(/bearer[\s-]*token/gi, '[REDACTED]')
        .replace(/authorization/gi, '[REDACTED]');

    return filtered;
};

/**
 * Validate message before sending to API
 */
export const validateMessage = (content: string): {
    isValid: boolean;
    sanitized: string;
    reason?: string;
    injectionType?: string;
} => {
    // Check for injection attempts
    const injectionResult = detectPromptInjection(content);
    if (injectionResult.detected) {
        return {
            isValid: false,
            sanitized: content,
            reason: 'prompt_injection_detected',
            injectionType: injectionResult.type
        };
    }

    // Sanitize the input
    const sanitized = sanitizeInput(content);

    // Check length limits
    if (sanitized.length > 10000) {
        return {
            isValid: false,
            sanitized,
            reason: 'message_too_long'
        };
    }

    return {
        isValid: true,
        sanitized
    };
};

/**
 * Check if a question is asking about the AI's identity in a suspicious way
 */
export const isSuspiciousIdentityQuestion = (input: string): boolean => {
    const suspiciousPatterns = [
        /what\s+(are\s+you|is\s+your\s+name)\s+(really|actually)/i,
        /true\s+(identity|name)/i,
        /real\s+(identity|name|model)/i,
        /based\s+on\s+what\s+model/i,
        /powered\s+by\s+what/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
};
