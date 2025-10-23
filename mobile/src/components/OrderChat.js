import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AppCtx } from '../context/AppContext';

export default function OrderChat({ orderId, visible = false }) {
  const { socketService, user } = useContext(AppCtx);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!socketService || !orderId || !visible) return;

    console.log('🔌 Setting up OrderChat for order:', orderId);

    // Join the order room
    socketService.joinOrder(orderId);
    setIsConnected(socketService.isConnected);

    // Listen for messages
    const handleMessage = (data) => {
      console.log('💬 New message received:', data);
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        text: data.text,
        sender: data.sender || 'Unknown',
        timestamp: new Date(data.timestamp || Date.now()),
        isOwn: data.sender === user?.name || data.userId === user?._id
      }]);
    };

    // Listen for order updates
    const handleOrderUpdate = (data) => {
      console.log('📦 Order update received:', data);
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        text: `Order status updated: ${data.status}`,
        sender: 'System',
        timestamp: new Date(),
        isSystem: true
      }]);
    };

    socketService.onMessage(handleMessage);
    socketService.onOrderUpdate(handleOrderUpdate);

    return () => {
      console.log('🧹 Cleaning up OrderChat for order:', orderId);
      socketService.leaveOrder(orderId);
      socketService.off('message', handleMessage);
      socketService.off('order:update', handleOrderUpdate);
    };
  }, [socketService, orderId, visible, user]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socketService || !orderId) return;

    console.log('📤 Sending message:', newMessage);
    
    // Add message to local state immediately for better UX
    const tempMessage = {
      id: Date.now(),
      text: newMessage,
      sender: user?.name || 'You',
      timestamp: new Date(),
      isOwn: true,
      isPending: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    // Send via WebSocket
    socketService.sendMessage(orderId, newMessage);
    setNewMessage('');
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.isOwn && styles.ownMessage,
      item.isSystem && styles.systemMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.isOwn && styles.ownBubble,
        item.isSystem && styles.systemBubble,
        item.isPending && styles.pendingBubble
      ]}>
        {!item.isOwn && !item.isSystem && (
          <Text style={styles.senderName}>{item.sender}</Text>
        )}
        <Text style={[
          styles.messageText,
          item.isOwn && styles.ownMessageText,
          item.isSystem && styles.systemMessageText
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.timestamp,
          item.isOwn && styles.ownTimestamp
        ]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {item.isPending && ' ⏳'}
        </Text>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order Chat</Text>
        <View style={[styles.connectionStatus, isConnected && styles.connected]}>
          <Text style={styles.connectionText}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={500}
          editable={isConnected}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || !isConnected) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || !isConnected}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  connectionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  connected: {
    backgroundColor: '#D1FAE5',
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  systemMessage: {
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownBubble: {
    backgroundColor: '#3B82F6',
  },
  systemBubble: {
    backgroundColor: '#F3F4F6',
    maxWidth: '90%',
  },
  pendingBubble: {
    opacity: 0.7,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  systemMessageText: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});