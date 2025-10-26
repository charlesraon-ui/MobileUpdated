# 🚚 Delivery Messaging System - Cross-Platform Integration Guide

This guide provides all the code and integration steps needed to implement the delivery messaging system in your driver module for cross-platform communication.

## 📋 Table of Contents
1. [Backend API Endpoints](#backend-api-endpoints)
2. [Database Model](#database-model)
3. [Real-time Socket.IO Events](#real-time-socketio-events)
4. [Frontend Integration Examples](#frontend-integration-examples)
5. [Driver Module Integration](#driver-module-integration)
6. [API Usage Examples](#api-usage-examples)

---

## 🔗 Backend API Endpoints

### Base URL: `/api/delivery-messages`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| `POST` | `/send` | Send a message | Admin/Customer |
| `GET` | `/order/:orderId` | Get messages for order | Admin/Customer |
| `GET` | `/conversations` | Get all conversations | Admin only |
| `GET` | `/unread-count` | Get unread count | Admin/Customer |
| `PUT` | `/:messageId/read` | Mark message as read | Admin/Customer |
| `POST` | `/bulk-read` | Mark multiple as read | Admin/Customer |

---

## 🗄️ Database Model

```javascript
// DeliveryMessage Schema
const deliveryMessageSchema = {
  orderId: ObjectId,           // Reference to order
  deliveryId: ObjectId,        // Reference to delivery
  customerId: ObjectId,        // Customer who placed order
  senderId: ObjectId,          // Who sent the message
  senderType: String,          // "customer" or "admin"
  message: String,             // Message content (max 1000 chars)
  messageType: String,         // "general", "status_update", "location_update", "delivery_issue", "delivery_complete"
  isRead: Boolean,             // Read status
  readAt: Date,                // When message was read
  deliveryStatus: String,      // Current delivery status
  location: {                  // Optional location data
    latitude: Number,
    longitude: Number,
    address: String
  },
  attachments: [String],       // Array of file URLs
  createdAt: Date,
  updatedAt: Date
}
```

---

## ⚡ Real-time Socket.IO Events

### Client Events (Emit)
```javascript
// Join delivery room for an order
socket.emit('join_delivery_room', orderId);

// Leave delivery room
socket.emit('leave_delivery_room', orderId);

// Send typing indicator
socket.emit('typing_delivery', { orderId, isTyping: true });

// Broadcast new message (optional - handled by API)
socket.emit('new_delivery_message', messageData);
```

### Server Events (Listen)
```javascript
// Receive new message
socket.on('delivery_message_received', (messageData) => {
  // Handle new message in UI
});

// Typing indicator
socket.on('user_typing_delivery', ({ userId, isTyping, isAdmin }) => {
  // Show/hide typing indicator
});

// Admin notifications (admin only)
socket.on('new_customer_delivery_message', (messageData) => {
  // Handle customer message notification
});
```

---

## 🌐 Frontend Integration Examples

### 1. React/Next.js Integration

```jsx
// DeliveryChat.jsx
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const DeliveryChat = ({ orderId, userToken, isAdmin = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: { token: userToken }
    });

    socketInstance.on('connect', () => {
      console.log('Connected to delivery messaging');
      socketInstance.emit('join_delivery_room', orderId);
    });

    socketInstance.on('delivery_message_received', (messageData) => {
      setMessages(prev => [...prev, messageData]);
      scrollToBottom();
    });

    socketInstance.on('user_typing_delivery', ({ userId, isTyping, isAdmin }) => {
      setIsTyping(isTyping);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit('leave_delivery_room', orderId);
      socketInstance.disconnect();
    };
  }, [orderId, userToken]);

  // Load existing messages
  useEffect(() => {
    loadMessages();
  }, [orderId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/delivery-messages/order/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/delivery-messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          message: newMessage,
          messageType: 'general'
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        // Message will be added via Socket.IO event
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = (typing) => {
    if (socket) {
      socket.emit('typing_delivery', { orderId, isTyping: typing });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="delivery-chat">
      <div className="chat-header">
        <h3>Delivery Chat - Order #{orderId.slice(-6)}</h3>
      </div>
      
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message._id} 
            className={`message ${message.senderType === 'admin' ? 'admin' : 'customer'}`}
          >
            <div className="message-header">
              <span className="sender">{message.senderDetails?.name}</span>
              <span className="timestamp">
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">{message.message}</div>
            {message.location && (
              <div className="location">
                📍 {message.location.address}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="typing-indicator">
            Someone is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onFocus={() => handleTyping(true)}
          onBlur={() => handleTyping(false)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

export default DeliveryChat;
```

### 2. Vue.js Integration

```vue
<!-- DeliveryChat.vue -->
<template>
  <div class="delivery-chat">
    <div class="chat-header">
      <h3>Delivery Chat - Order #{{ orderId.slice(-6) }}</h3>
    </div>
    
    <div class="messages-container" ref="messagesContainer">
      <div 
        v-for="message in messages" 
        :key="message._id"
        :class="['message', message.senderType]"
      >
        <div class="message-header">
          <span class="sender">{{ message.senderDetails?.name }}</span>
          <span class="timestamp">
            {{ formatTime(message.createdAt) }}
          </span>
        </div>
        <div class="message-content">{{ message.message }}</div>
        <div v-if="message.location" class="location">
          📍 {{ message.location.address }}
        </div>
      </div>
      <div v-if="isTyping" class="typing-indicator">
        Someone is typing...
      </div>
    </div>

    <div class="message-input">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        @focus="handleTyping(true)"
        @blur="handleTyping(false)"
        placeholder="Type your message..."
        :disabled="loading"
      />
      <button @click="sendMessage" :disabled="loading || !newMessage.trim()">
        Send
      </button>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  name: 'DeliveryChat',
  props: {
    orderId: String,
    userToken: String,
    isAdmin: { type: Boolean, default: false }
  },
  data() {
    return {
      messages: [],
      newMessage: '',
      isTyping: false,
      socket: null,
      loading: false
    };
  },
  async mounted() {
    await this.initializeSocket();
    await this.loadMessages();
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.emit('leave_delivery_room', this.orderId);
      this.socket.disconnect();
    }
  },
  methods: {
    async initializeSocket() {
      this.socket = io(process.env.VUE_APP_API_URL, {
        auth: { token: this.userToken }
      });

      this.socket.on('connect', () => {
        this.socket.emit('join_delivery_room', this.orderId);
      });

      this.socket.on('delivery_message_received', (messageData) => {
        this.messages.push(messageData);
        this.$nextTick(() => this.scrollToBottom());
      });

      this.socket.on('user_typing_delivery', ({ isTyping }) => {
        this.isTyping = isTyping;
      });
    },

    async loadMessages() {
      try {
        const response = await fetch(`/api/delivery-messages/order/${this.orderId}`, {
          headers: {
            'Authorization': `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success) {
          this.messages = data.messages;
          this.$nextTick(() => this.scrollToBottom());
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    },

    async sendMessage() {
      if (!this.newMessage.trim()) return;

      this.loading = true;
      try {
        const response = await fetch('/api/delivery-messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.userToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: this.orderId,
            message: this.newMessage,
            messageType: 'general'
          })
        });

        const data = await response.json();
        if (data.success) {
          this.newMessage = '';
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        this.loading = false;
      }
    },

    handleTyping(typing) {
      if (this.socket) {
        this.socket.emit('typing_delivery', { 
          orderId: this.orderId, 
          isTyping: typing 
        });
      }
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      container.scrollTop = container.scrollHeight;
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString();
    }
  }
};
</script>
```

---

## 🚛 Driver Module Integration

### Driver Dashboard Component

```javascript
// DriverDeliveryChat.js
class DriverDeliveryChat {
  constructor(apiBaseUrl, driverToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.driverToken = driverToken;
    this.socket = null;
    this.activeChats = new Map();
  }

  // Initialize driver dashboard
  async initialize() {
    await this.connectSocket();
    await this.loadActiveDeliveries();
  }

  // Connect to Socket.IO
  async connectSocket() {
    this.socket = io(this.apiBaseUrl, {
      auth: { token: this.driverToken }
    });

    this.socket.on('connect', () => {
      console.log('Driver connected to messaging system');
    });

    this.socket.on('new_customer_delivery_message', (messageData) => {
      this.handleNewCustomerMessage(messageData);
    });
  }

  // Load active deliveries for driver
  async loadActiveDeliveries() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/delivery-messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${this.driverToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        this.displayConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }

  // Send message to customer
  async sendMessageToCustomer(orderId, message, messageType = 'general', location = null) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/delivery-messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.driverToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          message,
          messageType,
          location
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to send message:', error);
      return { success: false, error: error.message };
    }
  }

  // Send location update
  async sendLocationUpdate(orderId, latitude, longitude, address) {
    return await this.sendMessageToCustomer(
      orderId,
      `📍 Location update: ${address}`,
      'location_update',
      { latitude, longitude, address }
    );
  }

  // Send delivery status update
  async sendStatusUpdate(orderId, status, customMessage = '') {
    const statusMessages = {
      'picked_up': '📦 Your order has been picked up and is on the way!',
      'in_transit': '🚛 Your order is in transit and will arrive soon!',
      'delivered': '✅ Your order has been delivered successfully!',
      'delivery_issue': '⚠️ There is an issue with your delivery.'
    };

    const message = customMessage || statusMessages[status] || 'Delivery status updated';
    
    return await this.sendMessageToCustomer(
      orderId,
      message,
      'status_update'
    );
  }

  // Handle new customer message
  handleNewCustomerMessage(messageData) {
    // Update UI to show new message notification
    this.showNotification(`New message from customer for order #${messageData.orderId.slice(-6)}`);
    
    // Update conversation in UI
    this.updateConversationUI(messageData.orderId, messageData);
  }

  // Join specific delivery chat
  joinDeliveryChat(orderId) {
    if (this.socket) {
      this.socket.emit('join_delivery_room', orderId);
    }
  }

  // Leave delivery chat
  leaveDeliveryChat(orderId) {
    if (this.socket) {
      this.socket.emit('leave_delivery_room', orderId);
    }
  }

  // UI Helper methods (implement based on your framework)
  displayConversations(conversations) {
    // Implement based on your UI framework
    console.log('Active conversations:', conversations);
  }

  updateConversationUI(orderId, messageData) {
    // Implement based on your UI framework
    console.log('Update conversation UI for order:', orderId);
  }

  showNotification(message) {
    // Implement notification system
    console.log('Notification:', message);
  }
}

