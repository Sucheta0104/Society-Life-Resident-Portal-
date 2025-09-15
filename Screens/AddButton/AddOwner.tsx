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
  Modal,
  Platform,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const RegistrationForm = () => {
  const navigation = useNavigation();
  
  // Form state
  const [formData, setFormData] = useState({
    gender: '',
    dateOfBirth: '',
    contactNumber: '',
    email: '',
    aadharNumber: '',
    panNumber: '',
    country: '',
    state: '',
    city: '',
    pinCode: '',
    address: '',
    unit: '',
    ownershipType: '',
    ownershipDate: '',
    ownershipShare: '100',
    emergencyContactName: '',
    emergencyRelation: '',
    emergencyContactNumber: '',
    nomineeDetails: '',
  });

  type AttachedFile = {
    uri: string;
    name: string;
    type: string;
  };

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);

  // Options for radio buttons
  const genderOptions = ['Male', 'Female', 'Other'];
  const relationOptions = ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Other'];

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle back button press
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Handle relation selection
  const handleRelationSelect = (relation: string) => {
    handleInputChange('emergencyRelation', relation);
    setShowRelationDropdown(false);
  };

  // Camera and document picker functions
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert('Permission required', 'Camera and media library permissions are required to take photos and select documents.');
        return false;
      }
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAttachedFiles(prev => [...prev, {
        uri: result.assets[0].uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image',
      }]);
      setShowImagePicker(false);
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAttachedFiles(prev => [...prev, {
        uri: result.assets[0].uri,
        name: `image_${Date.now()}.jpg`,
        type: 'image',
      }]);
      setShowImagePicker(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setAttachedFiles(prev => [...prev, {
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          type: 'document',
        }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validateForm = () => {
    const requiredFields = {
      gender: 'Gender',
      dateOfBirth: 'Date of Birth',
      contactNumber: 'Contact Number',
      email: 'Email',
      aadharNumber: 'Aadhar Number',
      panNumber: 'PAN Number',
      country: 'Country',
      state: 'State',
      unit: 'Unit',
      ownershipType: 'Ownership Type',
    };

    for (const [field, label] of Object.entries(requiredFields) as [keyof typeof formData, string][]) {
      if (!formData[field].trim()) {
        Alert.alert("Validation Error", `${label} is required`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    // Phone number validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.contactNumber)) {
      Alert.alert('Validation Error', 'Contact number must be 10 digits');
      return false;
    }

    // Aadhar validation (12 digits)
    const aadharRegex = /^\d{12}$/;
    if (!aadharRegex.test(formData.aadharNumber.replace(/\s/g, ''))) {
      Alert.alert('Validation Error', 'Aadhar number must be 12 digits');
      return false;
    }

    // PAN validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.panNumber.toUpperCase())) {
      Alert.alert('Validation Error', 'Please enter a valid PAN number');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      Alert.alert('Success', 'Form submitted successfully!', [
        {
          text: 'OK',
          onPress: () => console.log('Form Data:', formData, 'Files:', attachedFiles)
        }
      ]);
    }
  };

  const handleReset = () => {
    Alert.alert('Reset Form', 'Are you sure you want to reset all fields?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setFormData({
            gender: '',
            dateOfBirth: '',
            contactNumber: '',
            email: '',
            aadharNumber: '',
            panNumber: '',
            country: '',
            state: '',
            city: '',
            pinCode: '',
            address: '',
            unit: '',
            ownershipType: '',
            ownershipDate: '',
            ownershipShare: '100',
            emergencyContactName: '',
            emergencyRelation: '',
            emergencyContactNumber: '',
            nomineeDetails: '',
          });
          setAttachedFiles([]);
        }
      }
    ]);
  };

  // Format Aadhar number with spaces
  const formatAadharNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join(' ');
    }
    return text;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#146070" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Owner</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Attachment Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Attach Images/Documents</Text>
          <View style={styles.attachmentContainer}>
            <TouchableOpacity
              style={styles.attachmentBox}
              onPress={() => setShowImagePicker(true)}
            >
              <Ionicons name="camera" size={40} color="#03C174" />
              <Text style={styles.attachmentText}>Take a photo or upload documents</Text>
              <Text style={styles.supportedText}>Supported: JPG, PNG, PDF (Max 5MB each)</Text>
            </TouchableOpacity>
          </View>

          {/* Attached Files */}
          {attachedFiles.length > 0 && (
            <View style={styles.attachedFilesContainer}>
              <Text style={styles.attachedFilesTitle}>Attached Files:</Text>
              {attachedFiles.map((file, index) => (
                <View key={index} style={styles.attachedFile}>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <TouchableOpacity onPress={() => removeFile(index)}>
                    <Ionicons name="close-circle" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Personal Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {/* Gender Radio Buttons */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Gender <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.radioGroup}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.radioOption}
                  onPress={() => handleInputChange('gender', option)}
                >
                  <View style={styles.radioCircle}>
                    {formData.gender === option && <View style={styles.radioSelected} />}
                  </View>
                  <Text style={styles.radioText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Date of Birth <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="dd-mm-yyyy"
              value={formData.dateOfBirth}
              onChangeText={(text) => handleInputChange('dateOfBirth', text)}
            />
          </View>

          {/* Contact Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Contact Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter contact number"
              keyboardType="phone-pad"
              maxLength={10}
              value={formData.contactNumber}
              onChangeText={(text) => handleInputChange('contactNumber', text.replace(/\D/g, ''))}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
            />
          </View>

          {/* Aadhar Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Aadhar Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9101"
              keyboardType="number-pad"
              maxLength={14}
              value={formData.aadharNumber}
              onChangeText={(text) => handleInputChange('aadharNumber', formatAadharNumber(text))}
            />
          </View>

          {/* PAN Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              PAN Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="ABCDE1234F"
              autoCapitalize="characters"
              maxLength={10}
              value={formData.panNumber}
              onChangeText={(text) => handleInputChange('panNumber', text.toUpperCase())}
            />
          </View>
        </View>

        {/* Address Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Address Details</Text>
          
          {/* Country */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Country <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Select Country"
              value={formData.country}
              onChangeText={(text) => handleInputChange('country', text)}
            />
          </View>

          {/* State */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              State <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Select State"
              value={formData.state}
              onChangeText={(text) => handleInputChange('state', text)}
            />
          </View>

          {/* City */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter City"
              value={formData.city}
              onChangeText={(text) => handleInputChange('city', text)}
            />
          </View>

          {/* Pin Code */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pin Code</Text>
            <TextInput
              style={styles.input}
              placeholder="751001"
              keyboardType="number-pad"
              maxLength={6}
              value={formData.pinCode}
              onChangeText={(text) => handleInputChange('pinCode', text.replace(/\D/g, ''))}
            />
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter full address..."
              multiline
              numberOfLines={4}
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
            />
          </View>
        </View>

        {/* Ownership Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ownership Details</Text>
          
          {/* Space */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Unit <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Select unit"
              value={formData.unit}
              onChangeText={(text) => handleInputChange('unit', text)}
            />
          </View>

          {/* Ownership Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Ownership Type <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Select type"
              value={formData.ownershipType}
              onChangeText={(text) => handleInputChange('ownershipType', text)}
            />
          </View>

          {/* Ownership Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ownership Date</Text>
            <TextInput
              style={styles.input}
              placeholder="dd-mm-yyyy"
              value={formData.ownershipDate}
              onChangeText={(text) => handleInputChange('ownershipDate', text)}
            />
          </View>

          {/* Ownership Share */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ownership Share (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              keyboardType="number-pad"
              maxLength={3}
              value={formData.ownershipShare}
              onChangeText={(text) => handleInputChange('ownershipShare', text.replace(/\D/g, ''))}
            />
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          {/* Emergency Contact Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              value={formData.emergencyContactName}
              onChangeText={(text) => handleInputChange('emergencyContactName', text)}
            />
          </View>

          {/* Relation Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relation</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowRelationDropdown(!showRelationDropdown)}
            >
              <Text style={[styles.dropdownText, !formData.emergencyRelation && styles.placeholderText]}>
                {formData.emergencyRelation || 'Select Relation'}
              </Text>
              <Ionicons 
                name={showRelationDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
            
            {/* Dropdown Options */}
            {showRelationDropdown && (
              <View style={styles.dropdownContainer}>
                {relationOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownOption,
                      index === relationOptions.length - 1 && styles.lastDropdownOption
                    ]}
                    onPress={() => handleRelationSelect(option)}
                  >
                    <View style={styles.radioCircle}>
                      {formData.emergencyRelation === option && <View style={styles.radioSelected} />}
                    </View>
                    <Text style={styles.dropdownOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Emergency Contact Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number"
              keyboardType="phone-pad"
              maxLength={10}
              value={formData.emergencyContactNumber}
              onChangeText={(text) => handleInputChange('emergencyContactNumber', text.replace(/\D/g, ''))}
            />
          </View>

          {/* Nominee Details */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nominee Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter nominee information"
              multiline
              numberOfLines={3}
              value={formData.nomineeDetails}
              onChangeText={(text) => handleInputChange('nomineeDetails', text)}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleSubmit}>
            <LinearGradient
              colors={['#146070', '#03C174']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Image Picker Modal */}
        <Modal
          visible={showImagePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowImagePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Option</Text>
              
              <TouchableOpacity style={styles.modalButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color="#146070" />
                <Text style={styles.modalButtonText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalButton} onPress={pickFromGallery}>
                <Ionicons name="images" size={24} color="#146070" />
                <Text style={styles.modalButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalButton} onPress={pickDocument}>
                <Ionicons name="document" size={24} color="#146070" />
                <Text style={styles.modalButtonText}>Pick Document</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowImagePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#146070',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 34, // Same width as back button to center the title
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#ff4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#146070',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#146070',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  // New dropdown styles
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastDropdownOption: {
    borderBottomWidth: 0,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  attachmentContainer: {
    marginBottom: 16,
  },
  attachmentBox: {
    borderWidth: 2,
    borderColor: '#03C174',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fff9',
  },
  attachmentText: {
    fontSize: 16,
    color: '#03C174',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
  },
  supportedText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  attachedFilesContainer: {
    marginTop: 16,
  },
  attachedFilesTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  attachedFile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
    gap: 16,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#666',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  modalButtonText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#146070',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#ffebee',
    marginTop: 8,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default RegistrationForm;
