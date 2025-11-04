 import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
  Animated,
  RefreshControl,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define TypeScript interfaces
interface Memory {
  id: number;
  title: string;
  time: string;
  image_url: string;
  date: string;
}

interface PartnerData {
  name: string;
  online: boolean;
  profilePhoto: string;
}

interface WeekDay {
  day: string;
  date: string;
  fullDate: Date;
  isToday: boolean;
}

// Define Theme colors (single theme now)
const colors = {
  primary: '#FF5987',
  background: '#FFEEF3',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  border: '#F0F0F0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF3B30',
};

const CalendarScreen = () => {
  const [currentWeek, setCurrentWeek] = useState<WeekDay[]>([]);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [recentMemories, setRecentMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  
  // Modal states
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [memoryTitle, setMemoryTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Settings options
  const [onlineStatus, setOnlineStatus] = useState(true);

  // Animation values
  const [slideAnim] = useState(new Animated.Value(300));

  // API endpoints - replace with your actual endpoints
  const API_ENDPOINTS = {
    partner: 'https://your-api-domain.com/api/partner',
    memories: 'https://your-api-domain.com/api/memories',
    uploadMemory: 'https://your-api-domain.com/api/memories/upload',
    updateOnlineStatus: 'https://your-api-domain.com/api/user/online-status',
  };

  // Get authentication token - replace with your actual token retrieval
  const getAuthToken = () => {
    // Replace with your actual token retrieval logic
    return 'YOUR_AUTH_TOKEN_HERE';
  };

  // Fetch partner data from API
  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.partner, {
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
      
      if (data.success && data.partner) {
        setPartnerData({
          name: data.partner.name,
          online: data.partner.is_online,
          profilePhoto: data.partner.profile_picture,
        });
      } else {
        setPartnerData(null);
      }
    } catch (error) {
      console.error('Error fetching partner data:', error);
      setPartnerData(null);
      Alert.alert('Error', 'Failed to load partner data');
    }
  };

  // Fetch recent memories from API
  const fetchRecentMemories = async () => {
    try {
      setMemoriesLoading(true);
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.memories, {
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
      
      if (data.success && data.memories) {
        setRecentMemories(data.memories);
      } else {
        setRecentMemories([]);
      }
    } catch (error) {
      console.error('Error fetching memories:', error);
      setRecentMemories([]);
      Alert.alert('Error', 'Failed to load recent memories');
    } finally {
      setMemoriesLoading(false);
    }
  };

  // Upload memory to API
  const uploadMemoryToAPI = async (memoryData: {
    title: string;
    date: string;
    image_url?: string;
  }) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.uploadMemory, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoryData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading memory:', error);
      throw error;
    }
  };

  // Update online status via API
  const updateOnlineStatusAPI = async (status: boolean) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.updateOnlineStatus, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ online: status }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating online status:', error);
      throw error;
    }
  };

  const getCurrentWeek = (): WeekDay[] => {
    const today = new Date();
    const currentDay = today.getDay();
    
    const monday = new Date(today);
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    monday.setDate(diff);
    
    const weekDays: WeekDay[] = [];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      
      weekDays.push({
        day: dayLabels[i],
        date: date.getDate().toString(),
        fullDate: date,
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    
    return weekDays;
  };

  useEffect(() => {
    setCurrentWeek(getCurrentWeek());
    
    // Fetch data from APIs
    const loadData = async () => {
      try {
        await Promise.all([
          fetchPartnerData(),
          fetchRecentMemories()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getCurrentTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleSearchPartner = () => {
    console.log('Navigate to search partner screen');
  };

  // Settings functions with animation
  const handleOpenSettings = () => {
    setSettingsModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseSettings = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSettingsModalVisible(false);
    });
  };

  const handleProfile = () => {
    handleCloseSettings();
    Alert.alert('Profile', 'Navigate to profile screen');
  };

  const handlePartnerPairing = () => {
    handleCloseSettings();
    Alert.alert('Partner Pairing', 'Navigate to partner pairing screen');
  };

  const handleOnlineStatusToggle = async () => {
    const newStatus = !onlineStatus;
    
    try {
      await updateOnlineStatusAPI(newStatus);
      setOnlineStatus(newStatus);
      Alert.alert('Success', `You are now ${newStatus ? 'online' : 'offline'}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update online status');
    }
  };

  const handleLogout = () => {
    handleCloseSettings();
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            console.log('User logged out');
          }
        }
      ]
    );
  };

  // Upload memory functions
  const handleOpenUploadModal = () => {
    setMemoryTitle('');
    setSelectedDate(new Date());
    setUploadModalVisible(true);
  };

  const handleCloseUploadModal = () => {
    setUploadModalVisible(false);
    setMemoryTitle('');
    setSelectedDate(new Date());
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleUploadMemory = async () => {
    if (!memoryTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for the memory');
      return;
    }

    setUploading(true);
    
    try {
      const memoryData = {
        title: memoryTitle,
        date: selectedDate.toISOString().split('T')[0],
      };

      const result = await uploadMemoryToAPI(memoryData);

      if (result.success) {
        await fetchRecentMemories();
        Alert.alert('Success', 'Memory uploaded successfully!');
        handleCloseUploadModal();
      } else {
        Alert.alert('Error', result.message || 'Failed to upload memory');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload memory. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Refresh data function
  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPartnerData(),
        fetchRecentMemories()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic styles based on colors
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 5,
    },
    time: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 2,
      fontWeight: '400',
    },
    title: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
      letterSpacing: -0.5,
    },
    calendarContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 25,
      marginBottom: 30,
      marginTop: 20,
      paddingTop: 5,
    },
    dayLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 12,
      fontWeight: '400',
      letterSpacing: -0.3,
    },
    dateCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    activeDateCircle: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dateText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      letterSpacing: -0.3,
    },
    activeDateText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    partnerSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 25,
      marginBottom: 30,
    },
    onlineText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 3,
      fontWeight: '400',
      letterSpacing: -0.3,
    },
    nameText: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      letterSpacing: -0.3,
    },
    noPartnerSection: {
      alignItems: 'center',
      paddingHorizontal: 25,
      marginBottom: 30,
      paddingVertical: 20,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginHorizontal: 25,
    },
    noPartnerText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 15,
      fontWeight: '400',
    },
    searchButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      letterSpacing: -0.3,
    },
    memoryItem: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    memoryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    memoryTime: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '400',
      letterSpacing: -0.3,
    },
    emptyMemoriesText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '400',
      marginBottom: 15,
    },
    addFirstMemoryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    floatingButton: {
      position: 'absolute',
      right: 25,
      bottom: 80,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalContent: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 16,
      backgroundColor: colors.background,
      color: colors.text,
    },
    datePickerButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      backgroundColor: colors.background,
    },
    datePickerText: {
      fontSize: 16,
      color: colors.text,
    },
    uploadImageButton: {
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      borderRadius: 8,
      padding: 20,
      alignItems: 'center',
      marginBottom: 24,
      backgroundColor: colors.background,
    },
    uploadImageText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    uploadButton: {
      backgroundColor: colors.primary,
    },
    cancelButtonText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    settingsModalContent: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: '80%',
      backgroundColor: colors.card,
      padding: 20,
      paddingTop: 50,
    },
    settingsTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
    },
    settingsOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 10,
      marginBottom: 10,
    },
    settingsOptionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    settingsOptionDescription: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    toggleActive: {
      backgroundColor: colors.primary,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header with Settings Icon */}
      <View style={dynamicStyles.header}>
        <View style={styles.headerContent}>
          <View style={styles.timeContainer}>
            <Text style={dynamicStyles.time}>{getCurrentTime()}</Text>
            <Text style={dynamicStyles.title}>Home</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={refreshData}
            >
              <Text style={[styles.refreshIcon, { color: colors.textSecondary }]}>🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={handleOpenSettings}
            >
              <Text style={[styles.settingsIcon, { color: colors.textSecondary }]}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Calendar Days */}
      <View style={dynamicStyles.calendarContainer}>
        {currentWeek.map((item: WeekDay, index: number) => (
          <View key={index} style={styles.dayContainer}>
            <Text style={dynamicStyles.dayLabel}>{item.day}</Text>
            <View style={[dynamicStyles.dateCircle, item.isToday && dynamicStyles.activeDateCircle]}>
              <Text style={[dynamicStyles.dateText, item.isToday && dynamicStyles.activeDateText]}>
                {item.date}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Partner Section */}
      {partnerData ? (
        <View style={dynamicStyles.partnerSection}>
          <View style={styles.profileContainer}>
            <Image 
              source={{ uri: partnerData.profilePhoto }} 
              style={styles.profileImage}
              onError={() => console.log('Error loading profile image')}
            />
            <View style={styles.statusIndicator}>
              <View style={[
                styles.statusDot, 
                partnerData.online ? styles.onlineDot : styles.offlineDot
              ]} />
            </View>
          </View>
          <View style={styles.partnerInfo}>
            <Text style={dynamicStyles.onlineText}>
              {partnerData.online ? 'Online' : 'Offline'}
            </Text>
            <Text style={dynamicStyles.nameText}>{partnerData.name}</Text>
          </View>
        </View>
      ) : (
        <View style={dynamicStyles.noPartnerSection}>
          <Text style={dynamicStyles.noPartnerText}>
            You dont have any partner currently
          </Text>
          <TouchableOpacity 
            style={dynamicStyles.searchButton}
            onPress={handleSearchPartner}
          >
            <Text style={styles.searchButtonText}>Search for your partner</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recent Memories Section */}
      <View style={styles.sectionHeader}>
        <Text style={dynamicStyles.sectionTitle}>Recent Memories</Text>
      </View>

      <ScrollView 
        style={styles.memoriesContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={memoriesLoading}
            onRefresh={fetchRecentMemories}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {recentMemories.length > 0 ? (
          recentMemories.map((memory: Memory) => (
            <View key={memory.id} style={dynamicStyles.memoryItem}>
              <Image 
                source={{ uri: memory.image_url }} 
                style={styles.memoryImage}
                onError={() => console.log('Error loading memory image')}
              />
              <View style={styles.memoryTextContainer}>
                <Text style={dynamicStyles.memoryTitle}>{memory.title}</Text>
                <Text style={dynamicStyles.memoryTime}>{memory.time}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyMemories}>
            <Text style={dynamicStyles.emptyMemoriesText}>No recent memories</Text>
            <TouchableOpacity 
              style={dynamicStyles.addFirstMemoryButton}
              onPress={handleOpenUploadModal}
            >
              <Text style={styles.addFirstMemoryText}>Add your first memory</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.emptySpace} />
      </ScrollView>

      {/* Floating Upload Button */}
      <TouchableOpacity 
        style={dynamicStyles.floatingButton}
        onPress={handleOpenUploadModal}
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      {/* Upload Memory Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={uploadModalVisible}
        onRequestClose={handleCloseUploadModal}
      >
        <View style={styles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>Upload New Memory</Text>
            
            <TextInput
              style={dynamicStyles.textInput}
              placeholder="Memory Title"
              value={memoryTitle}
              onChangeText={setMemoryTitle}
              placeholderTextColor={colors.textSecondary}
            />
            
            <TouchableOpacity 
              style={dynamicStyles.datePickerButton}
              onPress={showDatepicker}
            >
              <Text style={dynamicStyles.datePickerText}>
                {formatDate(selectedDate)}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
            
            <TouchableOpacity style={dynamicStyles.uploadImageButton}>
              <Text style={dynamicStyles.uploadImageText}>Select Image (Coming Soon)</Text>
            </TouchableOpacity>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, dynamicStyles.cancelButton]}
                onPress={handleCloseUploadModal}
                disabled={uploading}
              >
                <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, dynamicStyles.uploadButton]}
                onPress={handleUploadMemory}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.uploadButtonText}>Upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={settingsModalVisible}
        onRequestClose={handleCloseSettings}
      >
        <View style={styles.settingsModalOverlay}>
          <TouchableOpacity 
            style={styles.settingsModalOverlayArea}
            onPress={handleCloseSettings}
          />
          <Animated.View 
            style={[
              dynamicStyles.settingsModalContent,
              {
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            <View style={styles.settingsHeader}>
              <Text style={dynamicStyles.settingsTitle}>Settings</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleCloseSettings}
              >
                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>×</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.settingsOption} onPress={handleProfile}>
              <Text style={styles.settingsOptionIcon}>👤</Text>
              <View style={styles.settingsOptionTextContainer}>
                <Text style={dynamicStyles.settingsOptionTitle}>Profile</Text>
                <Text style={dynamicStyles.settingsOptionDescription}>Manage your profile information</Text>
              </View>
              <Text style={[styles.settingsArrow, { color: colors.textSecondary }]}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsOption} onPress={handlePartnerPairing}>
              <Text style={styles.settingsOptionIcon}>👥</Text>
              <View style={styles.settingsOptionTextContainer}>
                <Text style={dynamicStyles.settingsOptionTitle}>Partner Pairing</Text>
                <Text style={dynamicStyles.settingsOptionDescription}>Connect with your partner</Text>
              </View>
              <Text style={[styles.settingsArrow, { color: colors.textSecondary }]}>›</Text>
            </TouchableOpacity>

            <View style={styles.settingsOption}>
              <Text style={styles.settingsOptionIcon}>🌐</Text>
              <View style={styles.settingsOptionTextContainer}>
                <Text style={dynamicStyles.settingsOptionTitle}>Online Status</Text>
                <Text style={dynamicStyles.settingsOptionDescription}>
                  {onlineStatus ? 'You are currently online' : 'You are currently offline'}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.toggle, onlineStatus && dynamicStyles.toggleActive]}
                onPress={handleOnlineStatusToggle}
              >
                <View style={[styles.toggleCircle, onlineStatus && styles.toggleCircleActive]} />
              </TouchableOpacity>
            </View>

            <View style={[styles.settingsDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={[styles.settingsOption, styles.logoutOption]} onPress={handleLogout}>
              <Text style={[styles.settingsOptionIcon, styles.logoutIcon]}>🚪</Text>
              <View style={styles.settingsOptionTextContainer}>
                <Text style={[dynamicStyles.settingsOptionTitle, styles.logoutText]}>Logout</Text>
                <Text style={[dynamicStyles.settingsOptionDescription, styles.logoutText]}>
                  Sign out of your account
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    alignItems: 'flex-start',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 10,
  },
  refreshIcon: {
    fontSize: 20,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  profileContainer: {
    position: 'relative',
    marginRight: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  onlineDot: {
    backgroundColor: '#4CAF50',
  },
  offlineDot: {
    backgroundColor: '#9E9E9E',
  },
  partnerInfo: {
    flex: 1,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  memoriesContainer: {
    flex: 1,
    paddingHorizontal: 25,
  },
  memoryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#E0E0E0',
  },
  memoryTextContainer: {
    flex: 1,
  },
  emptyMemories: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  addFirstMemoryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySpace: {
    height: 30,
  },
  floatingButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  settingsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  settingsModalOverlayArea: {
    flex: 1,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 28,
    fontWeight: '300',
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  settingsOptionIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
  },
  settingsOptionTextContainer: {
    flex: 1,
  },
  settingsArrow: {
    fontSize: 20,
    fontWeight: '300',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  toggleCircleActive: {
    transform: [{ translateX: 22 }],
  },
  settingsDivider: {
    height: 1,
    marginVertical: 10,
  },
  logoutOption: {
    marginTop: 10,
  },
  logoutIcon: {
    color: '#FF3B30',
  },
  logoutText: {
    color: '#FF3B30',
  },
});

export default CalendarScreen;