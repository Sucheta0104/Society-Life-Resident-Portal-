import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

interface VisitorFormData {
  // Personal Information
  photo: string | null;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  contactNumber: string;
  email: string;
  
  // Identity Documents
  aadharNumber: string;
  panNumber: string;
  
  // Visit Details
  purposeOfVisit: string;
  hostName: string;
  hostContactNumber: string;
  hostUnit: string;
  vehicleNumber: string;
  visitDate: string;
  expectedDuration: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyRelation: string;
  emergencyContactNumber: string;
}

const AddVisitor: React.FC = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<VisitorFormData>({
    photo: null,
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    contactNumber: '',
    email: '',
    aadharNumber: '',
    panNumber: '',
    purposeOfVisit: '',
    hostName: '',
    hostContactNumber: '',
    hostUnit: '',
    vehicleNumber: '',
    visitDate: '',
    expectedDuration: '',
    emergencyContactName: '',
    emergencyRelation: '',
    emergencyContactNumber: '',
  });

  const [errors, setErrors] = useState<Partial<VisitorFormData>>({});

  const genderOptions = ['Male', 'Female', 'Other'];
  const purposeOptions = ['Personal Work', 'Business Meeting', 'Delivery', 'Maintenance', 'Interview', 'Other'];
  const relationOptions = ['Father', 'Mother', 'Spouse', 'Sibling', 'Friend', 'Colleague', 'Other'];

  const updateFormData = (key: keyof VisitorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photo.');
      return;
    }

    Alert.alert(
      'Select Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateFormData('photo', result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateFormData('photo', result.assets[0].uri);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<VisitorFormData> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.purposeOfVisit.trim()) newErrors.purposeOfVisit = 'Purpose of visit is required';
    if (!formData.hostName.trim()) newErrors.hostName = 'Host name is required';
    if (!formData.hostUnit.trim()) newErrors.hostUnit = 'Host unit is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (formData.contactNumber && !phoneRegex.test(formData.contactNumber.replace(/\D/g, ''))) {
      newErrors.contactNumber = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      Alert.alert(
        'Success',
        'Visitor added successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Please fill in all required fields correctly.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Form',
      'Are you sure you want to reset all fields?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            setFormData({
              photo: null,
              firstName: '',
              lastName: '',
              gender: '',
              dateOfBirth: '',
              contactNumber: '',
              email: '',
              aadharNumber: '',
              panNumber: '',
              purposeOfVisit: '',
              hostName: '',
              hostContactNumber: '',
              hostUnit: '',
              vehicleNumber: '',
              visitDate: '',
              expectedDuration: '',
              emergencyContactName: '',
              emergencyRelation: '',
              emergencyContactNumber: '',
            });
            setErrors({});
          },
        },
      ]
    );
  };

  const renderInput = (
    key: keyof VisitorFormData,
    label: string,
    placeholder: string,
    required: boolean = false,
    multiline: boolean = false,
    keyboardType: any = 'default'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          errors[key] && styles.inputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={formData[key] as string}
        onChangeText={(value) => updateFormData(key, value)}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
      {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
    </View>
  );

  const renderDropdown = (
    key: keyof VisitorFormData,
    label: string,
    options: string[],
    required: boolean = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.dropdown, errors[key] && styles.inputError]}
        onPress={() => {
          Alert.alert(
            `Select ${label}`,
            '',
            options.map(option => ({
              text: option,
              onPress: () => updateFormData(key, option),
            })).concat([{ text: 'Cancel', style: 'cancel' }])
          );
        }}
      >
        <Text style={[styles.dropdownText, !formData[key] && styles.placeholderText]}>
          {formData[key] as string || `Select ${label.toLowerCase()}`}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
    </View>
  );

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#146070', '#03C174']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Visitor</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo Upload Section */}
          <SectionCard title="Visitor Photo">
            <View style={styles.photoContainer}>
              <TouchableOpacity style={styles.photoUpload} onPress={handleImagePicker}>
                {formData.photo ? (
                  <Image source={{ uri: formData.photo }} style={styles.uploadedImage} />
                ) : (
                  <>
                    <MaterialIcons name="camera-alt" size={40} color="#03C174" />
                    <Text style={styles.uploadText}>Upload Photo</Text>
                    <Text style={styles.uploadSubtext}>
                      Supported: JPG, PNG, PDF (Max 5MB each)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SectionCard>

          {/* Personal Information */}
          <SectionCard title="Personal Information">
            {renderInput('firstName', 'First Name', 'Enter first name', true)}
            {renderInput('lastName', 'Last Name', 'Enter last name', true)}
            {renderDropdown('gender', 'Gender', genderOptions, true)}
            {renderInput('dateOfBirth', 'Date of Birth', 'dd-mm-yyyy', false)}
            {renderInput('contactNumber', 'Contact Number', 'Enter contact number', true, false, 'phone-pad')}
            {renderInput('email', 'Email', 'Enter email', true, false, 'email-address')}
          </SectionCard>

          {/* Identity Documents */}
          <SectionCard title="Identity Documents">
            {renderInput('aadharNumber', 'Aadhar Number', '1234 5678 9101', false, false, 'numeric')}
            {renderInput('panNumber', 'PAN Number', 'ABCDE1234F', false)}
          </SectionCard>
          
          {/* Visit Details */}
          <SectionCard title="Visit Details">
            {renderDropdown('purposeOfVisit', 'Purpose of Visit', purposeOptions, true)}
            {renderInput('hostName', 'Host Name', 'Enter host name', true)}
            {renderInput('hostContactNumber', 'Host Contact Number', 'Enter host contact number', false, false, 'phone-pad')}
            {renderInput('hostUnit', 'Host Unit', 'e.g. A-101, B-205', true)}
            {renderInput('vehicleNumber', 'Vehicle Number', 'Enter vehicle number', false)}
            {renderInput('visitDate', 'Visit Date', 'dd-mm-yyyy', false)}
            {renderInput('expectedDuration', 'Expected Duration', 'e.g. 2 hours, Half day', false)}
          </SectionCard>

          {/* Emergency Contact */}
          <SectionCard title="Emergency Contact">
            {renderInput('emergencyContactName', 'Emergency Contact Name', 'Enter name', false)}
            {renderDropdown('emergencyRelation', 'Relation', relationOptions, false)}
            {renderInput('emergencyContactNumber', 'Emergency Contact Number', 'Enter number', false, false, 'phone-pad')}
          </SectionCard>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  photoUpload: {
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
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  uploadText: {
    fontSize: 16,
    color: '#03C174',
    fontWeight: '600',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
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
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#666',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#03C174',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddVisitor;
