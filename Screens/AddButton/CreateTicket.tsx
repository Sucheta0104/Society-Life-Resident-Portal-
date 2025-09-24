import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';

// API Configuration
const API_CONFIG = {
  url: 'https://applianceservicemgmt.dev2stage.in/api/rest/Invoke',
  authKey: '86A264E4-ECF8-4627-AF83-5512FE83DAE6',
  hostKey: '8ECB211D2',
};

type FormData = {
  unitNumber: string;
  unitNumberId: string;
  category: string;
  categoryId: string;
  priority: string;
  priorityId: string;
  requestBy: string;
  requestById: string;
  serviceType: string;
  serviceTypeId: string;
  description: string;
};

type DropdownOption = {
  Text: string;
  Value: string;
};

// Fix Attachment type for name property
type Attachment =
  | (ImagePicker.ImagePickerAsset & { name?: string })
  | DocumentPicker.DocumentPickerAsset;

const CreateHelpTicket = () => {
  const navigation = useNavigation();

  const [formData, setFormData] = useState<FormData>({
    unitNumber: '',
    unitNumberId: '',
    category: '',
    categoryId: '',
    priority: '',
    priorityId: '',
    requestBy: '',
    requestById: '',
    serviceType: '',
    serviceTypeId: '',
    description: '',
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // API dropdown options
  const [categoryOptions, setCategoryOptions] = useState<DropdownOption[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<DropdownOption[]>([]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<DropdownOption[]>([]);
  
  // Static dropdown options
  const unitNumberOptions: DropdownOption[] = [
    { Text: 'Unit E305', Value: '101' },
    { Text: 'Unit 102', Value: '102' },
    { Text: 'Unit 103', Value: '103' },
    { Text: 'Unit 104', Value: '104' },
  ];

  const requestByOptions: DropdownOption[] = [
    { Text: 'Self', Value: '1' },
    { Text: 'Family Member', Value: '2' },
    { Text: 'Tenant', Value: '3' },
  ];

  // Loading states for API dropdowns
  const [loadingStates, setLoadingStates] = useState({
    category: false,
    priority: false,
    serviceType: false,
  });

  const [dropdownStates, setDropdownStates] = useState({
    unitNumber: false,
    category: false,
    priority: false,
    requestBy: false,
    serviceType: false,
  });

  // Custom Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // Animation Values
  const [successAnimation] = useState(new Animated.Value(0));
  const [errorAnimation] = useState(new Animated.Value(0));
  
  // Modal Data
  const [modalData, setModalData] = useState({ title: '', message: '' });

  // Fetch dropdown data from API
  const fetchDropdownOptions = async (groupId: string): Promise<DropdownOption[]> => {
    try {
      const valuesString = `0,'RD_TBL_Reference_List','Reference_List_Group_Id','${groupId}','Reference_List_Name','Reference_List_Id'`;
      
      const requestBody = new URLSearchParams({
        AuthKey: API_CONFIG.authKey,
        HostKey: API_CONFIG.hostKey,
        Object: "CMN_SP_Generic_DropdownList_Get",
        Values: valuesString,
      }).toString();

      console.log('🔗 Fetching dropdown data for group:', groupId);
      console.log('📤 Request body:', requestBody);

      const response = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: requestBody,
      });

      const responseText = await response.text();
      console.log('📥 API Response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      
      if (result?.Data && Array.isArray(result.Data)) {
        console.log('✅ Successfully fetched', result.Data.length, 'options for group', groupId);
        return result.Data;
      }
      
      console.log('⚠️ No data found for group', groupId);
      return [];
    } catch (error: any) {
      console.error('❌ Dropdown API Error for group', groupId, ':', error);
      showCustomError('API Error', `Failed to fetch dropdown options: ${error.message || error}`);
      return [];
    }
  };

  // Load all dropdown data on component mount
  useEffect(() => {
    const loadDropdownData = async () => {
      console.log('🚀 Loading dropdown data from API...');
      
      try {
        // Set loading states
        setLoadingStates({
          category: true,
          priority: true,
          serviceType: true,
        });

        // Fetch all dropdown data in parallel
        const [categoryData, priorityData, serviceTypeData] = await Promise.all([
          fetchDropdownOptions('13'), // Category
          fetchDropdownOptions('14'), // Priority  
          fetchDropdownOptions('15'), // Service Type
        ]);

        // Set the dropdown options
        setCategoryOptions(categoryData);
        setPriorityOptions(priorityData);
        setServiceTypeOptions(serviceTypeData);

        // console.log(' All dropdown data loaded successfully');
        // console.log(' Categories:', categoryData.length);
        // console.log(' Priorities:', priorityData.length);
        // console.log(' Service Types:', serviceTypeData.length);

      } catch (error) {
        console.error('❌ Error loading dropdown data:', error);
      } finally {
        // Clear loading states
        setLoadingStates({
          category: false,
          priority: false,
          serviceType: false,
        });
      }
    };

    loadDropdownData();
  }, []);

  // Custom Modal Functions
  const showCustomSuccess = (title: string, message: string) => {
    setModalData({ title, message });
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
        delay: 3000, // Display for 3 seconds
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      // Reset form after successful submission
      resetForm();
    });
  };

  const showCustomError = (title: string, message: string) => {
    setModalData({ title, message });
    setShowErrorModal(true);
    Animated.sequence([
      Animated.timing(errorAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Success Modal Component
  const SuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={modalStyles.successOverlay}>
        <Animated.View
          style={[
            modalStyles.successContent,
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
            style={modalStyles.successGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={modalStyles.successCheckContainer}>
              <Ionicons name="checkmark-circle" size={80} color="white" />
            </View>
            <Text style={modalStyles.successTitle}>{modalData.title}</Text>
            <Text style={modalStyles.successMessage}>{modalData.message}</Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );

  // Error Modal Component
  const ErrorModal = () => (
    <Modal
      visible={showErrorModal}
      transparent
      animationType="fade"
      onRequestClose={() => {
        Animated.timing(errorAnimation, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setShowErrorModal(false);
        });
      }}
    >
      <View style={modalStyles.errorOverlay}>
        <Animated.View
          style={[
            modalStyles.errorContent,
            {
              opacity: errorAnimation,
              transform: [
                {
                  scale: errorAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#e74c3c', '#c0392b']}
            style={modalStyles.errorGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={modalStyles.errorIconContainer}>
              <Ionicons name="close-circle" size={80} color="white" />
            </View>
            <Text style={modalStyles.errorTitle}>{modalData.title}</Text>
            <Text style={modalStyles.errorMessage}>{modalData.message}</Text>
            <TouchableOpacity
              style={modalStyles.errorButton}
              onPress={() => {
                Animated.timing(errorAnimation, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                  setShowErrorModal(false);
                });
              }}
            >
              <Text style={modalStyles.errorButtonText}>OK</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );

  const handleBackPress = () => navigation.goBack();

  const toggleDropdown = (field: string) => {
    setDropdownStates(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const selectOption = (field: string, text: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: text,
      [field + 'Id']: value 
    }));
    setDropdownStates(prev => ({ ...prev, [field]: false }));
    
    console.log(`📝 Selected ${field}:`, text, 'with ID:', value);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showCustomError('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAttachments(prev => [...prev, { ...result.assets[0], name: result.assets[0].uri.split('/').pop() }]);
    }
  };

  const uploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setAttachments(prev => [...prev, result.assets[0]]);
      }
    } catch {
      showCustomError('Error', 'Failed to pick document');
    }
  };

  const resetForm = () => {
    setFormData({
      unitNumber: '',
      unitNumberId: '',
      category: '',
      categoryId: '',
      priority: '',
      priorityId: '',
      requestBy: '',
      requestById: '',
      serviceType: '',
      serviceTypeId: '',
      description: '',
    });
    setAttachments([]);
  };

  const submitTicket = () => {
    const requiredFields = [
      { field: 'unitNumber', label: 'Unit Number' },
      { field: 'category', label: 'Category' },
      { field: 'priority', label: 'Priority' },
      { field: 'requestBy', label: 'Request By' },
      { field: 'serviceType', label: 'Service Type' },
    ];
    
    const missing = requiredFields.filter(({ field }) => !formData[field as keyof FormData]);
    
    if (missing.length > 0) {
      const missingFields = missing.map(({ label }) => label).join(', ');
      showCustomError('Validation Error', `Please fill the following required fields: ${missingFields}`);
      return;
    }

    // Log the form data with IDs for database storage
    console.log('💾 Ticket data to be saved:');
    console.log('Unit Number:', formData.unitNumber, '(ID:', formData.unitNumberId, ')');
    console.log('Category:', formData.category, '(ID:', formData.categoryId, ')');
    console.log('Priority:', formData.priority, '(ID:', formData.priorityId, ')');
    console.log('Request By:', formData.requestBy, '(ID:', formData.requestById, ')');
    console.log('Service Type:', formData.serviceType, '(ID:', formData.serviceTypeId, ')');
    console.log('Description:', formData.description);
    console.log('Attachments:', attachments.length);

    // Show success modal instead of alert
    showCustomSuccess('Success!', 'Help ticket has been submitted successfully!');
  };

  // Render dropdown field with radio buttons
  const renderDropdownField = (
    field: string,
    label: string,
    options: DropdownOption[],
    loading: boolean = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label} <Text style={styles.required}>*</Text>
      </Text>

      <TouchableOpacity 
        style={styles.dropdown} 
        onPress={() => !loading && options.length > 0 && toggleDropdown(field)}
        disabled={loading || options.length === 0}
      >
        <Text style={[styles.dropdownText, !formData[field as keyof FormData] && styles.placeholder]}>
          {formData[field as keyof FormData] || `Select ${label.toLowerCase()}`}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color="#666" />
        ) : (
          <Ionicons
            name={dropdownStates[field as keyof typeof dropdownStates] ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
          />
        )}
      </TouchableOpacity>

      {dropdownStates[field as keyof typeof dropdownStates] && !loading && (
        <Modal
          visible={dropdownStates[field as keyof typeof dropdownStates]}
          transparent
          animationType="fade"
          onRequestClose={() => toggleDropdown(field)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select {label}</Text>
                <TouchableOpacity onPress={() => toggleDropdown(field)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.radioOption}
                    onPress={() => selectOption(field, option.Text, option.Value)}
                  >
                    <View style={styles.radioButton}>
                      {formData[field as keyof FormData] === option.Text && (
                        <View style={styles.radioButtonSelected} />
                      )}
                    </View>
                    <Text style={styles.radioText}>{option.Text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => toggleDropdown(field)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Modals */}
      <SuccessModal />
      <ErrorModal />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Help Ticket</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ticket Details</Text>

            {renderDropdownField('unitNumber', 'Unit Number', unitNumberOptions)}
            {renderDropdownField('category', 'Category', categoryOptions, loadingStates.category)}
            {renderDropdownField('priority', 'Priority', priorityOptions, loadingStates.priority)}
            {renderDropdownField('requestBy', 'Request By', requestByOptions)}
            {renderDropdownField('serviceType', 'Service Type', serviceTypeOptions, loadingStates.serviceType)}

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Enter description..."
              placeholderTextColor="#999"
              value={formData.description}
              onChangeText={text => setFormData(prev => ({ ...prev, description: text }))}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.attachmentTitle}>
              Attach images/documents <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.attachmentContainer}>
              <TouchableOpacity style={styles.attachmentOption} onPress={takePhoto}>
                <Ionicons name="camera" size={30} color="#03C174" />
                <Text style={styles.attachmentText}>Take a photo</Text>
              </TouchableOpacity>

              <Text style={styles.orText}>or</Text>

              <TouchableOpacity style={styles.attachmentOption} onPress={uploadDocument}>
                <Ionicons name="cloud-upload" size={30} color="#03C174" />
                <Text style={styles.attachmentText}>upload documents</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.supportedText}>
              Supported: JPG, PNG, PDF (Max 5MB each)
            </Text>

            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((attachment, index) => (
                  <View key={index} style={styles.attachmentItem}>
                    <Text style={styles.attachmentName}>
                      {'name' in attachment
                        ? attachment.name
                        : attachment.uri.split('/').pop() || `Attachment ${index + 1}`}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Ionicons name="close-circle" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={submitTicket}>
              <LinearGradient
                colors={['#146070', '#03C174']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>Submit Ticket</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Modal Styles
const modalStyles = StyleSheet.create({
  // Success Modal Styles
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successContent: {
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
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },

  // Error Modal Styles
  errorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorContent: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 320,
  },
  errorGradient: {
    padding: 40,
    alignItems: 'center',
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  errorButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#03C174',
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
    position: 'relative',
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
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
    minHeight: 52,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  
  // Modal styles for radio button dropdowns
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  optionsList: {
    maxHeight: 400,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#03C174',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#03C174',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalCancelButton: {
    paddingVertical: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    color: '#333',
  },
  attachmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  attachmentContainer: {
    borderWidth: 2,
    borderColor: '#03C174',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  attachmentOption: {
    alignItems: 'center',
    marginVertical: 5,
  },
  attachmentText: {
    fontSize: 14,
    color: '#03C174',
    marginTop: 4,
    fontWeight: '500',
  },
  orText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 10,
  },
  supportedText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  attachmentsList: {
    marginTop: 16,
  },
  attachmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateHelpTicket;
