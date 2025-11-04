 import React, { useState, useEffect, JSX } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';

// Define types for our data structures
type Reaction = {
  emoji: string;
};

type JournalEntry = {
  id: number;
  date: string;
  title: string;
  content: string;
  reaction: Reaction | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};

// API Configuration
const API_ENDPOINTS = {
  journalEntries: 'https://your-api-domain.com/api/journal-entries',
  journalEntryById: (id: number) => `https://your-api-domain.com/api/journal-entries/${id}`,
  journalEntryReaction: (id: number) => `https://your-api-domain.com/api/journal-entries/${id}/reaction`,
  upload: 'https://your-api-domain.com/api/upload',
};

// API Service with real endpoints
class JournalApiService {
  private static instance: JournalApiService;

  static getInstance(): JournalApiService {
    if (!JournalApiService.instance) {
      JournalApiService.instance = new JournalApiService();
    }
    return JournalApiService.instance;
  }

  private async makeRequest(url: string, options: RequestInit = {}) {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // GET all journal entries
  async getEntries(): Promise<JournalEntry[]> {
    return this.makeRequest(API_ENDPOINTS.journalEntries);
  }

  // GET single journal entry by ID
  async getEntryById(id: number): Promise<JournalEntry> {
    return this.makeRequest(API_ENDPOINTS.journalEntryById(id));
  }

  // POST create new journal entry
  async createEntry(entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    return this.makeRequest(API_ENDPOINTS.journalEntries, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  // PUT update journal entry
  async updateEntry(id: number, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    return this.makeRequest(API_ENDPOINTS.journalEntryById(id), {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // DELETE journal entry
  async deleteEntry(id: number): Promise<{ success: boolean }> {
    return this.makeRequest(API_ENDPOINTS.journalEntryById(id), {
      method: 'DELETE',
    });
  }

  // PATCH update reaction only
  async updateReaction(id: number, reaction: Reaction | null): Promise<JournalEntry> {
    return this.makeRequest(API_ENDPOINTS.journalEntryReaction(id), {
      method: 'PATCH',
      body: JSON.stringify({ reaction }),
    });
  }

  // Upload image and get URL
  async uploadImage(imageUri: string): Promise<{ url: string }> {
    const formData = new FormData();
    
    // @ts-ignore - React Native FormData append
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'journal-image.jpg',
    });

    return this.makeRequest(API_ENDPOINTS.upload, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }
}

// Fallback Mock Service for development
class MockJournalApiService {
  private entries: JournalEntry[] = [
    {
      id: 1,
      date: '10 November 2025',
      title: 'A coffee day with you',
      content: 'We have a very good day on that time we spend our beautiful day in the mountains and we have the sip of coffee together feeling the winds and the clouds.',
      reaction: { emoji: '❤️' },
      image: null,
      createdAt: '2025-11-10T10:00:00Z',
      updatedAt: '2025-11-10T10:00:00Z'
    },
    {
      id: 2,
      date: '15 August 2024',
      title: 'Movie Night',
      content: 'This day is the most memorable thing ever in my life. Watching a movie night with you. U watched the movie but I watched you. coz u re beautiful.',
      reaction: null,
      image: null,
      createdAt: '2024-08-15T20:00:00Z',
      updatedAt: '2024-08-15T20:00:00Z'
    }
  ];
  private nextId = 3;

  // Simulate API delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getEntries(): Promise<JournalEntry[]> {
    await this.delay(500);
    return [...this.entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getEntryById(id: number): Promise<JournalEntry> {
    await this.delay(300);
    const entry = this.entries.find(entry => entry.id === id);
    if (!entry) throw new Error('Entry not found');
    return entry;
  }

  async createEntry(entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    await this.delay(800);
    const newEntry: JournalEntry = {
      ...entryData,
      id: this.nextId++,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.entries.push(newEntry);
    return newEntry;
  }

  async updateEntry(id: number, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    await this.delay(600);
    const index = this.entries.findIndex(entry => entry.id === id);
    if (index === -1) throw new Error('Entry not found');

    this.entries[index] = {
      ...this.entries[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.entries[index];
  }

  async deleteEntry(id: number): Promise<{ success: boolean }> {
    await this.delay(400);
    const index = this.entries.findIndex(entry => entry.id === id);
    if (index === -1) return { success: false };

    this.entries.splice(index, 1);
    return { success: true };
  }

  async updateReaction(id: number, reaction: Reaction | null): Promise<JournalEntry> {
    return this.updateEntry(id, { reaction });
  }

  async uploadImage(imageUri: string): Promise<{ url: string }> {
    await this.delay(1000);
    // In mock, we just return the local URI
    return { url: imageUri };
  }
}

// Choose between real API and mock service
const useRealAPI = false; // Set to true when you have a real API
const apiService = useRealAPI ? JournalApiService.getInstance() : new MockJournalApiService();

const JournalScreen = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newEntryModalVisible, setNewEntryModalVisible] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [reactionModalVisible, setReactionModalVisible] = useState<boolean>(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // Available emojis for reactions
  const availableEmojis: string[] = ['❤️', '😂', '😊', '😢', '😮', '👍', '👏', '🔥', '⭐', '🎉'];

  // Load journal entries on component mount
  useEffect(() => {
    loadJournalEntries();
  }, []);

  const loadJournalEntries = async (): Promise<void> => {
    try {
      setLoading(true);
      const entries = await apiService.getEntries();
      setJournalEntries(entries);
    } catch (error) {
      Alert.alert('Error', 'Failed to load journal entries');
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current time for header
  const getCurrentTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
  };
 
  const getCurrentDate = (): string => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleImagePick = async (): Promise<void> => {
    try {
      const options = {
        mediaType: 'photo' as const,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      };

      const response = await launchImageLibrary(options);
      
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Error', 'Failed to pick image');
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets[0].uri) {
        setUploadingImage(true);
        
        // Upload image to server
        const uploadResult = await apiService.uploadImage(response.assets[0].uri);
        setNewImage(uploadResult.url);
        
        setUploadingImage(false);
      }
    } catch (error) {
      setUploadingImage(false);
      Alert.alert('Error', 'Failed to upload image');
      console.error('Error uploading image:', error);
    }
  };

  const handleRemoveImage = (): void => {
    setNewImage(null);
  };

  const handleCreateNewEntry = async (): Promise<void> => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    try {
      const newEntryData = {
        date: getCurrentDate(),
        title: newTitle.trim(),
        content: newContent.trim(),
        reaction: null,
        image: newImage
      };

      await apiService.createEntry(newEntryData);
      
      setNewTitle('');
      setNewContent('');
      setNewImage(null);
      setNewEntryModalVisible(false);
      
      // Reload entries to get the latest data
      await loadJournalEntries();
      
      Alert.alert('Success', 'Journal entry created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create journal entry');
      console.error('Error creating entry:', error);
    }
  };

  const handleOpenNewEntryModal = (): void => {
    setNewTitle('');
    setNewContent('');
    setNewImage(null);
    setNewEntryModalVisible(true);
  };

  const handleCloseModal = (): void => {
    setNewEntryModalVisible(false);
    setNewTitle('');
    setNewContent('');
    setNewImage(null);
  };

  const handleOpenReactionModal = (entryId: number): void => {
    setSelectedEntryId(entryId);
    setReactionModalVisible(true);
  };

  const handleAddReaction = async (emoji: string): Promise<void> => {
    if (!selectedEntryId) return;

    try {
      const currentEntry = journalEntries.find(entry => entry.id === selectedEntryId);
      if (!currentEntry) return;

      // If clicking the same emoji, remove the reaction (toggle)
      const newReaction = currentEntry.reaction?.emoji === emoji ? null : { emoji };
      
      await apiService.updateReaction(selectedEntryId, newReaction);
      
      // Update local state optimistically
      setJournalEntries(prev => 
        prev.map(entry => {
          if (entry.id === selectedEntryId) {
            return { ...entry, reaction: newReaction };
          }
          return entry;
        })
      );

      setReactionModalVisible(false);
      setSelectedEntryId(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update reaction');
      console.error('Error updating reaction:', error);
    }
  };

  const handleRemoveReaction = async (entryId: number): Promise<void> => {
    try {
      await apiService.updateReaction(entryId, null);
      
      // Update local state optimistically
      setJournalEntries(prev => 
        prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, reaction: null }
            : entry
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to remove reaction');
      console.error('Error removing reaction:', error);
    }
  };

  const handleDeleteEntry = async (entryId: number): Promise<void> => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await apiService.deleteEntry(entryId);
              if (result.success) {
                // Update local state optimistically
                setJournalEntries(prev => prev.filter(entry => entry.id !== entryId));
                Alert.alert('Success', 'Journal entry deleted successfully!');
              } else {
                Alert.alert('Error', 'Failed to delete journal entry');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete journal entry');
              console.error('Error deleting entry:', error);
            }
          }
        }
      ]
    );
  };

  const renderJournalEntries = (): JSX.Element => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5987" />
          <Text style={styles.loadingText}>Loading your memories...</Text>
        </View>
      );
    }

    if (journalEntries.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Journal Entries Yet</Text>
          <Text style={styles.emptyStateText}>
            Start writing your first journal entry to capture your thoughts and memories.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.entriesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.entriesContent}
      >
        {journalEntries.map((entry: JournalEntry) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryDate}>{entry.date}</Text>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteEntry(entry.id)}
              >
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.entryTitle}>{entry.title}</Text>
            
