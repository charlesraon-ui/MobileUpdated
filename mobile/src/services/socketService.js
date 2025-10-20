import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  async connect() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token found, cannot connect to socket');
        return;
      }

      // Use your backend URL
      const SOCKET_URL = 'https://goagritrading-backend.onrender.com';
      
      this.socket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
      });

      // Set up message listeners
      this.setupMessageListeners();

    } catch (error) {
      console.error('Error connecting to socket:', error);
    }
  }

  setupMessageListeners() {
    if (!this.socket) return;

    // Direct message listeners
    this.socket.on('new_dm_message', (data) => {
      this.emit('new_dm_message', data);
    });

    this.socket.on('new_dm_notification', (data) => {
      this.emit('new_dm_notification', data);
    });

    this.socket.on('user_typing_dm', (data) => {
      this.emit('user_typing_dm', data);
    });

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
  }

  // Join rooms
  joinDMRoom(otherUserId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_dm_room', otherUserId);
    }
  }

  leaveDMRoom(otherUserId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_dm_room', otherUserId);
    }
  }

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
  sendTypingDM(otherUserId, isTyping) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_dm', { otherUserId, isTyping });
    }
  }

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
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Export singleton instance
export default new SocketService();