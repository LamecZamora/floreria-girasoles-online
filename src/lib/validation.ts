/**
 * Security validation utilities
 */

// Sanitize text input - strip HTML tags and dangerous characters
export const sanitizeText = (input: string): string => {
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>"'`]/g, '') // Remove dangerous chars
    .replace(/javascript:/gi, '') // Block JS protocol
    .replace(/data:/gi, '') // Block data protocol
    .replace(/on\w+=/gi, '') // Block event handlers
    .trim();
};

// Validate email format strictly
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254 && !email.includes('..');
};

// Validate password strength
export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) return { valid: false, message: "Mínimo 8 caracteres" };
  if (password.length > 72) return { valid: false, message: "Máximo 72 caracteres" };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Debe incluir al menos una mayúscula" };
  if (!/[a-z]/.test(password)) return { valid: false, message: "Debe incluir al menos una minúscula" };
  if (!/[0-9]/.test(password)) return { valid: false, message: "Debe incluir al menos un número" };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { valid: false, message: "Debe incluir al menos un carácter especial (!@#$%...)" };
  
  // Check for common weak patterns
  const commonPatterns = ['12345678', 'password', 'qwerty', 'abcdefgh', '11111111'];
  if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
    return { valid: false, message: "La contraseña es demasiado común" };
  }
  
  return { valid: true, message: "" };
};

// Validate that a redirect URL is safe (no open redirect)
export const isSafeRedirect = (url: string): boolean => {
  if (!url.startsWith('/')) return false;
  if (url.startsWith('//')) return false;
  if (/^\/[^a-zA-Z]/.test(url) && url.includes(':')) return false;
  // Block encoded characters that could hide malicious URLs
  if (url.includes('%') || url.includes('\\')) return false;
  return true;
};

// Sanitize order notes
export const sanitizeNotes = (notes: string): string => {
  return sanitizeText(notes).substring(0, 500);
};

// Rate limiter for client-side actions with progressive lockout
const rateLimitMap = new Map<string, { attempts: number[]; lockedUntil?: number }>();

export const isRateLimited = (key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { attempts: [] };
  
  // Check if locked out
  if (entry.lockedUntil && now < entry.lockedUntil) return true;
  
  const recentAttempts = entry.attempts.filter(t => now - t < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    // Progressive lockout: each lockout doubles the time
    const lockoutMultiplier = Math.min(Math.pow(2, Math.floor(recentAttempts.length / maxAttempts)), 16);
    entry.lockedUntil = now + (windowMs * lockoutMultiplier);
    entry.attempts = recentAttempts;
    rateLimitMap.set(key, entry);
    return true;
  }
  
  recentAttempts.push(now);
  rateLimitMap.set(key, { attempts: recentAttempts, lockedUntil: entry.lockedUntil });
  return false;
};

// Get remaining lockout time in seconds
export const getLockoutRemaining = (key: string): number => {
  const entry = rateLimitMap.get(key);
  if (!entry?.lockedUntil) return 0;
  const remaining = Math.max(0, entry.lockedUntil - Date.now());
  return Math.ceil(remaining / 1000);
};

// Validate price is a reasonable number
export const isValidPrice = (price: number): boolean => {
  return price > 0 && price <= 1000000 && Number.isFinite(price);
};

// Validate quantity
export const isValidQuantity = (qty: number): boolean => {
  return Number.isInteger(qty) && qty > 0 && qty <= 100;
};

// Honeypot field validation (bots fill hidden fields)
export const isHoneypotTriggered = (value: string): boolean => {
  return value.length > 0;
};

// Timing-based bot detection (forms filled too fast are likely bots)
export const isSubmittedTooFast = (formLoadTime: number, minSeconds: number = 2): boolean => {
  const elapsed = (Date.now() - formLoadTime) / 1000;
  return elapsed < minSeconds;
};

// CSP nonce generator for inline scripts
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

// Validate phone number format
export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^\+?[0-9]{10,15}$/.test(cleaned);
};

// Sanitize URL parameter to prevent injection
export const sanitizeUrlParam = (param: string): string => {
  return encodeURIComponent(param.replace(/[^\w\-./]/g, ''));
};