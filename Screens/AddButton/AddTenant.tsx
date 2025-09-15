import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  StatusBar,
  SafeAreaView,
  KeyboardTypeOptions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { ReactNode } from 'react';

type FormData = {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationalId: string;
  currentAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: string;
  securityDeposit: string;
  propertyUnit: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
};

const AddTenantScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<FormData>({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationalId: '',
    
    // Address Information
    currentAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    
    // Lease Information
    leaseStartDate: '',
    leaseEndDate: '',
    monthlyRent: '',
    securityDeposit: '',
    propertyUnit: '',
    
    // Emergency Contact
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleInputChange = <K extends keyof FormData>(field: K, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const takePicture = async () => {
    // Check and request camera permission
    if (!permission?.granted) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    // Request media library permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery access permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you would like to add a photo',
      [
        { text: 'Camera', onPress: takePicture },
        { text: 'Gallery', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = () => {
    // Validate required fields
    const requiredFields: (keyof FormData)[] = ["name", "email", "phone"];
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    // Handle form submission
    Alert.alert('Success', 'Tenant added successfully!', [
      { 
        text: 'OK', 
        onPress: () => {
          console.log('Tenant data:', formData);
          // Navigate back to previous screen
          navigation.goBack();
        }
      }
    ]);
  };

  const renderInputField = (
    placeholder: string,
    field: keyof FormData,
    keyboardType: KeyboardTypeOptions = 'default',
    multiline: boolean = false
  ) => (
    <TextInput
      style={[styles.input, multiline && styles.multilineInput]}
      placeholder={placeholder}
      placeholderTextColor="#666"
      value={formData[field]}
      onChangeText={(value) => handleInputChange(field, value)}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
    />
  );

  const renderSectionCard = (title: string, children: ReactNode) => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      {/* Updated Header without background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#146070" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Tenant</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={showImagePickerOptions}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="camera" size={40} color="#146070" />
                <Text style={styles.placeholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        {renderSectionCard(
          'Personal Information',
          <>
            {renderInputField('Full Name *', 'name')}
            {renderInputField('Email Address *', 'email', 'email-address')}
            {renderInputField('Phone Number *', 'phone', 'phone-pad')}
            {renderInputField('Date of Birth', 'dateOfBirth')}
            {renderInputField('National ID/SSN', 'nationalId')}
          </>
        )}

        {/* Current Address */}
        {renderSectionCard(
          'Current Address',
          <>
            {renderInputField('Street Address', 'currentAddress', 'default', true)}
            {renderInputField('City', 'city')}
            {renderInputField('State', 'state')}
            {renderInputField('ZIP Code', 'zipCode', 'numeric')}
            {renderInputField('Country', 'country')}
          </>
        )}

        {/* Lease Information */}
        {renderSectionCard(
          'Lease Information',
          <>
            {renderInputField('Lease Start Date', 'leaseStartDate')}
            {renderInputField('Lease End Date', 'leaseEndDate')}
            {renderInputField('Monthly Rent (₹)', 'monthlyRent', 'numeric')}
            {renderInputField('Security Deposit (₹)', 'securityDeposit', 'numeric')}
            {renderInputField('Property Unit', 'propertyUnit')}
          </>
        )}

        {/* Emergency Contact */}
        {renderSectionCard(
          'Emergency Contact',
          <>
            {renderInputField('Contact Name', 'emergencyName')}
            {renderInputField('Contact Phone', 'emergencyPhone', 'phone-pad')}
            {renderInputField('Relationship', 'emergencyRelation')}
          </>
        )}

        {/* Submit Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <LinearGradient
              colors={['#146070', '#03C174']}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.submitButtonText}>Add Tenant</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5', // Same as container background
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#146070', // Changed from white to dark color
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#146070',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#146070',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12, // Reduced from 15 to 12
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    height: 48, // Fixed height for consistency
    textAlignVertical: 'center',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 1,
    marginRight: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 30,
  },
});

export default AddTenantScreen;
