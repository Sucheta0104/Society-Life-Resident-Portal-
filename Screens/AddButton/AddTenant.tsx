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
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { ReactNode } from 'react';

const { width: screenWidth } = Dimensions.get('window');

type FormData = {
  title: string;
  name: string;
  email: string;
  phone: string;
  alternativePhone: string;
  gender: string;
  dateOfBirth: string;
  nationalId: string;
  aadharNumber: string;
  panNumber: string;
  religion: string;
  currentAddress: string;
  city: string;
  state: string;
  zipCode: string;
  pincode: string;
  country: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: string;
  securityDeposit: string;
  propertyUnit: string;
  effectiveStartDate: string;
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

// Dropdown options
const titles: DropdownOption[] = [
  { label: 'Mr.', value: 'mr' },
  { label: 'Mrs.', value: 'mrs' },
  { label: 'Ms.', value: 'ms' },
  { label: 'Dr.', value: 'dr' },
  { label: 'Prof.', value: 'prof' },
];

const genders: DropdownOption[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const religions: DropdownOption[] = [
  { label: 'Hindu', value: 'hindu' },
  { label: 'Muslim', value: 'muslim' },
  { label: 'Christian', value: 'christian' },
  { label: 'Sikh', value: 'sikh' },
  { label: 'Buddhist', value: 'buddhist' },
  { label: 'Jain', value: 'jain' },
  { label: 'Other', value: 'other' },
];

const states: DropdownOption[] = [
  { label: 'Odisha', value: 'odisha' },
  { label: 'Delhi', value: 'delhi' },
  { label: 'Maharashtra', value: 'maharashtra' },
  { label: 'Karnataka', value: 'karnataka' },
  { label: 'Tamil Nadu', value: 'tamilnadu' },
  { label: 'Gujarat', value: 'gujarat' },
  { label: 'Rajasthan', value: 'rajasthan' },
  { label: 'Punjab', value: 'punjab' },
  { label: 'West Bengal', value: 'westbengal' },
  { label: 'Uttar Pradesh', value: 'uttarpradesh' },
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
    title: '',
    name: '',
    email: '',
    phone: '',
    alternativePhone: '',
    gender: '',
    dateOfBirth: '',
    nationalId: '',
    aadharNumber: '',
    panNumber: '',
    religion: '',
    
    // Address Information
    currentAddress: '',
    city: '',
    state: '',
    zipCode: '',
    pincode: '',
    country: '',
    
    // Lease Information
    leaseStartDate: '',
    leaseEndDate: '',
    monthlyRent: '',
    securityDeposit: '',
    propertyUnit: '',
    effectiveStartDate: '',
    
    // Emergency Contact
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [alternativeCountryCode, setAlternativeCountryCode] = useState('+91');
  const [emergencyCountryCode, setEmergencyCountryCode] = useState('+91');
  
  // Modal states
  const [showCountryCodeModal, setShowCountryCodeModal] = useState(false);
  const [showAlternativeCountryCodeModal, setShowAlternativeCountryCodeModal] = useState(false);
  const [showEmergencyCountryCodeModal, setShowEmergencyCountryCodeModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  
  // Dropdown modal states
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showReligionDropdown, setShowReligionDropdown] = useState(false);
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
    
    // Phone validation
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = true;
    }

    // Aadhar validation
    if (formData.aadharNumber && !/^\d{4}\s\d{4}\s\d{4}$/.test(formData.aadharNumber)) {
      newErrors.aadharNumber = true;
    }

    // PAN validation
    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = true;
    }

    // Pincode validation
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = true;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Image picker functions
  const takePicture = async () => {
    setShowImagePickerModal(false);
    
    if (!permission?.granted) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    setShowImagePickerModal(false);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery access permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const pickDocument = async () => {
    setShowImagePickerModal(false);

    try {
      const result: any = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        if (result.size && result.size > 5000000) {
          Alert.alert('Error', 'File size too large. Please select a file smaller than 5MB.');
          return;
        }
        setProfileImage(result.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const showImagePickerOptions = () => {
    setShowImagePickerModal(true);
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
        maxLength={10}
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
    required: boolean = false,
    maxLength?: number
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
        onChangeText={(value) => {
          let processedValue = value;
          
          // Special formatting for Aadhar number
          if (field === 'aadharNumber') {
            const cleaned = value.replace(/\s/g, '');
            processedValue = cleaned.replace(/(.{4})(.{4})(.{4})/, '$1 $2 $3');
          }
          // Special formatting for PAN number
          else if (field === 'panNumber') {
            processedValue = value.toUpperCase();
          }
          
          handleInputChange(field, processedValue);
        }}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        maxLength={maxLength}
        autoCapitalize={
          field === 'email' ? 'none' : 
          field === 'panNumber' ? 'characters' : 
          'words'
        }
      />
      {errors[field] && (
        <Text style={styles.errorText}>
          {field === 'email' && 'Please enter a valid email address'}
          {field === 'phone' && 'Please enter a valid 10-digit phone number'}
          {field === 'aadharNumber' && 'Please enter a valid Aadhar number (1234 5678 9012)'}
          {field === 'panNumber' && 'Please enter a valid PAN number (ABCDE1234F)'}
          {field === 'pincode' && 'Please enter a valid 6-digit pincode'}
          {!['email', 'phone', 'aadharNumber', 'panNumber', 'pincode'].includes(field) && 'This field is required'}
        </Text>
      )}
    </View>
  );

  const renderSectionCard = (title: string, children: ReactNode) => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  // Image Picker Modal Component
  const ImagePickerModal = () => (
    <Modal
      visible={showImagePickerModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowImagePickerModal(false)}
    >
      <View style={styles.imagePickerModalOverlay}>
        <View style={styles.imagePickerModalContainer}>
          <Text style={styles.imagePickerModalTitle}>Select Photo Option</Text>
          
          <View style={styles.imagePickerOptionsContainer}>
            <TouchableOpacity style={styles.imagePickerOption} onPress={takePicture}>
              <View style={styles.imagePickerOptionIconContainer}>
                <MaterialIcons name="camera-alt" size={24} color="#146070" />
              </View>
              <Text style={styles.imagePickerOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.imagePickerOption} onPress={pickFromGallery}>
              <View style={styles.imagePickerOptionIconContainer}>
                <MaterialIcons name="photo-library" size={24} color="#146070" />
              </View>
              <Text style={styles.imagePickerOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.imagePickerOption} onPress={pickDocument}>
              <View style={styles.imagePickerOptionIconContainer}>
                <MaterialIcons name="insert-drive-file" size={24} color="#146070" />
              </View>
              <Text style={styles.imagePickerOptionText}>Pick Image File</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.imagePickerCancelButton} 
            onPress={() => setShowImagePickerModal(false)}
          >
            <Text style={styles.imagePickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
      
      {/* Header */}
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
        {/* Profile Picture Section - Updated Design */}
        {renderSectionCard(
          'Profile Photo',
          <View style={styles.photoContainer}>
            <TouchableOpacity 
              style={[
                styles.photoUploadContainer,
                profileImage && styles.photoUploadWithImage
              ]} 
              onPress={showImagePickerOptions}
            >
              {profileImage ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: profileImage }} style={styles.previewImage} />
                  <Text style={styles.changePhotoText}>Tap to change photo</Text>
                </View>
              ) : (
                <View style={styles.photoUploadContent}>
                  <MaterialIcons name="camera-alt" size={40} color="#03C174" />
                  <Text style={styles.photoUploadText}>Upload Photo</Text>
                  <Text style={styles.photoUploadSubtext}>
                    Accepted file types: PNG, JPG, JPEG (Max 5MB)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Personal Information */}
        {renderSectionCard(
          'Personal Information',
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Title</Text>
              {renderDropdown('Select Title', 'title', titles, showTitleDropdown, setShowTitleDropdown)}
            </View>
            
            {renderInputField('Full Name', 'name', 'default', false, true)}
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Gender <Text style={styles.requiredAsterisk}>*</Text></Text>
              {renderDropdown('Select Gender', 'gender', genders, showGenderDropdown, setShowGenderDropdown)}
            </View>

            {renderInputField('Email Address', 'email', 'email-address', false, true)}
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Contact Number<Text style={styles.requiredAsterisk}> *</Text>
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
                <Text style={styles.errorText}>Please enter a valid 10-digit phone number</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Alternative Contact Number</Text>
              {renderPhoneInput(
                'Alternative Phone',
                'alternativePhone',
                alternativeCountryCode,
                setAlternativeCountryCode,
                showAlternativeCountryCodeModal,
                setShowAlternativeCountryCodeModal
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              {renderDateInput('Select Date of Birth', 'dateOfBirth')}
            </View>

            {renderInputField('Aadhar Number', 'aadharNumber', 'numeric', false, false, 14)}
            {renderInputField('PAN Number', 'panNumber', 'default', false, false, 10)}
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Religion</Text>
              {renderDropdown('Select Religion', 'religion', religions, showReligionDropdown, setShowReligionDropdown)}
            </View>
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
              {renderDropdown('Select State', 'state', states, showStateDropdown, setShowStateDropdown)}
            </View>
            {renderInputField('ZIP Code', 'zipCode', 'numeric', false, false, 6)}
            {renderInputField('Pincode', 'pincode', 'numeric', false, false, 6)}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Country</Text>
              {renderDropdown('Select Country', 'country', countries, showCountryDropdown, setShowCountryDropdown)}
            </View>
          </>
        )}

        {/* Lease Information */}
        {renderSectionCard(
          'Lease Information',
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Effective Start Date</Text>
              {renderDateInput('Select Start Date', 'effectiveStartDate')}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Lease Start Date</Text>
              {renderDateInput('Select Lease Start Date', 'leaseStartDate')}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Lease End Date</Text>
              {renderDateInput('Select Lease End Date', 'leaseEndDate')}
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

      <ImagePickerModal />
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },

  // Photo Upload Styles
  photoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  photoUploadContainer: {
    width: '100%',
    height: 200,
    borderWidth: 2,
    borderColor: '#03C174',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
  },
  photoUploadWithImage: {
    borderStyle: 'solid',
  },
  photoUploadContent: {
    alignItems: 'center',
  },
  photoPreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#03C174',
    fontWeight: '500',
  },
  photoUploadText: {
    fontSize: 16,
    color: '#03C174',
    fontWeight: '600',
    marginTop: 8,
  },
  photoUploadSubtext: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },

  // Form Input Styles
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

  // Phone Input Styles
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

  // Dropdown Styles
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
  placeholderText: {
    color: '#999',
  },

  // Modal Styles
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

  // Country Code Modal Styles
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

  // Dropdown Item Styles
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

  // Image Picker Modal Styles
  imagePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '85%',
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
  imagePickerModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  imagePickerOptionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  imagePickerOptionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  imagePickerOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  imagePickerCancelButton: {
    paddingVertical: 14,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    alignItems: 'center',
  },
  imagePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
  },

  // Button Styles
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

  // Success Modal Styles
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
