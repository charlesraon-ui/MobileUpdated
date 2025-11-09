import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

class PromoService {
  constructor() {
    // Use environment variable for API URL
    // Prefer app.json extra over environment; include manifestExtra fallback
    const configApiUrl = (Constants?.expoConfig?.extra?.apiUrl) || (Constants?.manifestExtra?.apiUrl);
    const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
    let API_URL = configApiUrl || envApiUrl || "http://localhost:5000";
    try {
      const host = new URL(API_URL).hostname;
      const isLocal = host === "localhost" || host === "127.0.0.1";
      const isRender = host.endsWith(".onrender.com") || host === "onrender.com";
      if (!(isLocal || isRender)) {
        API_URL = "https://goagritrading-backend.onrender.com"; // safe default
      }
    } catch {
      API_URL = "https://goagritrading-backend.onrender.com"; // safe default when parsing fails
    }
    this.baseURL = `${API_URL}/api/promo`;
  }

  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Apply promo code to cart
  async applyPromoCode(code, subtotal) {
    try {
      const response = await fetch(`${this.baseURL}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          subtotal: subtotal
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to apply promo code');
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Apply promo code error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get available promo codes (admin only)
  async getPromoCodes() {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.baseURL}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch promo codes');
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Get promo codes error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create new promo code (admin only)
  async createPromoCode(promoData) {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.baseURL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(promoData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create promo code');
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Create promo code error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Toggle promo code status (admin only)
  async togglePromoStatus(promoId) {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.baseURL}/${promoId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle promo status');
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Toggle promo status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update promo code (admin only)
  async updatePromoCode(promoId, updates) {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.baseURL}/${promoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update promo code');
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Update promo code error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete promo code (admin only)
  async deletePromoCode(promoId) {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.baseURL}/${promoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete promo code');
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Delete promo code error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate promo code format
  validatePromoCode(code) {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'Promo code is required' };
    }

    const trimmedCode = code.trim();
    if (trimmedCode.length === 0) {
      return { valid: false, error: 'Promo code cannot be empty' };
    }

    if (trimmedCode.length > 20) {
      return { valid: false, error: 'Promo code is too long' };
    }

    // Allow alphanumeric characters and common symbols
    const validPattern = /^[A-Z0-9\-_]+$/i;
    if (!validPattern.test(trimmedCode)) {
      return { valid: false, error: 'Promo code contains invalid characters' };
    }

    return { valid: true, code: trimmedCode.toUpperCase() };
  }
}

export default new PromoService();