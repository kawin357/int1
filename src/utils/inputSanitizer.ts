/**
 * Input Sanitization Utility
 * Provides comprehensive input validation and sanitization to prevent XSS, SQL injection, and other attacks
 */

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Dangerous patterns to detect
const SQL_INJECTION_PATTERNS = [
    /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
    /UNION\s+SELECT/i,
    /DROP\s+TABLE/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /UPDATE\s+.*SET/i,
    /--/,
    /;.*--/,
    /\/\*.*\*\//,
];

const XSS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
    /<embed[^>]*>/gi,
    /<object[^>]*>/gi,
];

/**
 * Sanitize email input
 * @param email - Email address to validate
 * @returns Sanitized email or null if invalid
 */
export const sanitizeEmail = (email: string): string | null => {
    if (!email || typeof email !== 'string') {
        return null;
    }

    // Trim and lowercase
    const trimmed = email.trim().toLowerCase();

    // Check length
    if (trimmed.length > 254) {
        return null;
    }

    // Validate format
    if (!EMAIL_REGEX.test(trimmed)) {
        return null;
    }

    // Check for SQL injection patterns
    if (containsSQLInjection(trimmed)) {
        return null;
    }

    return trimmed;
};

/**
 * Sanitize password input
 * @param password - Password to validate
 * @returns Object with sanitized password and validation result
 */
export const sanitizePassword = (password: string): {
    value: string | null;
    isValid: boolean;
    error?: string;
} => {
    if (!password || typeof password !== 'string') {
        return { value: null, isValid: false, error: 'Password is required' };
    }

    // Check length
    if (password.length < 6) {
        return { value: null, isValid: false, error: 'Password must be at least 6 characters' };
    }

    if (password.length > 128) {
        return { value: null, isValid: false, error: 'Password is too long' };
    }

    // Check for SQL injection patterns
    if (containsSQLInjection(password)) {
        return { value: null, isValid: false, error: 'Invalid characters in password' };
    }

    return { value: password, isValid: true };
};

/**
 * Sanitize general text input (names, messages, etc.)
 * @param text - Text to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text
 */
export const sanitizeText = (text: string, maxLength: number = 1000): string => {
    if (!text || typeof text !== 'string') {
        return '';
    }

    // Trim
    let sanitized = text.trim();

    // Limit length
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    // Remove script tags and dangerous HTML
    sanitized = stripXSS(sanitized);

    return sanitized;
};

/**
 * Sanitize chat message input
 * @param message - Chat message to sanitize
 * @returns Sanitized message
 */
export const sanitizeChatMessage = (message: string): string => {
    if (!message || typeof message !== 'string') {
        return '';
    }

    // Trim
    let sanitized = message.trim();

    // Limit length (10000 chars for chat messages)
    if (sanitized.length > 10000) {
        sanitized = sanitized.substring(0, 10000);
    }

    // Remove dangerous scripts but preserve code blocks
    sanitized = stripXSSPreserveCode(sanitized);

    return sanitized;
};

/**
 * Sanitize URL input
 * @param url - URL to validate
 * @returns Sanitized URL or null if invalid
 */
export const sanitizeURL = (url: string): string | null => {
    if (!url || typeof url !== 'string') {
        return null;
    }

    const trimmed = url.trim();

    // Check for javascript: protocol
    if (/^javascript:/i.test(trimmed)) {
        return null;
    }

    // Check for data: protocol (can be used for XSS)
    if (/^data:/i.test(trimmed)) {
        return null;
    }

    // Only allow http, https, and mailto
    if (!/^(https?:\/\/|mailto:)/i.test(trimmed)) {
        return null;
    }

    return trimmed;
};

/**
 * Check if text contains SQL injection patterns
 * @param text - Text to check
 * @returns True if SQL injection detected
 */
export const containsSQLInjection = (text: string): boolean => {
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(text));
};

/**
 * Check if text contains XSS patterns
 * @param text - Text to check
 * @returns True if XSS detected
 */
export const containsXSS = (text: string): boolean => {
    return XSS_PATTERNS.some(pattern => pattern.test(text));
};

/**
 * Strip XSS patterns from text
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export const stripXSS = (text: string): string => {
    let sanitized = text;

    // Remove script tags
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');

    // Remove iframe tags
    sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove embed and object tags
    sanitized = sanitized.replace(/<embed[^>]*>/gi, '');
    sanitized = sanitized.replace(/<object[^>]*>.*?<\/object>/gi, '');

    return sanitized;
};

/**
 * Strip XSS but preserve code blocks (for chat messages)
 * @param text - Text to sanitize
 * @returns Sanitized text with code blocks preserved
 */
export const stripXSSPreserveCode = (text: string): string => {
    // Extract code blocks
    const codeBlocks: string[] = [];
    let sanitized = text.replace(/```[\s\S]*?```/g, (match) => {
        codeBlocks.push(match);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // Strip XSS from non-code content
    sanitized = stripXSS(sanitized);

    // Restore code blocks
    codeBlocks.forEach((block, index) => {
        sanitized = sanitized.replace(`__CODE_BLOCK_${index}__`, block);
    });

    return sanitized;
};

/**
 * Validate and sanitize name input
 * @param name - Name to validate
 * @returns Sanitized name or null if invalid
 */
export const sanitizeName = (name: string): string | null => {
    if (!name || typeof name !== 'string') {
        return null;
    }

    const trimmed = name.trim();

    // Check length
    if (trimmed.length < 1 || trimmed.length > 100) {
        return null;
    }

    // Remove any HTML tags
    const sanitized = stripXSS(trimmed);

    // Check for SQL injection
    if (containsSQLInjection(sanitized)) {
        return null;
    }

    return sanitized;
};

/**
 * Rate limiting helper - check if action is allowed
 * @param key - Unique key for the action (e.g., 'login_user@email.com')
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns True if action is allowed
 */
export const checkRateLimit = (
    key: string,
    maxAttempts: number = 5,
    windowMs: number = 60000
): boolean => {
    const now = Date.now();
    const storageKey = `ratelimit_${key}`;

    try {
        const stored = localStorage.getItem(storageKey);
        if (!stored) {
            localStorage.setItem(storageKey, JSON.stringify({ count: 1, firstAttempt: now }));
            return true;
        }

        const data = JSON.parse(stored);

        // Check if window has expired
        if (now - data.firstAttempt > windowMs) {
            localStorage.setItem(storageKey, JSON.stringify({ count: 1, firstAttempt: now }));
            return true;
        }

        // Check if limit exceeded
        if (data.count >= maxAttempts) {
            return false;
        }

        // Increment count
        data.count++;
        localStorage.setItem(storageKey, JSON.stringify(data));
        return true;
    } catch (error) {
        // If localStorage fails, allow the action
        return true;
    }
};

/**
 * Reset rate limit for a key
 * @param key - Unique key for the action
 */
export const resetRateLimit = (key: string): void => {
    const storageKey = `ratelimit_${key}`;
    try {
        localStorage.removeItem(storageKey);
    } catch (error) {
        // Ignore errors
    }
};
