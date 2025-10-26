import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    AppState,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    closeSupportChatApi,
    createSupportChatApi,
    getSupportMessagesApi,
    sendSupportMessageApi
} from '../src/api/apiClient';
import { AppCtx } from '../src/context/AppContext';
import socketService from '../src/services/socketService';
import { safeGoBackToProfile } from '../src/utils/navigationUtils';

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
  const [connectionError, setConnectionError] = useState(false);
  const [retrying, setRetrying] = useState(false);
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

    return () => {
      if (chatRoom?.roomId) {
        socketService.leaveSupportRoom(chatRoom.roomId);
      }
      cleanupSocketListeners();
    };
  }, [user?.id]); // Only depend on user ID to prevent unnecessary re-renders

  // Handle app state changes (when user switches tabs)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('App state changed to:', nextAppState);
      
      if (nextAppState === 'active' && chatRoom?.roomId) {
        // App became active, ensure socket connection and rejoin room
        console.log('App became active, checking socket connection...');
        
        const connectionStatus = socketService.getConnectionStatus();
        if (!connectionStatus.isConnected) {
          console.log('Socket disconnected, reconnecting...');
          retryConnection();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, [chatRoom?.roomId]);

  const retryConnection = async () => {
    try {
      setRetrying(true);
      setConnectionError(false);
      
      console.log('🔄 Retrying connection...');
      
      // Use the socket service retry method
      await socketService.retryConnection();
      
      // Wait for connection to establish
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const connectionStatus = socketService.getConnectionStatus();
      if (connectionStatus.isConnected) {
        console.log('✅ Connection retry successful');
        
        // If we have a chat room, rejoin it
        if (chatRoom?.roomId) {
          setupSocketListeners();
          socketService.joinSupportRoom(chatRoom.roomId);
        } else {
          // Reinitialize chat if no room exists
          await initializeChat();
        }
        
        setConnectionError(false);
      } else {
        console.error('❌ Connection retry failed');
        setConnectionError(true);
      }
    } catch (error) {
      console.error('Error during connection retry:', error);
      setConnectionError(true);
    } finally {
      setRetrying(false);
    }
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      setConnectionError(false);
      
      // Ensure socket is connected before proceeding
      const connectionStatus = socketService.getConnectionStatus();
      if (!connectionStatus.isConnected) {
        console.log('Socket not connected, attempting to connect...');
        await socketService.connect();
        
        // Wait a bit for connection to establish
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check connection status again
        const newStatus = socketService.getConnectionStatus();
        if (!newStatus.isConnected) {
          console.error('Failed to establish socket connection');
          setConnectionError(true);
          return;
        }
      }
      
      // Create or get existing support chat
      const response = await createSupportChatApi();
      if (response.data.success) {
        const room = response.data.chatRoom;
        setChatRoom(room);
        setAdminJoined(room.status === 'active' && room.admin);
        
        // Setup socket listeners BEFORE joining room
        setupSocketListeners();
        
        // Join socket room
        socketService.joinSupportRoom(room.roomId);
        
        // Load existing messages
        await loadMessages(room.roomId);
        
        // Clear any previous connection errors
        setConnectionError(false);
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
      } else if (error.message?.includes('timeout') || error.code === 'NETWORK_ERROR') {
        // Connection timeout or network error
        console.error('Connection timeout detected');
        setConnectionError(true);
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
      const adminName = data.admin?.name || data.admin?.firstName || 'Support Agent';
      Alert.alert('Support Agent Joined', `${adminName} has joined the chat`);
    }
  };

  const handleNewMessage = (messageData) => {
    console.log('📨 Received new support message:', messageData);
    
    // Ensure we have valid message data
    if (!messageData || !messageData.id) {
      console.warn('Invalid message data received:', messageData);
      return;
    }
    
    // Add the new message to the list
    setMessages(prev => {
      // Check if message already exists to prevent duplicates
      const messageExists = prev.some(msg => msg.id === messageData.id);
      if (messageExists) {
        console.log('Message already exists, skipping duplicate');
        return prev;
      }
      
      console.log('Adding new message to chat');
      const newMessages = [...prev, messageData];
      
      // Scroll to bottom after state update
      setTimeout(() => scrollToBottom(), 100);
      
      return newMessages;
    });
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
      { text: 'OK', onPress: () => safeGoBackToProfile() }
    ]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRoom?.roomId || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      console.log('📤 Sending message:', messageText);
      
      const response = await sendSupportMessageApi(chatRoom.roomId, messageText);
      
      if (response.data.success) {
        console.log('✅ Message sent successfully:', response.data.message);
        
        // Add the message to local state immediately
        const newMsg = response.data.message;
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(msg => msg.id === newMsg.id);
          if (!messageExists) {
            return [...prev, newMsg];
          }
          return prev;
        });
        
        // Scroll to bottom
        setTimeout(() => scrollToBottom(), 100);
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Restore the message text so user can try again
      setNewMessage(messageText);
      
      Alert.alert(
        'Error',
        'Failed to send message. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
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
              safeGoBackToProfile();
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
    
    // Get sender name with proper fallbacks
    const getSenderName = () => {
      if (isUser) {
        return user?.name || user?.firstName || 'You';
      } else {
        // For admin messages
        if (item.sender?.name) {
          return item.sender.name;
        } else if (item.sender?.role === 'superadmin') {
          return 'Senior Support';
        } else if (item.sender?.role === 'admin') {
          return 'Customer Support';
        } else {
          return 'Support Agent';
        }
      }
    };
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.adminMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.adminBubble]}>
          {!isUser && (
            <Text style={styles.senderName}>
              {getSenderName()}
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

  if (connectionError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => safeGoBackToProfile()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Customer Support</Text>
            <Text style={styles.headerSubtitle}>Connection Error</Text>
          </View>
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="wifi-off" size={64} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Connection Timeout</Text>
          <Text style={styles.errorMessage}>
            Unable to connect to the support chat server. Please check your internet connection and try again.
          </Text>
          
          <TouchableOpacity
            style={[styles.retryButton, retrying && styles.retryButtonDisabled]}
            onPress={retryConnection}
            disabled={retrying}
          >
            {retrying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="refresh" size={20} color="#fff" />
            )}
            <Text style={styles.retryButtonText}>
              {retrying ? 'Retrying...' : 'Retry Connection'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backToSupportButton}
            onPress={() => safeGoBackToProfile()}
          >
            <Text style={styles.backToSupportButtonText}>Back to Support Options</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBackToProfile()} style={styles.backButton}>
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
  
  // Error UI styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  retryButtonDisabled: {
    backgroundColor: '#ccc',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backToSupportButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backToSupportButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});