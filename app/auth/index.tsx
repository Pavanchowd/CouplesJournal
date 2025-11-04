 import React, { useState } from 'react';
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
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
 import { SafeAreaView } from 'react-native-safe-area-context';
const AuthScreen = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form State
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  // Register Form State
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    relationStatus: '',
    email: '',
    phone: '',
    dob: new Date(),
    profilePhoto: null as string | null,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Relation Status Options
  const relationStatusOptions = [
    'Single',
    'In a relationship',
    'Engaged',
    'Married',
    'Complicated',
    'Separated',
    'Divorced',
    'Widowed'
  ];

  // Handle Login Input Change
  const handleLoginChange = (field: string, value: string) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle Register Input Change
  const handleRegisterChange = (field: string, value: any) => {
    setRegisterData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle Date of Birth Change
  const onDobChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      handleRegisterChange('dob', selectedDate);
    }
  };

  // Handle Profile Photo Selection - Simple implementation
  const handleSelectProfilePhoto = () => {
    // For now, we'll use a placeholder or you can implement a simple image picker
    // In a real app, you would use a proper image picker library
    Alert.alert(
      'Profile Photo',
      'In a complete implementation, this would open an image picker. The selected image would then be uploaded to your Multer backend.',
      [
        { text: 'OK', onPress: () => {
          // For demo purposes, set a placeholder image
          handleRegisterChange('profilePhoto', 'https://via.placeholder.com/100');
        }},
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Format Date for Display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle Login
  const handleLogin = async () => {
    if (!loginData.username || !loginData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // API call to your backend
      const response = await fetch('http://your-backend-url/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Login successful!');
       
      } else {
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async () => {
    const { firstName, lastName, username, relationStatus, email, phone, dob } = registerData;
    
    if (!firstName || !lastName || !username || !relationStatus || !email || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Create FormData for file upload with Multer
      const formData = new FormData();
      
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('username', username);
      formData.append('relationStatus', relationStatus);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('dob', dob.toISOString());

      

      // API call to your Multer backend
      const response = await fetch('http://your-backend-url/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Registration successful!');
        
      } else {
        Alert.alert('Error', data.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Email validation
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Reset forms when switching tabs
  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    if (tab === 'login') {
      setLoginData({ username: '', password: '' });
    } else {
      setRegisterData({
        firstName: '',
        lastName: '',
        username: '',
        relationStatus: '',
        email: '',
        phone: '',
        dob: new Date(),
        profilePhoto: null,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Together</Text>
        <Text style={styles.subtitle}>Share your moments together</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'login' && styles.activeTab]}
          onPress={() => switchTab('login')}
        >
          <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'register' && styles.activeTab]}
          onPress={() => switchTab('register')}
        >
          <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
            Register
          </Text>
        </TouchableOpacity>
      </View>

      {/* Forms */}
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'login' ? (
          // Login Form
          <View style={styles.form}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={loginData.username}
              onChangeText={(value) => handleLoginChange('username', value)}
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={loginData.password}
              onChangeText={(value) => handleLoginChange('password', value)}
              placeholderTextColor="#999"
              secureTextEntry
            />
            
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.forgotPasswordButton}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Register Form
          <View style={styles.form}>
            <Text style={styles.formTitle}>Create Account</Text>
            
            {/* Profile Photo */}
            <TouchableOpacity 
              style={styles.profilePhotoContainer}
              onPress={handleSelectProfilePhoto}
            >
              {registerData.profilePhoto ? (
                <Image 
                  source={{ uri: registerData.profilePhoto }} 
                  style={styles.profilePhoto}
                />
              ) : (
                <View style={styles.profilePhotoPlaceholder}>
                  <Text style={styles.profilePhotoText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Name Fields */}
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="First Name"
                value={registerData.firstName}
                onChangeText={(value) => handleRegisterChange('firstName', value)}
                placeholderTextColor="#999"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Last Name"
                value={registerData.lastName}
                onChangeText={(value) => handleRegisterChange('lastName', value)}
                placeholderTextColor="#999"
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Username (unique)"
              value={registerData.username}
              onChangeText={(value) => handleRegisterChange('username', value)}
              placeholderTextColor="#999"
              autoCapitalize="none"
            />

            {/* Relation Status Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Relation Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.relationOptions}>
                  {relationStatusOptions.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.relationOption,
                        registerData.relationStatus === status && styles.relationOptionSelected
                      ]}
                      onPress={() => handleRegisterChange('relationStatus', status)}
                    >
                      <Text style={[
                        styles.relationOptionText,
                        registerData.relationStatus === status && styles.relationOptionTextSelected
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={registerData.email}
              onChangeText={(value) => handleRegisterChange('email', value)}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={registerData.phone}
              onChangeText={(value) => handleRegisterChange('phone', value)}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />

            {/* Date of Birth */}
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerText}>
                {formatDate(registerData.dob)}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={registerData.dob}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDobChange}
                maximumDate={new Date()}
              />
            )}

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.bottomSpace} />
      </ScrollView>
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
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 30,
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
    backgroundColor: '#FF5987',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 25,
  },
  form: {
    width: '100%',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F8F8F8',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  profilePhotoText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  relationOptions: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  relationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  relationOptionSelected: {
    backgroundColor: '#FF5987',
    borderColor: '#FF5987',
  },
  relationOptionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  relationOptionTextSelected: {
    color: '#FFFFFF',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F8F8F8',
  },
  datePickerText: {
    fontSize: 16,
    color: '#000000',
  },
  submitButton: {
    backgroundColor: '#FF5987',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#666666',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomSpace: {
    height: 30,
  },
});

export default AuthScreen;