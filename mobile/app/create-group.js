import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { searchUsersApi } from '../src/api/apiClient';
import { useContext } from 'react';
import { AppCtx } from '../src/context/AppContext';
import { safeGoBackToHome } from '../src/utils/navigationUtils';

const GREEN = '#4CAF50';
const LIGHT_GREEN = '#E8F5E8';
const GRAY = '#666';
const LIGHT_GRAY = '#F5F5F5';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useContext(AppCtx);
  
  // Temporary mock user for testing
  const mockUser = {
    _id: 'test-user-id',
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGVmYTRkNzYxOGVkN2I5YTlhZDRhZTUiLCJlbWFpbCI6ImpvaG4uZG9lQHRlc3QuY29tIiwiaWF0IjoxNzYwNTM2MDg4LCJleHAiOjE3NjMxMjgwODh9.C6mP-iFQoY22mOqnu586RMZpg81z8AtXbxfRLvbh5C4'
  };
  
  // Use mock user if no real user is authenticated
  const currentUser = user || mockUser;
  
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      setSearching(true);
      
      // For testing: make direct API call with token
      const base = (require('../src/api/apiClient').API_URL);
      const response = await fetch(`${base}/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Filter out current user and already selected users
        const filteredResults = data.users.filter(
          searchUser => 
            searchUser._id !== currentUser.id && 
            !selectedUsers.some(selected => selected._id === searchUser._id)
        );
        setSearchResults(filteredResults);
      } else {
        console.error('Search API error:', data);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const toggleUserSelection = (selectedUser) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(user => user._id === selectedUser._id);
      if (isSelected) {
        return prev.filter(user => user._id !== selectedUser._id);
      } else {
        return [...prev, selectedUser];
      }
    });
    
    // Remove from search results when selected
    setSearchResults(prev => 
      prev.filter(user => user._id !== selectedUser._id)
    );
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers(prev => prev.filter(user => user._id !== userId));
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one participant');
      return;
    }

    try {
      setCreating(true);
      
      const participantIds = selectedUsers.map(user => user._id);
      
      const base2 = (require('../src/api/apiClient').API_URL);
      const response = await fetch(`${base2}/api/group-chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim(),
          participantIds
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success', 
          'Group chat created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                safeGoBackToHome();
                // Navigate to the new group chat
                router.push(`/group-chat?groupId=${data.groupChat._id}`);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to create group chat');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group chat');
    } finally {
      setCreating(false);
    }
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => toggleUserSelection(item)}
    >
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {item.firstName?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
      </View>
      <Ionicons name="add-circle-outline" size={24} color={GREEN} />
    </TouchableOpacity>
  );

  const renderSelectedUser = ({ item }) => (
    <View style={styles.selectedUserChip}>
      <Text style={styles.selectedUserText}>
        {item.firstName} {item.lastName}
      </Text>
      <TouchableOpacity onPress={() => removeSelectedUser(item._id)}>
        <Ionicons name="close-circle" size={20} color={GRAY} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => safeGoBackToHome()}>
            <Ionicons name="arrow-back" size={24} color={GREEN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Group</Text>
          <TouchableOpacity 
            onPress={createGroup}
            disabled={creating || !groupName.trim() || selectedUsers.length === 0}
            style={[
              styles.createButton,
              (creating || !groupName.trim() || selectedUsers.length === 0) && styles.createButtonDisabled
            ]}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Group Info */}
          <View style={styles.groupInfoSection}>
            <Text style={styles.sectionTitle}>Group Information</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Group name (required)"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={100}
            />
            
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Group description (optional)"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              maxLength={500}
            />
          </View>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.sectionTitle}>
                Selected Participants ({selectedUsers.length})
              </Text>
              <FlatList
                data={selectedUsers}
                renderItem={renderSelectedUser}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.selectedUsersList}
              />
            </View>
          )}

          {/* Search Users */}
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>Add Participants</Text>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color={GRAY} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searching && (
                <ActivityIndicator size="small" color={GREEN} style={styles.searchLoader} />
              )}
            </View>

            {/* Search Results */}
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item._id}
              style={styles.searchResults}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                searchQuery.trim() && !searching ? (
                  <Text style={styles.emptyText}>No users found</Text>
                ) : null
              }
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  createButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonDisabled: {
    backgroundColor: '#CCC',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  groupInfoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectedSection: {
    marginBottom: 24,
  },
  selectedUsersList: {
    maxHeight: 60,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedUserText: {
    color: GREEN,
    fontWeight: '500',
    marginRight: 8,
  },
  searchSection: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchLoader: {
    marginLeft: 8,
  },
  searchResults: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: GRAY,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: GRAY,
    fontSize: 16,
    marginTop: 20,
  },
});