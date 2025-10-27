/**
 * Data Sanitization Utilities
 * Prevents sensitive data like IDs from being accidentally displayed in the UI
 */

/**
 * Sanitizes product data by removing ID fields and other sensitive information
 * that should not be displayed in the UI
 * @param {Object} product - The product object to sanitize
 * @returns {Object} - Sanitized product object safe for UI display
 */
export const sanitizeProductForDisplay = (product) => {
  if (!product || typeof product !== 'object') {
    return product;
  }

  // Create a copy to avoid mutating the original object
  const sanitized = { ...product };

  // Remove ID fields that should never be displayed
  const sensitiveFields = ['_id', 'id', '__v'];
  
  sensitiveFields.forEach(field => {
    if (sanitized.hasOwnProperty(field)) {
      delete sanitized[field];
    }
  });

  // If there are nested objects (like reviews), sanitize them too
  if (sanitized.reviews && Array.isArray(sanitized.reviews)) {
    sanitized.reviews = sanitized.reviews.map(review => {
      const sanitizedReview = { ...review };
      sensitiveFields.forEach(field => {
        if (sanitizedReview.hasOwnProperty(field)) {
          delete sanitizedReview[field];
        }
      });
      return sanitizedReview;
    });
  }

  return sanitized;
};

/**
 * Sanitizes an array of products
 * @param {Array} products - Array of product objects
 * @returns {Array} - Array of sanitized product objects
 */
export const sanitizeProductsForDisplay = (products) => {
  if (!Array.isArray(products)) {
    return products;
  }

  return products.map(product => sanitizeProductForDisplay(product));
};

/**
 * Validates that a string doesn't contain ID-like patterns
 * Useful for preventing accidental display of IDs in text fields
 * @param {string} text - Text to validate
 * @returns {boolean} - True if text is safe to display, false if it contains ID-like patterns
 */
export const isTextSafeForDisplay = (text) => {
  if (typeof text !== 'string') {
    return true;
  }

  // Pattern to detect MongoDB ObjectId-like strings (24 hex characters)
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  
  // Pattern to detect partial ObjectId-like strings (8+ hex characters)
  const partialIdPattern = /^[0-9a-fA-F]{8,}$/;

  return !objectIdPattern.test(text) && !partialIdPattern.test(text);
};

/**
 * Safe text renderer that prevents ID display
 * @param {string} text - Text to render
 * @param {string} fallback - Fallback text if original text is unsafe
 * @returns {string} - Safe text for display
 */
export const safeTextForDisplay = (text, fallback = '') => {
  if (!isTextSafeForDisplay(text)) {
    console.warn('Prevented display of potential ID in text:', text);
    return fallback;
  }
  return text;
};

/**
 * Development mode warning for ID display attempts
 * Only logs in development to help developers catch ID display issues
 */
export const warnIfIdDisplayAttempt = (value, context = '') => {
  if (__DEV__ && value && typeof value === 'string') {
    if (!isTextSafeForDisplay(value)) {
      console.warn(`🚨 SECURITY WARNING: Attempted to display potential ID "${value}" in context: ${context}`);
      console.trace('Stack trace for ID display attempt:');
    }
  }
};