            {/* Display image if exists */}
            {entry.image && (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: entry.image }} 
                  style={styles.entryImage}
                  resizeMode="cover"
                />
              </View>
            )}
            
            <Text style={styles.entryContent}>{entry.content}</Text>
            
            {/* Reaction Display */}
            <View style={styles.reactionSection}>
              {entry.reaction ? (
                <TouchableOpacity 
                  style={styles.reactionBubble}
                  onPress={() => handleRemoveReaction(entry.id)}
                >
                  <Text style={styles.reactionEmoji}>{entry.reaction.emoji}</Text>
                  <Text style={styles.removeText}>Tap to remove</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.addReactionButton}
                  onPress={() => handleOpenReactionModal(entry.id)}
                >
                  <Text style={styles.addReactionText}>+ Add Reaction</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        <View style={styles.bottomSpace} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Main Journal List View */}
      {!newEntryModalVisible && (
        <>
          <View style={styles.header}>
            <Text style={styles.time}>{getCurrentTime()}</Text>
            <Text style={styles.title}>Journal</Text>
          </View>
   
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>
              Describe whatever in your mind
            </Text>
          </View>
   
          <TouchableOpacity 
            style={styles.writeButton}
            onPress={handleOpenNewEntryModal}
          >
            <Text style={styles.writeButtonText}>Write a New one</Text>
          </TouchableOpacity>

          {renderJournalEntries()}
        </>
      )}

      {/* Full Screen New Entry Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={newEntryModalVisible}
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.fullScreenModal}>
          <KeyboardAvoidingView 
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={handleCloseModal}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>New Journal Entry</Text>
              
              <TouchableOpacity 
                onPress={handleCreateNewEntry}
                style={styles.saveButtonHeader}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.fullScreenContent}>
              {/* Image Upload Section */}
              <View style={styles.imageUploadSection}>
                <Text style={styles.imageUploadTitle}>Add Photo (Optional)</Text>
                {uploadingImage ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color="#FF5987" />
                    <Text style={styles.uploadingText}>Uploading image...</Text>
                  </View>
                ) : newImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={{ uri: newImage }} 
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={handleRemoveImage}
                    >
                      <Text style={styles.removeImageText}>Remove Image</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.uploadImageButton}
                    onPress={handleImagePick}
                  >
                    <Text style={styles.uploadImageText}>+ Upload Image</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.fullScreenTitleInput}
                placeholder="Title"
                value={newTitle}
                onChangeText={setNewTitle}
                placeholderTextColor="#999"
                maxLength={50}
              />
 
              <TextInput
                style={styles.fullScreenContentInput}
                placeholder="Describe your thoughts..."
                value={newContent}
                onChangeText={setNewContent}
                placeholderTextColor="#999"
                multiline={true}
                textAlignVertical="top"
              />
 
              <Text style={styles.charCount}>
                {newContent.length} characters
              </Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Emoji Reaction Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={reactionModalVisible}
        onRequestClose={() => setReactionModalVisible(false)}
      >
        <View style={styles.reactionModalOverlay}>
          <View style={styles.reactionModalContent}>
            <Text style={styles.reactionModalTitle}>Choose a Reaction</Text>
            <Text style={styles.reactionModalSubtitle}>You can only add one reaction per entry</Text>
            
            <View style={styles.emojiGrid}>
              {availableEmojis.map((emoji: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emojiButton}
                  onPress={() => handleAddReaction(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.cancelReactionButton}
              onPress={() => setReactionModalVisible(false)}
            >
              <Text style={styles.cancelReactionText}>Cancel</Text>
            </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
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
  descriptionSection: {
    paddingHorizontal: 25,
    marginTop: 30,
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  writeButton: {
    backgroundColor: '#FF5987',
    marginHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  writeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
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
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  entriesContainer: {
    flex: 1,
  },
  entriesContent: {
    paddingHorizontal: 25,
    paddingBottom: 20,
  },
  entryCard: {
    backgroundColor: '#F8F8F8',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    letterSpacing: -0.3,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 10,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#FF5987',
    fontWeight: 'bold',
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  entryContent: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  // Image Styles
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  entryImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  imageUploadSection: {
    marginBottom: 20,
  },
  imageUploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  uploadImageButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  uploadImageText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  uploadingContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  uploadingText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  removeImageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FF5987',
    borderRadius: 6,
  },
  removeImageText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bottomSpace: {
    height: 20,
  },
  // Reaction Section Styles
  reactionSection: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  addReactionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addReactionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  removeText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  // Full Screen Modal Styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  saveButtonHeader: {
    padding: 5,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FF5987',
    fontWeight: '600',
  },
  fullScreenContent: {
    flex: 1,
    padding: 20,
  },
  fullScreenTitleInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
    padding: 0,
  },
  fullScreenContentInput: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    minHeight: 200,
    padding: 0,
    marginBottom: 20,
  },
  charCount: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
  // Reaction Modal Styles
  reactionModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  reactionModalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  reactionModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
  },
  reactionModalSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emojiButton: {
    padding: 12,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
  },
  emojiText: {
    fontSize: 24,
  },
  cancelReactionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelReactionText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default JournalScreen;