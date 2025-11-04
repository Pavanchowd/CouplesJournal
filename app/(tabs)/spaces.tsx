 import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
   
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Define TypeScript interfaces
interface User {
  id: number;
  username: string;
  profilePhoto: string;
  online: boolean;
}

interface Group {
  id: number;
  name: string;
  description: string;
  createdBy: number;
  members: User[];
  createdAt: string;
  isOwner: boolean;
}

interface GroupInvitation {
  id: number;
  groupId: number;
  groupName: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
}

const GroupsScreen = () => {
  const [activeTab, setActiveTab] = useState<'myGroups' | 'invitations'>('myGroups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Modal states
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [addMembersModalVisible, setAddMembersModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Form states
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  // API endpoints - replace with your actual endpoints
  const API_ENDPOINTS = {
    groups: 'https://your-api-domain.com/api/groups',
    invitations: 'https://your-api-domain.com/api/groups/invitations',
    searchUsers: 'https://your-api-domain.com/api/users/search',
    createGroup: 'https://your-api-domain.com/api/groups/create',
    inviteToGroup: 'https://your-api-domain.com/api/groups/invite',
    acceptInvitation: 'https://your-api-domain.com/api/groups/accept-invitation',
    rejectInvitation: 'https://your-api-domain.com/api/groups/reject-invitation',
    leaveGroup: 'https://your-api-domain.com/api/groups/leave',
  };

  // Get authentication token - replace with your actual token retrieval
  const getAuthToken = () => {
    // Replace with your actual token retrieval logic
    return 'YOUR_AUTH_TOKEN_HERE';
  };

  // Fetch user's groups
  const fetchGroups = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.groups, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setGroups(data.groups || []);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
      Alert.alert('Error', 'Failed to load groups');
    }
  };

  // Fetch group invitations
  const fetchInvitations = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.invitations, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setInvitations(data.invitations || []);
      } else {
        setInvitations([]);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setInvitations([]);
    }
  };

  // Search users by username
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_ENDPOINTS.searchUsers}?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.users || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Create new group
  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.createGroup, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          memberIds: selectedUsers.map(user => user.id),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Group created successfully!');
        setCreateGroupModalVisible(false);
        setGroupName('');
        setGroupDescription('');
        setSelectedUsers([]);
        fetchGroups(); // Refresh groups list
      } else {
        Alert.alert('Error', data.message || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  // Add members to existing group
  const addMembersToGroup = async () => {
    if (!selectedGroup || selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select users to add');
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_ENDPOINTS.inviteToGroup}/${selectedGroup.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberIds: selectedUsers.map(user => user.id),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Members invited successfully!');
        setAddMembersModalVisible(false);
        setSelectedUsers([]);
        setSearchQuery('');
        setSearchResults([]);
        fetchGroups(); // Refresh groups list
      } else {
        Alert.alert('Error', data.message || 'Failed to invite members');
      }
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Error', 'Failed to invite members');
    } finally {
      setLoading(false);
    }
  };

  // Accept group invitation
  const acceptInvitation = async (invitationId: number) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_ENDPOINTS.acceptInvitation}/${invitationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'You have joined the group!');
        // Remove the invitation and refresh groups
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        fetchGroups();
      } else {
        Alert.alert('Error', data.message || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Error', 'Failed to accept invitation');
    }
  };

  // Reject group invitation
  const rejectInvitation = async (invitationId: number) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_ENDPOINTS.rejectInvitation}/${invitationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Invitation rejected');
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      } else {
        Alert.alert('Error', data.message || 'Failed to reject invitation');
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      Alert.alert('Error', 'Failed to reject invitation');
    }
  };

  // Leave group
  const leaveGroup = async (groupId: number, groupName: string) => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${groupName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = getAuthToken();
              
              const response = await fetch(`${API_ENDPOINTS.leaveGroup}/${groupId}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const data = await response.json();
              
              if (data.success) {
                Alert.alert('Success', 'You have left the group');
                fetchGroups(); // Refresh groups list
              } else {
                Alert.alert('Error', data.message || 'Failed to leave group');
              }
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group');
            }
          }
        }
      ]
    );
  };

  // Handle user selection for group creation
  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Open add members modal
  const openAddMembersModal = (group: Group) => {
    setSelectedGroup(group);
    setSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
    setAddMembersModalVisible(true);
  };

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchGroups(),
          fetchInvitations()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Search users when query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Get current time for header
  const getCurrentTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Render group item
  const renderGroupItem = ({ item }: { item: Group }) => (
    <View style={styles.groupItem}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupName}>{item.name}</Text>
        {item.isOwner && (
          <View style={styles.ownerBadge}>
            <Text style={styles.ownerText}>Owner</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.groupDescription}>{item.description}</Text>
      
      <View style={styles.membersSection}>
        <Text style={styles.membersTitle}>
          Members ({item.members.length})
        </Text>
        <View style={styles.membersList}>
          {item.members.slice(0, 4).map((member, index) => (
            <View key={member.id} style={styles.memberAvatar}>
              <Image 
                source={{ uri: member.profilePhoto }} 
                style={styles.avatarImage}
              />
              {member.online && <View style={styles.onlineIndicator} />}
            </View>
          ))}
          {item.members.length > 4 && (
            <View style={styles.moreMembers}>
              <Text style={styles.moreMembersText}>+{item.members.length - 4}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.groupActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // Navigate to group journals screen
            Alert.alert('Group Journals', `Navigate to ${item.name} journals`);
          }}
        >
          <Text style={styles.actionButtonText}>View Journals</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.addMembersButton]}
          onPress={() => openAddMembersModal(item)}
        >
          <Text style={[styles.actionButtonText, styles.addMembersButtonText]}>Add Members</Text>
        </TouchableOpacity>
        
        {!item.isOwner && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.leaveButton]}
            onPress={() => leaveGroup(item.id, item.name)}
          >
            <Text style={[styles.actionButtonText, styles.leaveButtonText]}>Leave</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Render invitation item
  const renderInvitationItem = ({ item }: { item: GroupInvitation }) => (
    <View style={styles.invitationItem}>
      <View style={styles.invitationHeader}>
        <Text style={styles.invitationGroupName}>{item.groupName}</Text>
        <Text style={styles.invitedBy}>Invited by {item.invitedBy}</Text>
      </View>
      
      <View style={styles.invitationActions}>
        <TouchableOpacity 
          style={[styles.invitationButton, styles.acceptButton]}
          onPress={() => acceptInvitation(item.id)}
        >
          <Text style={styles.invitationButtonText}>Accept</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.invitationButton, styles.rejectButton]}
          onPress={() => rejectInvitation(item.id)}
        >
          <Text style={[styles.invitationButtonText, styles.rejectButtonText]}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render user search result
  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.some(u => u.id === item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => toggleUserSelection(item)}
      >
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: item.profilePhoto }} 
            style={styles.userAvatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.userStatus}>
              {item.online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        
        <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5987" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.timeContainer}>
            <Text style={styles.time}>{getCurrentTime()}</Text>
            <Text style={styles.title}>Groups</Text>
          </View>
          <TouchableOpacity 
            style={styles.createGroupButton}
            onPress={() => setCreateGroupModalVisible(true)}
          >
            <Text style={styles.createGroupIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'myGroups' && styles.activeTab]}
          onPress={() => setActiveTab('myGroups')}
        >
          <Text style={[styles.tabText, activeTab === 'myGroups' && styles.activeTabText]}>
            My Groups ({groups.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'invitations' && styles.activeTab]}
          onPress={() => setActiveTab('invitations')}
        >
          <Text style={[styles.tabText, activeTab === 'invitations' && styles.activeTabText]}>
            Invitations ({invitations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'myGroups' ? (
          groups.length > 0 ? (
            <FlatList
              data={groups}
              renderItem={renderGroupItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Groups Yet</Text>
              <Text style={styles.emptyStateText}>
                Create your first group to start sharing journals with friends
              </Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => setCreateGroupModalVisible(true)}
              >
                <Text style={styles.emptyStateButtonText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          invitations.length > 0 ? (
            <FlatList
              data={invitations}
              renderItem={renderInvitationItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Invitations</Text>
              <Text style={styles.emptyStateText}>
                You dont have any pending group invitations
              </Text>
            </View>
          )
        )}
      </View>

      {/* Create Group Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createGroupModalVisible}
        onRequestClose={() => setCreateGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Group</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setCreateGroupModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="Group Name"
              value={groupName}
              onChangeText={setGroupName}
              placeholderTextColor="#999"
            />

            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Group Description (Optional)"
              value={groupDescription}
              onChangeText={setGroupDescription}
              placeholderTextColor="#999"
              multiline={true}
              numberOfLines={3}
            />

            <Text style={styles.sectionTitle}>Add Members</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Search users by username"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />

            {searchLoading && (
              <ActivityIndicator size="small" color="#FF5987" style={styles.searchLoading} />
            )}

            <FlatList
              data={searchResults}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.searchResults}
              showsVerticalScrollIndicator={false}
            />

            {selectedUsers.length > 0 && (
              <View style={styles.selectedUsers}>
                <Text style={styles.selectedUsersTitle}>
                  Selected Members ({selectedUsers.length})
                </Text>
                <View style={styles.selectedUsersList}>
                  {selectedUsers.map(user => (
                    <View key={user.id} style={styles.selectedUserTag}>
                      <Text style={styles.selectedUserText}>{user.username}</Text>
                      <TouchableOpacity 
                        style={styles.removeUserButton}
                        onPress={() => toggleUserSelection(user)}
                      >
                        <Text style={styles.removeUserText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCreateGroupModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]}
                onPress={createGroup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.createButtonText}>Create Group</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Members Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addMembersModalVisible}
        onRequestClose={() => setAddMembersModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add Members to {selectedGroup?.name}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setAddMembersModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="Search users by username"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />

            {searchLoading && (
              <ActivityIndicator size="small" color="#FF5987" style={styles.searchLoading} />
            )}

            <FlatList
              data={searchResults}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.searchResults}
              showsVerticalScrollIndicator={false}
            />

            {selectedUsers.length > 0 && (
              <View style={styles.selectedUsers}>
                <Text style={styles.selectedUsersTitle}>
                  Selected Members ({selectedUsers.length})
                </Text>
                <View style={styles.selectedUsersList}>
                  {selectedUsers.map(user => (
                    <View key={user.id} style={styles.selectedUserTag}>
                      <Text style={styles.selectedUserText}>{user.username}</Text>
                      <TouchableOpacity 
                        style={styles.removeUserButton}
                        onPress={() => toggleUserSelection(user)}
                      >
                        <Text style={styles.removeUserText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAddMembersModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]}
                onPress={addMembersToGroup}
                disabled={loading || selectedUsers.length === 0}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.createButtonText}>Invite Members</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEEF3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    alignItems: 'flex-start',
  },
  time: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
    fontWeight: '400',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.5,
  },
  createGroupButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5987',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createGroupIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  // Group Item Styles
  groupItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  ownerBadge: {
    backgroundColor: '#FF5987',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownerText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  groupDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  membersSection: {
    marginBottom: 12,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  membersList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    position: 'relative',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  moreMembers: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMembersText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  addMembersButton: {
    backgroundColor: '#FF5987',
  },
  addMembersButtonText: {
    color: '#FFFFFF',
  },
  leaveButton: {
    backgroundColor: '#FF3B30',
  },
  leaveButtonText: {
    color: '#FFFFFF',
  },
  // Invitation Item Styles
  invitationItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  invitationHeader: {
    marginBottom: 12,
  },
  invitationGroupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  invitedBy: {
    fontSize: 14,
    color: '#666666',
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invitationButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F0F0F0',
  },
  invitationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  rejectButtonText: {
    color: '#666666',
  },
  // Empty State Styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: '#FF5987',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666666',
    fontWeight: '300',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F8F8F8',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  searchLoading: {
    marginVertical: 10,
  },
  searchResults: {
    maxHeight: 200,
    marginBottom: 16,
  },
  // User Item Styles
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userItemSelected: {
    backgroundColor: '#F8F8F8',
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
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
    color: '#666666',
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicatorSelected: {
    backgroundColor: '#FF5987',
    borderColor: '#FF5987',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Selected Users Styles
  selectedUsers: {
    marginBottom: 16,
  },
  selectedUsersTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  selectedUsersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedUserTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5987',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedUserText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  removeUserButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeUserText: {
    color: '#FF5987',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  createButton: {
    backgroundColor: '#FF5987',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  createButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default GroupsScreen;