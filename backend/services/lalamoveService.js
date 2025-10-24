import crypto from 'crypto';
import axios from 'axios';

class LalamoveService {
  constructor() {
    this.apiKey = process.env.LALAMOVE_API_KEY;
    this.apiSecret = process.env.LALAMOVE_API_SECRET;
    this.market = process.env.LALAMOVE_MARKET;
    this.baseUrl = process.env.LALAMOVE_API_URL;
  }

  // Generate signature for Lalamove API authentication
  generateSignature(method, path, body = '', timestamp) {
    const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(rawSignature)
      .digest('hex');
  }

  // Get headers for API requests
  getHeaders(method, path, body = '') {
    const timestamp = Date.now();
    const signature = this.generateSignature(method, path, body, timestamp);
    
    return {
      'Authorization': `hmac ${this.apiKey}:${timestamp}:${signature}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Market': this.market
    };
  }

  // Get quotation for delivery
  async getQuotation(quotationData) {
    try {
      const path = '/v3/quotations';
      const body = JSON.stringify(quotationData);
      const headers = this.getHeaders('POST', path, body);

      const response = await axios.post(`${this.baseUrl}${path}`, quotationData, {
        headers
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Lalamove quotation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Create delivery order
  async createOrder(orderData) {
    try {
      const path = '/v3/orders';
      const body = JSON.stringify(orderData);
      const headers = this.getHeaders('POST', path, body);

      const response = await axios.post(`${this.baseUrl}${path}`, orderData, {
        headers
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Lalamove order creation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Get order details and status
  async getOrderDetails(orderId) {
    try {
      const path = `/v3/orders/${orderId}`;
      const headers = this.getHeaders('GET', path);

      const response = await axios.get(`${this.baseUrl}${path}`, {
        headers
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Lalamove get order error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Get driver location
  async getDriverLocation(orderId) {
    try {
      const path = `/v3/orders/${orderId}/drivers`;
      const headers = this.getHeaders('GET', path);

      const response = await axios.get(`${this.baseUrl}${path}`, {
        headers
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Lalamove driver location error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Cancel order
  async cancelOrder(orderId) {
    try {
      const path = `/v3/orders/${orderId}`;
      const headers = this.getHeaders('DELETE', path);

      const response = await axios.delete(`${this.baseUrl}${path}`, {
        headers
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Lalamove cancel order error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Map Lalamove status to our internal status
  mapLalamoveStatus(lalamoveStatus) {
    const statusMap = {
      'ASSIGNING_DRIVER': 'pending',
      'ON_GOING': 'assigned',
      'PICKED_UP': 'in-transit',
      'COMPLETED': 'completed',
      'CANCELED': 'cancelled',
      'EXPIRED': 'cancelled'
    };

    return statusMap[lalamoveStatus] || 'pending';
  }

  // Format quotation data for Lalamove API
  formatQuotationData(pickupCoords, deliveryCoords, serviceType = 'MOTORCYCLE') {
    return {
      serviceType,
      stops: [
        {
          coordinates: {
            lat: pickupCoords.lat.toString(),
            lng: pickupCoords.lng.toString()
          }
        },
        {
          coordinates: {
            lat: deliveryCoords.lat.toString(),
            lng: deliveryCoords.lng.toString()
          }
        }
      ],
      item: {
        quantity: '1',
        weight: 'LESS_THAN_3_KG',
        categories: ['FOOD_DELIVERY'],
        handlingInstructions: ['KEEP_UPRIGHT']
      }
    };
  }

  // Format order data for Lalamove API
  formatOrderData(quotationId, pickupCoords, deliveryCoords, customerInfo, orderDetails) {
    return {
      quotationId,
      sender: {
        stopId: 'stop-1',
        name: 'GoAgri Trading',
        phone: '+639123456789'
      },
      recipients: [
        {
          stopId: 'stop-2',
          name: customerInfo.name,
          phone: customerInfo.phone,
          remarks: orderDetails.notes || 'Please handle with care'
        }
      ],
      deliveries: [
        {
          toStopId: 'stop-2',
          toContact: {
            name: customerInfo.name,
            phone: customerInfo.phone
          },
          remarks: orderDetails.notes || 'Delivery from GoAgri Trading'
        }
      ]
    };
  }
}

export default new LalamoveService();