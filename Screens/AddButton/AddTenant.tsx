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
  Modal,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { ReactNode } from 'react';

const { width: screenWidth } = Dimensions.get('window');

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

type CountryCode = {
  code: string;
  flag: string;
  name: string;
};

type DropdownOption = {
  label: string;
  value: string;
};

const countryCodes: CountryCode[] = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
];

// Sample data - replace with API calls when connected
const states: DropdownOption[] = [
  { label: 'Odisha', value: 'odisha' },
  { label: 'Delhi', value: 'delhi' },
  { label: 'Maharashtra', value: 'maharashtra' },
  { label: 'Karnataka', value: 'karnataka' },
  { label: 'Tamil Nadu', value: 'tamilnadu' },
];

const countries: DropdownOption[] = [
  { label: 'India', value: 'india' },
  { label: 'United States', value: 'usa' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Canada', value: 'canada' },
  { label: 'Australia', value: 'australia' },
];

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
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [emergencyCountryCode, setEmergencyCountryCode] = useState('+91');
  const [showCountryCodeModal, setShowCountryCodeModal] = useState(false);
  const [showEmergencyCountryCodeModal, setShowEmergencyCountryCodeModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAnimation] = useState(new Animated.Value(0));

  const handleInputChange = <K extends keyof FormData>(field: K, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: false,
      }));
    }
  };

  const validateForm = () => {
    const requiredFields: (keyof FormData)[] = ["name", "email", "phone"];
    const newErrors: { [key: string]: boolean } = {};
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = true;
      }
    });
    
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = true;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleDateChange = (event: any, selectedDate?: Date, field?: string) => {
    setShowDatePicker(null);
    if (selectedDate && field) {
      const formattedDate = selectedDate.toLocaleDateString('en-GB'); // DD/MM/YYYY format
      handleInputChange(field as keyof FormData, formattedDate);
    }
  };

  const showSuccessAlert = () => {
    setShowSuccessModal(true);
    Animated.sequence([
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(successAnimation, {
        toValue: 0,
        duration: 500,
        delay: 2000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      console.log('Tenant data:', formData);
      navigation.goBack();
    });
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    showSuccessAlert();
  };

  const renderPhoneInput = (
    placeholder: string,
    field: keyof FormData,
    countryCode: string,
    setCountryCode: (code: string) => void,
    showModal: boolean,
    setShowModal: (show: boolean) => void
  ) => (
    <View style={[styles.phoneContainer, errors[field] && styles.inputError]}>
      <TouchableOpacity
        style={styles.countryCodeButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.countryCodeText}>{countryCode}</Text>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>
      <TextInput
        style={[styles.phoneInput]}
        placeholder={placeholder}
        placeholderTextColor="#666"
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        keyboardType="phone-pad"
      />
      
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryCodes}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryCodeItem}
                  onPress={() => {
                    setCountryCode(item.code);
                    setShowModal(false);
                  }}
                >
                  <Text style={styles.flagText}>{item.flag}</Text>
                  <Text style={styles.countryNameText}>{item.name}</Text>
                  <Text style={styles.countryCodeItemText}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderDropdown = (
    placeholder: string,
    field: keyof FormData,
    options: DropdownOption[],
    showDropdown: boolean,
    setShowDropdown: (show: boolean) => void
  ) => (
    <View>
      <TouchableOpacity
        style={[styles.dropdownContainer, errors[field] && styles.inputError]}
        onPress={() => setShowDropdown(true)}
      >
        <Text style={[styles.dropdownText, !formData[field] && styles.placeholderText]}>
          {formData[field] ? options.find(opt => opt.value === formData[field])?.label || formData[field] : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      
      <Modal
        visible={showDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {placeholder}</Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    handleInputChange(field, item.value);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderDateInput = (placeholder: string, field: keyof FormData) => (
    <View>
      <TouchableOpacity
        style={[styles.input, errors[field] && styles.inputError]}
        onPress={() => setShowDatePicker(field)}
      >
        <Text style={[styles.dateText, !formData[field] && styles.placeholderText]}>
          {formData[field] || placeholder}
        </Text>
        <Ionicons name="calendar" size={20} color="#666" />
      </TouchableOpacity>
      
      {showDatePicker === field && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, field)}
        />
      )}
    </View>
  );

  const renderInputField = (
    placeholder: string,
    field: keyof FormData,
    keyboardType: KeyboardTypeOptions = 'default',
    multiline: boolean = false,
    required: boolean = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {placeholder}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          errors[field] && styles.inputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#666"
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {errors[field] && (
        <Text style={styles.errorText}>This field is required</Text>
      )}
    </View>
  );

  const renderSectionCard = (title: string, children: ReactNode) => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const SuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent
      animationType="fade"
    >
      <View style={styles.successModalOverlay}>
        <Animated.View
          style={[
            styles.successModalContent,
            {
              opacity: successAnimation,
              transform: [
                {
                  scale: successAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#146070', '#03C174']}
            style={styles.successGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.successCheckContainer}>
              <Ionicons name="checkmark-circle" size={80} color="white" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>
              Tenant has been added successfully
            </Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
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
            {renderInputField('Full Name', 'name', 'default', false, true)}
            {renderInputField('Email Address', 'email', 'email-address', false, true)}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Phone Number<Text style={styles.requiredAsterisk}> *</Text>
              </Text>
              {renderPhoneInput(
                'Phone Number',
                'phone',
                selectedCountryCode,
                setSelectedCountryCode,
                showCountryCodeModal,
                setShowCountryCodeModal
              )}
              {errors.phone && (
                <Text style={styles.errorText}>This field is required</Text>
              )}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              {renderDateInput('Date of Birth', 'dateOfBirth')}
            </View>
            {renderInputField('National ID/SSN', 'nationalId')}
          </>
        )}

        {/* Current Address */}
        {renderSectionCard(
          'Current Address',
          <>
            {renderInputField('Street Address', 'currentAddress', 'default', true)}
            {renderInputField('City', 'city')}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>State</Text>
              {renderDropdown('State', 'state', states, showStateDropdown, setShowStateDropdown)}
            </View>
            {renderInputField('ZIP Code', 'zipCode', 'numeric')}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Country</Text>
              {renderDropdown('Country', 'country', countries, showCountryDropdown, setShowCountryDropdown)}
            </View>
          </>
        )}

        {/* Lease Information */}
        {renderSectionCard(
          'Lease Information',
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Lease Start Date</Text>
              {renderDateInput('Lease Start Date', 'leaseStartDate')}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Lease End Date</Text>
              {renderDateInput('Lease End Date', 'leaseEndDate')}
            </View>
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
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contact Phone</Text>
              {renderPhoneInput(
                'Contact Phone',
                'emergencyPhone',
                emergencyCountryCode,
                setEmergencyCountryCode,
                showEmergencyCountryCodeModal,
                setShowEmergencyCountryCodeModal
              )}
            </View>
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
              <Text style={styles.submitButtonText}>Save</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <SuccessModal />
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
    backgroundColor: '#f5f5f5',
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
    color: '#146070',
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
    color: '#666',
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
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  requiredAsterisk: {
    color: '#e74c3c',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    height: 48,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  phoneContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#e9ecef',
    borderRightWidth: 1,
    borderRightColor: '#dee2e6',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333',
    marginRight: 5,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    height: 48,
  },
  dropdownContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  countryCodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  flagText: {
    fontSize: 20,
    marginRight: 15,
  },
  countryNameText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  countryCodeItemText: {
    fontSize: 16,
    color: '#666',
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
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
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successModalContent: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 300,
  },
  successGradient: {
    padding: 40,
    alignItems: 'center',
  },
  successCheckContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
});

export default AddTenantScreen;