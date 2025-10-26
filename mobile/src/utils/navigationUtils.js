import { router } from 'expo-router';

/**
 * Safe navigation back function that handles cases where there's no previous screen
 * @param {string} fallbackRoute - The route to navigate to if back navigation fails
 */
export const safeGoBack = (fallbackRoute = '/tabs/home') => {
  try {
    // Check if we can go back by checking the navigation state
    if (router.canGoBack()) {
      router.back();
    } else {
      // If we can't go back, navigate to the fallback route
      router.replace(fallbackRoute);
    }
  } catch (error) {
    console.warn('Navigation back failed, using fallback route:', error);
    router.replace(fallbackRoute);
  }
};

/**
 * Safe navigation back for specific contexts
 */
export const safeGoBackToProfile = () => safeGoBack('/tabs/profile');
export const safeGoBackToHome = () => safeGoBack('/tabs/home');
export const safeGoBackToCart = () => safeGoBack('/tabs/cart');
export const safeGoBackToProducts = () => safeGoBack('/tabs/products');