 import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
// For Expo, use: import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  lastUpdated: string;
}

interface User {
  id: number;
  username: string;
  profilePhoto: string;
  online: boolean;
  location?: Location;
}

interface LocationSharingStatus {
  isSharing: boolean;
  startTime?: string;
  duration: number;
  timeRemaining: number;
}

const LocationSharingScreen = () => {
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [sharingStatus, setSharingStatus] = useState<LocationSharingStatus | null>(null);
  const [userLocation, setUserLocation] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [partnerLocation, setPartnerLocation] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [partner, setPartner] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  const mapRef = useRef<MapView>(null);
  const intervalRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const statusIntervalRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // API endpoints - Replace with your actual backend endpoints
  const API_ENDPOINTS = {
    locationStatus: 'https://your-api-domain.com/api/location/status',
    startSharing: 'https://your-api-domain.com/api/location/start',
    stopSharing: 'https://your-api-domain.com/api/location/stop',
    updateLocation: 'https://your-api-domain.com/api/location/update',
    partnerInfo: 'https://your-api-domain.com/api/partner/info',
  };

  // Get authentication token
  const getAuthToken = () => {
    // Replace with your actual token retrieval logic
    return 'YOUR_AUTH_TOKEN_HERE';
  };

  // Request location permission
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to share it with your partner.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Error requesting location permission:', err);
        return false;
      }
    } else {
      // iOS - permissions are handled through info.plist
      return true;
    }
  };

  // Get current device location with high accuracy
  const getCurrentLocation = (): Promise<Location> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!locationPermission) {
          const permissionGranted = await requestLocationPermission();
          if (!permissionGranted) {
            reject(new Error('Location permission denied'));
            return;
          }
          setLocationPermission(true);
        }

        Geolocation.getCurrentPosition(
          (position) => {
            const locationData: Location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
               
              lastUpdated: new Date().toISOString(),
            };
            
            setCurrentLocation(locationData);
            resolve(locationData);
          },
          (error) => {
            console.error('Error getting location:', error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
            distanceFilter: 1, // Minimum distance in meters to trigger updates
          }
        );
      } catch (error) {
        console.error('Error in getCurrentLocation:', error);
        reject(error);
      }
    });
  };

  // Start watching location updates
  const startWatchingLocation = () => {
    if (!locationPermission) return;

    try {
      watchIdRef.current = Geolocation.watchPosition(
        (position) => {
          const locationData: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            
            lastUpdated: new Date().toISOString(),
          };

          setCurrentLocation(locationData);
          setUserLocation(prev => ({
            ...prev,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          }));

          // Update location in backend if sharing is active
          if (isSharing) {
            updateUserLocationAPI(locationData);
          }
        },
        (error) => {
          console.error('Error watching location:', error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 5, // Update every 5 meters
          interval: 5000, // Update every 5 seconds
          fastestInterval: 2000, // Fastest update interval
        }
      );
    } catch (error) {
      console.error('Error starting location watch:', error);
    }
  };

  // Stop watching location updates
  const stopWatchingLocation = () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Fetch location sharing status
  const fetchLocationStatus = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.locationStatus, {
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
        setIsSharing(data.status.isSharing);
        setSharingStatus(data.status);
        
        // Update locations if available
        if (data.userLocation) {
          setUserLocation(prev => ({
            ...prev,
            latitude: data.userLocation.latitude,
            longitude: data.userLocation.longitude,
          }));
        }
        
        if (data.partnerLocation) {
          setPartnerLocation(prev => ({
            ...prev,
            latitude: data.partnerLocation.latitude,
            longitude: data.partnerLocation.longitude,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching location status:', error);
      // Fallback to mock data
      initializeMockData();
    }
  };

  // Fetch partner information
  const fetchPartnerInfo = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.partnerInfo, {
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
        setPartner(data.partner);
      }
    } catch (error) {
      console.error('Error fetching partner info:', error);
      // Fallback to mock partner data
      setPartner({
        id: 2,
        username: 'Alex',
        profilePhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        online: true,
        location: {
          latitude: partnerLocation.latitude,
          longitude: partnerLocation.longitude,
          lastUpdated: new Date().toISOString(),
        },
      });
    }
  };

  // Start location sharing
  const startLocationSharingAPI = async (duration: number) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.startSharing, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          duration,
          initialLocation: currentLocation 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error starting location sharing:', error);
      throw error;
    }
  };

  // Stop location sharing
  const stopLocationSharingAPI = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.stopSharing, {
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
      return data;
    } catch (error) {
      console.error('Error stopping location sharing:', error);
      throw error;
    }
  };

  // Update user location
  const updateUserLocationAPI = async (location: Location) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.updateLocation, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(location),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  };

  // Initialize mock data for fallback
  const initializeMockData = () => {
    setCurrentUser({
      id: 1,
      username: 'You',
      profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      online: true,
      location: currentLocation || {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        lastUpdated: new Date().toISOString(),
      },
    });

    setPartner({
      id: 2,
      username: 'Alex',
      profilePhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      online: true,
      location: {
        latitude: partnerLocation.latitude,
        longitude: partnerLocation.longitude,
        lastUpdated: new Date().toISOString(),
      },
    });
  };

  // Start location sharing
  const startLocationSharing = async (duration: number) => {
    setLoading(true);
    
    try {
      // Get current exact location
      const location = await getCurrentLocation();
      
      // Update local state with exact coordinates
      setUserLocation(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }));

      // Send to API
      const result = await startLocationSharingAPI(duration);
      
      if (result.success) {
        setIsSharing(true);
        setSharingStatus({
          isSharing: true,
          startTime: new Date().toISOString(),
          duration,
          timeRemaining: duration * 60, // Convert to seconds
        });
        setDurationModalVisible(false);
        
        // Start continuous location updates
        startWatchingLocation();
        
        Alert.alert('Success', `Location sharing started for ${duration} minutes`);
      } else {
        Alert.alert('Error', result.message || 'Failed to start location sharing');
      }
    } catch (error) {
      console.error('Error starting location sharing:', error);
      Alert.alert(
        'Location Error', 
        'Failed to get your exact location. Please check your location settings and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Stop location sharing
  const stopLocationSharing = () => {
    Alert.alert(
      'Stop Sharing',
      'Are you sure you want to stop sharing your location?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Stop Sharing', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await stopLocationSharingAPI();
              
              if (result.success) {
                setIsSharing(false);
                setSharingStatus(null);
                
                // Stop continuous location updates
                stopWatchingLocation();
                
                // Clear intervals
                cleanupIntervals();
                
                Alert.alert('Success', 'Location sharing stopped');
              } else {
                Alert.alert('Error', result.message || 'Failed to stop location sharing');
              }
            } catch (error) {
              console.error('Error stopping location sharing:', error);
              Alert.alert('Error', 'Failed to stop location sharing');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getCurrentTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatLastUpdated = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const durationOptions = [15, 30, 60, 120, 240];

  // Cleanup intervals on unmount
  const cleanupIntervals = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
    stopWatchingLocation();
  };

  // Get initial location and setup
  const initializeLocation = async () => {
    try {
      const permissionGranted = await requestLocationPermission();
      setLocationPermission(permissionGranted);
      
      if (permissionGranted) {
        const location = await getCurrentLocation();
        setUserLocation(prev => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude,
        }));
      }
    } catch (error) {
      console.error('Error initializing location:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await initializeLocation();
        await Promise.all([
          fetchLocationStatus(),
          fetchPartnerInfo()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        initializeMockData();
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    return cleanupIntervals;
  }, []);

  // Set up status refresh interval when sharing
  useEffect(() => {
    cleanupIntervals();
    
    if (isSharing) {
      // Set up status refresh (every 60 seconds)
      statusIntervalRef.current = setInterval(fetchLocationStatus, 60000) as unknown as number;
    }

    return cleanupIntervals;
  }, [isSharing]);

  // Set up time remaining countdown
  useEffect(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    if (sharingStatus && sharingStatus.isSharing) {
      countdownRef.current = setInterval(() => {
        setSharingStatus(prev => {
          if (!prev) return null;
          
          const newTimeRemaining = prev.timeRemaining - 1;
          if (newTimeRemaining <= 0) {
            // Auto-stop sharing when time expires
            setIsSharing(false);
            stopWatchingLocation();
            cleanupIntervals();
            Alert.alert('Location Sharing Ended', 'Your location sharing duration has expired.');
            return null;
          }
          
          return {
            ...prev,
            timeRemaining: newTimeRemaining,
          };
        });
      }, 1000) as unknown as number;
    }
    
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [sharingStatus]);

  // Add accuracy indicator to marker
  const renderAccuracyCircle = (accuracy: number) => {
    if (!accuracy || accuracy > 100) return null;
    
    return (
      <View
        style={[
          styles.accuracyCircle,
          {
            width: accuracy * 2,
            height: accuracy * 2,
            borderRadius: accuracy,
          },
        ]}
      />
    );
  };

  // Rest of the component remains the same...
  // [The rest of your JSX and styles remain unchanged]

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.timeContainer}>
            <Text style={styles.time}>{getCurrentTime()}</Text>
            <Text style={styles.title}>Location Sharing</Text>
          </View>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => Alert.alert('Location Sharing', 'Share your real-time location with your partner. Your location will be updated automatically while sharing is active.')}
          >
            <Text style={styles.infoIcon}>i</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={userLocation}
          region={userLocation}
          showsUserLocation={false} // We're using custom markers
          showsMyLocationButton={false}
        >
          {/* User Marker */}
          <Marker coordinate={userLocation} title="You">
            <View style={styles.markerContainer}>
              {currentLocation?.accuracy && renderAccuracyCircle(currentLocation.accuracy)}
              <View style={[styles.marker, isSharing ? styles.markerSharing : styles.markerNotSharing]}>
                <Image 
                  source={{ uri: currentUser?.profilePhoto }} 
                  style={styles.markerImage}
                />
              </View>
              {isSharing && <View style={styles.sharingDot} />}
              {updatingLocation && <View style={styles.updatingIndicator} />}
            </View>
          </Marker>

          {/* Partner Marker */}
          {partner && (
            <Marker coordinate={partnerLocation} title={partner.username}>
              <View style={styles.markerContainer}>
                <View style={[styles.marker, styles.partnerMarker]}>
                  <Image 
                    source={{ uri: partner.profilePhoto }} 
                    style={styles.markerImage}
                  />
                </View>
                <View style={styles.partnerDot} />
              </View>
            </Marker>
          )}

          {/* Connection Line */}
          {isSharing && partner && (
            <Polyline
              coordinates={[userLocation, partnerLocation]}
              strokeColor="#FF5987"
              strokeWidth={2}
              strokeColors={['#FF5987']}
            />
          )}
        </MapView>

        {/* Controls Overlay */}
        <View style={styles.overlay}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Location Status</Text>
            
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.dot, isSharing ? styles.greenDot : styles.grayDot]} />
                  <Text style={styles.statusText}>You: {isSharing ? 'Sharing' : 'Not Sharing'}</Text>
                  {updatingLocation && <ActivityIndicator size="small" color="#FF5987" style={styles.updatingSpinner} />}
                </View>
                {currentLocation && (
                  <Text style={styles.timeText}>
                    Accuracy: ±{currentLocation.accuracy?.toFixed(0)}m
                  </Text>
                )}
                {currentUser?.location && (
                  <Text style={styles.timeText}>
                    Updated: {formatLastUpdated(currentUser.location.lastUpdated)}
                  </Text>
                )}
              </View>
              
              {partner && (
                <View style={styles.statusItem}>
                  <View style={styles.statusIndicator}>
                    <View style={[styles.dot, partner.online ? styles.greenDot : styles.grayDot]} />
                    <Text style={styles.statusText}>{partner.username}: {partner.online ? 'Online' : 'Offline'}</Text>
                  </View>
                  {partner.location && (
                    <Text style={styles.timeText}>
                      Updated: {formatLastUpdated(partner.location.lastUpdated)}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {isSharing && sharingStatus && (
              <View style={styles.timeInfo}>
                <Text style={styles.timeText}>
                  Time remaining: <Text style={styles.timeHighlight}>{formatTimeRemaining(sharingStatus.timeRemaining)}</Text>
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {!isSharing ? (
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => setDurationModalVisible(true)}
              >
                <Text style={styles.primaryButtonText}>Share My Location</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.stopButton}
                onPress={stopLocationSharing}
              >
                <Text style={styles.stopButtonText}>Stop Sharing</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => {
                if (partner) {
                  mapRef.current?.fitToCoordinates([userLocation, partnerLocation], {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                  });
                } else {
                  mapRef.current?.animateToRegion(userLocation);
                }
              }}
            >
              <Text style={styles.secondaryButtonText}>
                {partner ? 'Show Both' : 'Show My Location'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Duration Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={durationModalVisible}
        onRequestClose={() => setDurationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Location</Text>
            <Text style={styles.modalSubtitle}>
              How long to share with {partner?.username || 'your partner'}?
            </Text>

            <View style={styles.durationContainer}>
              {durationOptions.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationButton,
                    selectedDuration === duration && styles.durationButtonSelected
                  ]}
                  onPress={() => setSelectedDuration(duration)}
                >
                  <Text style={[
                    styles.durationButtonText,
                    selectedDuration === duration && styles.durationButtonTextSelected
                  ]}>
                    {duration < 60 ? `${duration}m` : `${duration / 60}h`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setDurationModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => startLocationSharing(selectedDuration)}
              >
                <Text style={styles.confirmButtonText}>Start Sharing</Text>
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
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 16,
    color: '#666666',
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    justifyContent: 'space-between',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  greenDot: {
    backgroundColor: '#4CAF50',
  },
  grayDot: {
    backgroundColor: '#666666',
  },
  statusText: {
    fontSize: 14,
    color: '#666666',
  },
  timeText: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 16,
  },
  timeInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  timeHighlight: {
    color: '#FF5987',
    fontWeight: '600',
  },
  updatingSpinner: {
    marginLeft: 8,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF5987',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  // Marker Styles
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  marker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  markerSharing: {
    borderColor: '#4CAF50',
    backgroundColor: '#FFFFFF',
  },
  markerNotSharing: {
    borderColor: '#666666',
    backgroundColor: '#FFFFFF',
  },
  partnerMarker: {
    borderColor: '#4A90E2',
    backgroundColor: '#FFFFFF',
  },
  markerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  sharingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginTop: 4,
    zIndex: 2,
  },
  partnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
    marginTop: 4,
  },
  updatingIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF5987',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 3,
  },
  accuracyCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    zIndex: 1,
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
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  durationButton: {
    width: '30%',
    paddingVertical: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  durationButtonSelected: {
    backgroundColor: '#FF5987',
  },
  durationButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  durationButtonTextSelected: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#FF5987',
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default LocationSharingScreen;