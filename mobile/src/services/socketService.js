import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.connectionTimeout = null;
    this.isConnecting = false;
  }

  async connect() {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('Connection already in progress...');
      return;
    }

    try {
      this.isConnecting = true;
      const token = await AsyncStorage.getItem('pos-token');
      if (!token) {
        console.log('No token found, cannot connect to socket');
        this.isConnecting = false;
        return;
      }

      // Use local backend URL for development
      const SOCKET_URL =  'https://mobile-backend-zzy4.onrender.com' || 'http://localhost:5000';
      console.log('🔌 Attempting to connect to socket:', SOCKET_URL);
      
      // Disconnect existing socket if any
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      this.socket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000, // 20 second connection timeout
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: this.maxReconnectAttempts,
        randomizationFactor: 0.5,
        forceNew: true
      });

      // Set up connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.error('❌ Socket connection timeout after 20 seconds');
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, 20000);

      this.socket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Clear connection timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        this.isConnected = false;
        this.isConnecting = false;
        
        // Clear connection timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        // Auto-reconnect for certain disconnect reasons
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          this.scheduleReconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        this.handleConnectionError(error);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Socket reconnection attempt ${attemptNumber}`);
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('❌ Socket reconnection error:', error.message);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('❌ Socket reconnection failed after maximum attempts');
        this.isConnected = false;
        this.isConnecting = false;
      });

      // Set up message listeners
      this.setupMessageListeners();

    } catch (error) {
      console.error('❌ Error connecting to socket:', error);
      this.isConnecting = false;
      this.handleConnectionError(error);
    }
  }

  handleConnectionError(error) {
    this.isConnected = false;
    this.isConnecting = false;
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Schedule reconnect if we haven't exceeded max attempts
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('❌ Max reconnection attempts reached. Please check your connection.');
    }
  }

  scheduleReconnect() {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30 seconds
    
    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isConnected && !this.isConnecting) {
        console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect();
      }
    }, delay);
  }

  setupMessageListeners() {
    if (!this.socket) return;



    // Group message listeners
    this.socket.on('new_group_message', (data) => {
      this.emit('new_group_message', data);
    });

    this.socket.on('new_group_notification', (data) => {
      this.emit('new_group_notification', data);
    });

    this.socket.on('user_typing_group', (data) => {
      this.emit('user_typing_group', data);
    });

    // Support chat listeners
    this.socket.on('new_support_request', (data) => {
      this.emit('new_support_request', data);
    });

    this.socket.on('admin_joined', (data) => {
      this.emit('admin_joined', data);
    });

    this.socket.on('new_support_message', (data) => {
      this.emit('new_support_message', data);
    });

    this.socket.on('user_typing_support', (data) => {
      this.emit('user_typing_support', data);
    });

    this.socket.on('support_chat_closed', (data) => {
      this.emit('support_chat_closed', data);
    });

    this.socket.on('support_chat_taken', (data) => {
      this.emit('support_chat_taken', data);
    });

    // Inventory/Product listeners
    this.socket.on('inventory:update', (data) => {
      this.emit('inventory:update', data);
    });

    this.socket.on('inventory:created', (data) => {
      this.emit('inventory:created', data);
    });

    this.socket.on('inventory:deleted', (data) => {
      this.emit('inventory:deleted', data);
    });

    // Order listeners
    this.socket.on('order:update', (data) => {
      this.emit('order:update', data);
    });

    this.socket.on('order:status', (data) => {
      this.emit('order:status', data);
    });

    // Notification listeners
    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });

    // Loyalty/Points listeners
    this.socket.on('loyalty:update', (data) => {
      this.emit('loyalty:update', data);
    });

    this.socket.on('points:earned', (data) => {
      this.emit('points:earned', data);
    });

    // Cart listeners
    this.socket.on('cart:update', (data) => {
      this.emit('cart:update', data);
    });
  }

  // Join rooms

  joinGroupRoom(groupId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_group_room', groupId);
    }
  }

  leaveGroupRoom(groupId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_group_room', groupId);
    }
  }

  // Typing indicators

  sendTypingGroup(groupId, isTyping) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_group', { groupId, isTyping });
    }
  }

  // Support chat methods
  joinSupportRoom(roomId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_support_room', roomId);
    }
  }

  leaveSupportRoom(roomId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_support_room', roomId);
    }
  }

  sendTypingSupport(roomId, isTyping) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_support', { roomId, isTyping });
    }
  }

  // Inventory/Product methods
  onInventoryUpdate(callback) {
    this.on('inventory:update', callback);
  }

  onInventoryCreated(callback) {
    this.on('inventory:created', callback);
  }

  onInventoryDeleted(callback) {
    this.on('inventory:deleted', callback);
  }

  // Order methods
  joinOrder(orderId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join', { orderId });
      console.log('📱 Joined order room:', orderId);
    }
  }

  leaveOrder(orderId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave', { orderId });
      console.log('📱 Left order room:', orderId);
    }
  }

  sendMessage(orderId, text) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message', { orderId, text });
      console.log('📤 Message sent to order:', orderId);
    } else {
      console.warn('⚠️ Cannot send message: WebSocket not connected');
    }
  }

  onMessage(callback) {
    this.on('message', callback);
  }

  onOrderUpdate(callback) {
    this.on('order:update', callback);
  }

  onOrderStatusChange(callback) {
    this.on('order:status', callback);
  }

  // User-specific methods
  joinUserRoom(userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join:user', { userId });
      console.log('👤 Joined user room:', userId);
    }
  }

  leaveUserRoom(userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave:user', { userId });
      console.log('👤 Left user room:', userId);
    }
  }

  // Notification methods
  onNotification(callback) {
    this.on('notification', callback);
  }

  // Loyalty/Points methods
  onLoyaltyUpdate(callback) {
    this.on('loyalty:update', callback);
  }

  onPointsEarned(callback) {
    this.on('points:earned', callback);
  }

  // Cart methods
  onCartUpdate(callback) {
    this.on('cart:update', callback);
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket listener for ${event}:`, error);
        }
      });
    }
  }

  disconnect() {
    console.log('🔌 Manually disconnecting socket...');
    
    // Clear any pending connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Reset connection state
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Clear all listeners
    this.listeners.clear();
  }

  // Manual retry method for user-initiated reconnection
  async retryConnection() {
    console.log('🔄 Manual retry connection requested...');
    
    // Reset reconnection attempts for manual retry
    this.reconnectAttempts = 0;
    
    // Disconnect first if connected
    if (this.socket) {
      this.disconnect();
    }
    
    // Wait a moment before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Attempt to connect
    await this.connect();
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Export singleton instance
export default new SocketService();