// Usage example
const driverChat = new DriverDeliveryChat('http://localhost:5000', driverToken);
await driverChat.initialize();

// Send location update
await driverChat.sendLocationUpdate(
  orderId, 
  40.7128, 
  -74.0060, 
  '123 Main St, New York, NY'
);

// Send status update
await driverChat.sendStatusUpdate(orderId, 'picked_up');
```

---

## 📱 API Usage Examples

### 1. Send Message
```javascript
// POST /api/delivery-messages/send
const sendMessage = async (orderId, message, messageType = 'general') => {
  const response = await fetch('/api/delivery-messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orderId,
      message,
      messageType,
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St, New York, NY'
      },
      attachments: ['https://example.com/image.jpg']
    })
  });
  return await response.json();
};
```

### 2. Get Order Messages
```javascript
// GET /api/delivery-messages/order/:orderId
const getOrderMessages = async (orderId, page = 1, limit = 50) => {
  const response = await fetch(
    `/api/delivery-messages/order/${orderId}?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return await response.json();
};
```

### 3. Get Conversations (Admin)
```javascript
// GET /api/delivery-messages/conversations
const getConversations = async () => {
  const response = await fetch('/api/delivery-messages/conversations', {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};
```

### 4. Mark Messages as Read
```javascript
// POST /api/delivery-messages/bulk-read
const markMessagesAsRead = async (messageIds) => {
  const response = await fetch('/api/delivery-messages/bulk-read', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messageIds })
  });
  return await response.json();
};
```

---

## 🔧 Environment Setup

### Required Environment Variables
```env
# Backend
MONGO_URI=mongodb://localhost:27017/your-database
JWT_SECRET=your-jwt-secret
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
# or
VUE_APP_API_URL=http://localhost:5000
```

### Dependencies
```json
{
  "backend": {
    "socket.io": "^4.7.2",
    "mongoose": "^7.5.0",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2"
  },
  "frontend": {
    "socket.io-client": "^4.7.2"
  }
}
```

---

## 🚀 Quick Start Integration

1. **Copy the backend files** to your project:
   - `models/DeliveryMessage.js`
   - `controllers/deliveryMessageController.js`
   - `routes/deliveryMessageRoutes.js`

2. **Add routes to your server**:
   ```javascript
   import deliveryMessageRoutes from './routes/deliveryMessageRoutes.js';
   app.use('/api/delivery-messages', deliveryMessageRoutes);
   ```

3. **Add Socket.IO events** to your server.js

4. **Implement frontend components** using the examples above

5. **Test the integration** with your driver module

---

## 📞 Support

For any integration issues or questions, refer to the API documentation or contact the development team.

**Happy Coding! 🚀**