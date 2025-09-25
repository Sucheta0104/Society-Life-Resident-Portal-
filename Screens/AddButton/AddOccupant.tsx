import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface FormData {
  photo: string | null;
  firstName: string;
  lastName: string;
  unit: string;
  occupantType: string;
  effectiveStartDate: Date | null;
  relationWithPrimary: string;
  isPrimaryOccupant: boolean;
  panNumber: string;
  country: string;
  state: string;
  pinCode: string;
  address: string;
  gender: string;
  dateOfBirth: Date | null;
  contactNumber: string;
  email: string;
  aadharNumber: string;
}

interface FormErrors {
  [key: string]: string;
}

const AddOccupant: React.FC = () => {
  const navigation = useNavigation();
  
  const [formData, setFormData] = useState<FormData>({
    photo: null,
    firstName: '',
    lastName: '',
    unit: '',
    occupantType: '',
    effectiveStartDate: null,
    relationWithPrimary: '',
    isPrimaryOccupant: false,
    panNumber: '',
    country: '',
    state: '',
    pinCode: '',
    address: '',
    gender: '',
    dateOfBirth: null,
    contactNumber: '',
    email: '',
    aadharNumber: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = useState<{
    show: boolean;
    type: 'effectiveStart' | 'dateOfBirth' | null;
  }>({
    show: false,
    type: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Auto-close success modal after 2 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (showSuccessModal) {
      timeoutId = setTimeout(() => {
        setShowSuccessModal(false);
        navigation.goBack();
      }, 2000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showSuccessModal, navigation]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required field validations - only set error flag, no message
    if (!formData.photo) newErrors.photo = 'error';
    if (!formData.firstName.trim()) newErrors.firstName = 'error';
    if (!formData.lastName.trim()) newErrors.lastName = 'error';
    if (!formData.unit) newErrors.unit = 'error';
    if (!formData.occupantType) newErrors.occupantType = 'error';
    if (!formData.country) newErrors.country = 'error';
    if (!formData.state) newErrors.state = 'error';
    if (!formData.gender) newErrors.gender = 'error';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'error';
    if (!formData.contactNumber.trim()) newErrors.contactNumber = 'error';
    if (!formData.email.trim()) newErrors.email = 'error';
    if (!formData.aadharNumber.trim()) newErrors.aadharNumber = 'error';
    if (!formData.panNumber.trim()) newErrors.panNumber = 'error';

    // Format validations
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'error';
    }
    
    if (formData.contactNumber && !/^\d{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'error';
    }

    if (formData.aadharNumber && !/^\d{4}\s\d{4}\s\d{4}$/.test(formData.aadharNumber)) {
      newErrors.aadharNumber = 'error';
    }

    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = 'error';
    }

    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = 'error';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setValidationError('Please fill all required fields correctly');
      return false;
    }
    
    return true;
  };

  const handleTakePhoto = async () => {
    setShowImagePickerModal(false);
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({ ...prev, photo: result.assets[0].uri }));
      setErrors(prev => ({ ...prev, photo: '' }));
    }
  };

  const handleChooseFromGallery = async () => {
    setShowImagePickerModal(false);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({ ...prev, photo: result.assets[0].uri }));
      setErrors(prev => ({ ...prev, photo: '' }));
    }
  };

  const handlePickDocument = async () => {
  setShowImagePickerModal(false);

  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "image/*",
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const file = result.assets[0]; // success result

      setFormData((prev) => ({ ...prev, photo: file.uri }));
      setErrors((prev) => ({ ...prev, photo: "" }));
    }
  } catch (error) {
    Alert.alert("Error", "Failed to pick document");
  }
};

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker({ show: false, type: null });
    
    if (selectedDate) {
      if (showDatePicker.type === 'effectiveStart') {
        setFormData(prev => ({ ...prev, effectiveStartDate: selectedDate }));
      } else if (showDatePicker.type === 'dateOfBirth') {
        setFormData(prev => ({ ...prev, dateOfBirth: selectedDate }));
        setErrors(prev => ({ ...prev, dateOfBirth: '' }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 1000);
  };

  const handleReset = () => {
    setFormData({
      photo: null,
      firstName: '',
      lastName: '',
      unit: '',
      occupantType: '',
      effectiveStartDate: null,
      relationWithPrimary: '',
      isPrimaryOccupant: false,
      panNumber: '',
      country: '',
      state: '',
      pinCode: '',
      address: '',
      gender: '',
      dateOfBirth: null,
      contactNumber: '',
      email: '',
      aadharNumber: '',
    });
    setErrors({});
    setValidationError('');
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'dd-mm-yyyy';
    return date.toLocaleDateString('en-GB');
  };

  const closeValidationError = () => {
    setValidationError('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#03C174" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <MaterialIcons name="person-add" size={24} color="#03C174" />
          <Text style={styles.headerTitle}>Add Occupant</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Photo Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Upload Photo<Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity 
            style={[
              styles.photoUploadContainer,
              errors.photo && styles.photoUploadError
            ]} 
            onPress={() => setShowImagePickerModal(true)}
          >
            {formData.photo ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: formData.photo }} style={styles.previewImage} />
                <Text style={styles.changePhotoText}>Tap to change photo</Text>
              </View>
            ) : (
              <View style={styles.photoUploadContent}>
                <MaterialIcons name="camera-alt" size={40} color="#03C174" />
                <Text style={styles.photoUploadText}>Upload Photo</Text>
                <Text style={styles.photoUploadSubtext}>
                  Accepted file types: PNG, JPG, JPEG
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              First Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              placeholder="John"
              value={formData.firstName}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, firstName: text }));
                if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
              }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Last Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              placeholder="Doe"
              value={formData.lastName}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, lastName: text }));
                if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
              }}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Gender <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.pickerContainer, errors.gender && styles.inputError]}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, gender: value }));
                  if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select Gender" value="" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Date of Birth <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.dateInput, errors.dateOfBirth && styles.inputError]}
              onPress={() => setShowDatePicker({ show: true, type: 'dateOfBirth' })}
            >
              <Text style={styles.dateInputText}>
                {formatDate(formData.dateOfBirth)}
              </Text>
              <MaterialIcons name="date-range" size={24} color="#03C174" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Contact Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.contactNumber && styles.inputError]}
              placeholder="Phone No.."
              value={formData.contactNumber}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, contactNumber: text }));
                if (errors.contactNumber) setErrors(prev => ({ ...prev, contactNumber: '' }));
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="example@mail.com"
              value={formData.email}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, email: text }));
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Aadhar Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.aadharNumber && styles.inputError]}
              placeholder="1234 5678 9101"
              value={formData.aadharNumber}
              onChangeText={(text) => {
                // Format Aadhar number with spaces
                const cleaned = text.replace(/\s/g, '');
                const formatted = cleaned.replace(/(.{4})(.{4})(.{4})/, '$1 $2 $3');
                setFormData(prev => ({ ...prev, aadharNumber: formatted }));
                if (errors.aadharNumber) setErrors(prev => ({ ...prev, aadharNumber: '' }));
              }}
              keyboardType="numeric"
              maxLength={14}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              PAN Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.panNumber && styles.inputError]}
              placeholder="ABCDE1234F"
              value={formData.panNumber}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, panNumber: text.toUpperCase() }));
                if (errors.panNumber) setErrors(prev => ({ ...prev, panNumber: '' }));
              }}
              maxLength={10}
              autoCapitalize="characters"
            />
          </View>
          
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Country <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.pickerContainer, errors.country && styles.inputError]}>
              <Picker
                selectedValue={formData.country}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, country: value }));
                  if (errors.country) setErrors(prev => ({ ...prev, country: '' }));
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select Country" value="" />
                <Picker.Item label="India" value="india" />
                <Picker.Item label="USA" value="usa" />
                <Picker.Item label="UK" value="uk" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              State <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.pickerContainer, errors.state && styles.inputError]}>
              <Picker
                selectedValue={formData.state}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, state: value }));
                  if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select State" value="" />
                <Picker.Item label="Maharashtra" value="maharashtra" />
                <Picker.Item label="Karnataka" value="karnataka" />
                <Picker.Item label="Tamil Nadu" value="tamilnadu" />
                <Picker.Item label="Delhi" value="delhi" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Pin Code</Text>
            <TextInput
              style={[styles.input, errors.pinCode && styles.inputError]}
              placeholder="751001"
              value={formData.pinCode}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, pinCode: text }));
                if (errors.pinCode) setErrors(prev => ({ ...prev, pinCode: '' }));
              }}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter full address..."
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Occupant Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Occupant Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Unit <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.pickerContainer, errors.unit && styles.inputError]}>
              <Picker
                selectedValue={formData.unit}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, unit: value }));
                  if (errors.unit) setErrors(prev => ({ ...prev, unit: '' }));
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select unit" value="" />
                <Picker.Item label="Unit A-101" value="A-101" />
                <Picker.Item label="Unit A-102" value="A-102" />
                <Picker.Item label="Unit B-101" value="B-101" />
                <Picker.Item label="Unit B-102" value="B-102" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Occupant Type <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.pickerContainer, errors.occupantType && styles.inputError]}>
              <Picker
                selectedValue={formData.occupantType}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, occupantType: value }));
                  if (errors.occupantType) setErrors(prev => ({ ...prev, occupantType: '' }));
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select type" value="" />
                <Picker.Item label="Owner" value="owner" />
                <Picker.Item label="Tenant" value="tenant" />
                <Picker.Item label="Family Member" value="family" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Effective Start Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker({ show: true, type: 'effectiveStart' })}
            >
              <Text style={styles.dateInputText}>
                {formatDate(formData.effectiveStartDate)}
              </Text>
              <MaterialIcons name="date-range" size={24} color="#03C174" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Relation with Primary Occupant</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.relationWithPrimary}
                onValueChange={(value) => setFormData(prev => ({ ...prev, relationWithPrimary: value }))}
                style={styles.picker}
              >
                <Picker.Item label="Select Relation" value="" />
                <Picker.Item label="Spouse" value="spouse" />
                <Picker.Item label="Child" value="child" />
                <Picker.Item label="Parent" value="parent" />
                <Picker.Item label="Sibling" value="sibling" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Primary Occupant</Text>
            <View style={styles.radioContainer}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setFormData(prev => ({ ...prev, isPrimaryOccupant: true }))}
              >
                <View style={[
                  styles.radioCircle,
                  formData.isPrimaryOccupant && styles.radioSelected
                ]} />
                <Text style={styles.radioText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setFormData(prev => ({ ...prev, isPrimaryOccupant: false }))}
              >
                <View style={[
                  styles.radioCircle,
                  !formData.isPrimaryOccupant && styles.radioSelected
                ]} />
                <Text style={styles.radioText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
          {/* Bottom Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.saveButtonContainer}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={['#146070', '#03C174']}
              style={styles.saveButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker.show && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imagePickerModal}>
            <Text style={styles.modalTitle}>Select Option</Text>
            
            <TouchableOpacity style={styles.optionButton} onPress={handleTakePhoto}>
              <MaterialIcons name="camera-alt" size={24} color="#03C174" />
              <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionButton} onPress={handleChooseFromGallery}>
              <MaterialIcons name="photo" size={24} color="#03C174" />
              <Text style={styles.optionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionButton} onPress={handlePickDocument}>
              <MaterialIcons name="description" size={24} color="#03C174" />
              <Text style={styles.optionText}>Pick Document</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <LinearGradient
              colors={['#146070', '#03C174']}
              style={styles.successContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark" size={40} color="#fff" />
              </View>
              <Text style={styles.successTitle}>Success!</Text>
              <Text style={styles.successMessage}>Occupant has been added successfully</Text>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Validation Error Modal */}
      <Modal
        visible={!!validationError}
        transparent={true}
        animationType="fade"
        onRequestClose={closeValidationError}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.errorModal}>
            <View style={styles.errorContent}>
              <MaterialIcons name="error" size={40} color="#e74c3c" />
              <Text style={styles.errorTitle}>Validation Error</Text>
              <Text style={styles.errorMessage}>{validationError}</Text>
              <TouchableOpacity style={styles.errorOkButton} onPress={closeValidationError}>
                <Text style={styles.errorOkButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#03C174',
    marginLeft: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  photoUploadContainer: {
    borderWidth: 2,
    borderColor: '#03C174',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    minHeight: 120,
  },
  photoUploadError: {
    borderColor: '#e74c3c',
  },
  photoUploadContent: {
    alignItems: 'center',
  },
  photoPreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    marginTop: 10,
  },
  photoUploadSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#e74c3c',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 50,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 50,
  },
  picker: {
    height: 50,
    marginHorizontal: 10,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    minHeight: 50,
  },
  dateInputText: {
    fontSize: 16,
    color: '#666',
  },
  radioContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioSelected: {
    borderColor: '#03C174',
    backgroundColor: '#03C174',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 20,
    gap: 15,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonContainer: {
    flex: 1,
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: width * 0.85,
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 15,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#fee',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
  successModal: {
    width: width * 0.8,
    maxWidth: 300,
  },
  successContent: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  errorModal: {
    width: width * 0.8,
    maxWidth: 300,
  },
  errorContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginVertical: 15,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorOkButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  errorOkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddOccupant;
