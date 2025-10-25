import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  createSupportChatApi,
  getSupportMessagesApi,
  sendSupportMessageApi,
  closeSupportChatApi
} from '../src/api/apiClient';
import socketService from '../src/services/socketService';
import { AppCtx } from '../src/context/AppContext';

export default function SupportChatScreen() {
  const router = useRouter();
  const { user } = useContext(AppCtx);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatRoom, setChatRoom] = useState(null);
  const [adminJoined, setAdminJoined] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'Please log in to access customer support chat.',
        [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]
      );
      return;
    }

    initializeChat();
    setupSocketListeners();

    return () => {
      if (chatRoom?.roomId) {
        socketService.leaveSupportRoom(chatRoom.roomId);
      }
      cleanupSocketListeners();
    };
  }, [user?.id]); // Only depend on user ID to prevent unnecessary re-renders

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Create or get existing support chat
      const response = await createSupportChatApi();
      if (response.data.success) {
        const room = response.data.chatRoom;
        setChatRoom(room);
        setAdminJoined(room.status === 'active' && room.admin);
        
        // Join socket room
        socketService.joinSupportRoom(room.roomId);
        
        // Load existing messages
        await loadMessages(room.roomId);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      
      // Check for authentication error
      if (error.response?.status === 401) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log in again.',
          [
            { text: 'OK', onPress: () => router.replace('/login') }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to start support chat. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId) => {
    try {
      const response = await getSupportMessagesApi(roomId);
      if (response.data.success) {
        setMessages(response.data.messages);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('admin_joined', handleAdminJoined);
    socketService.on('new_support_message', handleNewMessage);
    socketService.on('user_typing_support', handleTyping);
    socketService.on('support_chat_closed', handleChatClosed);
  };

  const cleanupSocketListeners = () => {
    socketService.off('admin_joined', handleAdminJoined);
    socketService.off('new_support_message', handleNewMessage);
    socketService.off('user_typing_support', handleTyping);
    socketService.off('support_chat_closed', handleChatClosed);
  };

  const handleAdminJoined = (data) => {
    if (data.roomId === chatRoom?.roomId) {
      setAdminJoined(true);
      Alert.alert('Support Agent Joined', `${data.admin.name} has joined the chat`);
    }
  };

  const handleNewMessage = (messageData) => {
    setMessages(prev => [...prev, messageData]);
    setTimeout(() => scrollToBottom(), 100);
  };

  const handleTyping = (data) => {
    if (data.userId !== chatRoom?.userId) {
      setOtherUserTyping(data.isTyping);
      if (data.isTyping) {
        setTimeout(() => setOtherUserTyping(false), 3000);
      }
    }
  };

  const handleChatClosed = () => {
    Alert.alert('Chat Closed', 'The support chat has been closed', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !chatRoom) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await sendSupportMessageApi(chatRoom.roomId, messageText);
      // Message will be added via socket listener
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Check for authentication error
      if (error.response?.status === 401) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log in again.',
          [
            { text: 'OK', onPress: () => router.replace('/login') }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
        setNewMessage(messageText); // Restore message on error
      }
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (text) => {
    setNewMessage(text);
    
    if (chatRoom?.roomId) {
      // Send typing indicator
      if (!isTyping && text.length > 0) {
        setIsTyping(true);
        socketService.sendTypingSupport(chatRoom.roomId, true);
      }
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketService.sendTypingSupport(chatRoom.roomId, false);
      }, 1000);
    }
  };

  const closeChat = async () => {
    Alert.alert(
      'Close Chat',
      'Are you sure you want to close this support chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              await closeSupportChatApi(chatRoom.roomId);
              router.back();
            } catch (error) {
              console.error('Error closing chat:', error);
              Alert.alert('Error', 'Failed to close chat');
            }
          }
        }
      ]
    );
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.senderType === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.adminMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.adminBubble]}>
          {!isUser && (
            <Text style={styles.senderName}>
              {item.sender.role === 'superadmin' ? 'Senior Support' : 'Customer Support'}
            </Text>
          )}
          <Text style={[styles.messageText, isUser ? styles.userText : styles.adminText]}>
            {item.message}
          </Text>
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.adminTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Starting support chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Customer Support</Text>
          <Text style={styles.headerSubtitle}>
            {adminJoined ? 'Agent is online' : 'Waiting for agent...'}
          </Text>
        </View>
        <TouchableOpacity onPress={closeChat} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
        />

        {/* Typing indicator */}
        {otherUserTyping && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>Support agent is typing...</Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={handleTextChange}
            placeholder="Type your message..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    marginLeft: 12,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  adminMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  adminText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  adminTimestamp: {
    color: '#999',
  },
  typingContainer: {
    padding: 16,
    paddingTop: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});