import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';

// API Configuration
const API_CONFIG = {
  url: 'https://applianceservicemgmt.dev2stage.in/api/rest/Invoke',
  authKey: '86A264E4-ECF8-4627-AF83-5512FE83DAE6',
  hostKey: '8ECB211D2',
};

interface DropdownOption {
  Text: string;
  Value: string;
}

interface VisitorFormData {
  photo: string | null;
  firstName: string;
  lastName: string;
  gender: string;
  genderValue: string;
  dateOfBirth: string;
  contactNumber: string;
  email: string;
  city: string;
  state: string;
  stateValue: string;
  country: string;
  countryValue: string;
  aadharNumber: string;
  panNumber: string;
  purposeOfVisit: string;
  hostName: string;
  hostContactNumber: string;
  hostUnit: string;
  vehicleNumber: string;
  visitDate: string;
  expectedDuration: string;
  emergencyContactName: string;
  emergencyRelation: string;
  emergencyRelationValue: string;
  emergencyContactNumber: string;
}

// Hardcoded Indian States and Union Territories
const INDIAN_STATES: DropdownOption[] = [
  { Text: "Andhra Pradesh", Value: "1" },
  { Text: "Arunachal Pradesh", Value: "2" },
  { Text: "Assam", Value: "3" },
  { Text: "Bihar", Value: "4" },
  { Text: "Chhattisgarh", Value: "5" },
  { Text: "Goa", Value: "6" },
  { Text: "Gujarat", Value: "7" },
  { Text: "Haryana", Value: "8" },
  { Text: "Himachal Pradesh", Value: "9" },
  { Text: "Jharkhand", Value: "10" },
  { Text: "Karnataka", Value: "11" },
  { Text: "Kerala", Value: "12" },
  { Text: "Madhya Pradesh", Value: "13" },
  { Text: "Maharashtra", Value: "14" },
  { Text: "Manipur", Value: "15" },
  { Text: "Meghalaya", Value: "16" },
  { Text: "Mizoram", Value: "17" },
  { Text: "Nagaland", Value: "18" },
  { Text: "Odisha", Value: "19" },
  { Text: "Punjab", Value: "20" },
  { Text: "Rajasthan", Value: "21" },
  { Text: "Sikkim", Value: "22" },
  { Text: "Tamil Nadu", Value: "23" },
  { Text: "Telangana", Value: "24" },
  { Text: "Tripura", Value: "25" },
  { Text: "Uttar Pradesh", Value: "26" },
  { Text: "Uttarakhand", Value: "27" },
  { Text: "West Bengal", Value: "28" },
  { Text: "Andaman and Nicobar Islands", Value: "29" },
  { Text: "Chandigarh", Value: "30" },
  { Text: "Dadra and Nagar Haveli and Daman and Diu", Value: "31" },
  { Text: "Delhi", Value: "32" },
  { Text: "Jammu and Kashmir", Value: "33" },
  { Text: "Ladakh", Value: "34" },
  { Text: "Lakshadweep", Value: "35" },
  { Text: "Puducherry", Value: "36" }
];

// Hardcoded Countries
const COUNTRIES: DropdownOption[] = [
  { Text: "India", Value: "1" },
  { Text: "Australia", Value: "2" }
];

const AddVisitor: React.FC = () => {
  const navigation = useNavigation<any>();
  
  const [formData, setFormData] = useState<VisitorFormData>({
    photo: null,
    firstName: '',
    lastName: '',
    gender: '',
    genderValue: '',
    dateOfBirth: '',
    contactNumber: '',
    email: '',
    city: '',
    state: '',
    stateValue: '',
    country: '',
    countryValue: '',
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
    emergencyRelationValue: '',
    emergencyContactNumber: '',
  });

  const [errors, setErrors] = useState<Partial<VisitorFormData>>({});
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [genderOptions, setGenderOptions] = useState<DropdownOption[]>([]);
  const [relationOptions, setRelationOptions] = useState<DropdownOption[]>([]);
  const [stateOptions] = useState<DropdownOption[]>(INDIAN_STATES);
  const [countryOptions] = useState<DropdownOption[]>(COUNTRIES);
  const [loadingGender, setLoadingGender] = useState(false);
  const [loadingRelations, setLoadingRelations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAnimation] = useState(new Animated.Value(0));
  const [errorAnimation] = useState(new Animated.Value(0));
  const [infoAnimation] = useState(new Animated.Value(0));
  const [resetAnimation] = useState(new Animated.Value(0));
  const [modalData, setModalData] = useState({ title: '', message: '' });

  // Custom Success Modal with Auto-Hide Animation
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
        delay: 4000, // Extended display time
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      console.log('Visitor data:', formData);
      // Reset form data
      setFormData({
        photo: null,
        firstName: '',
        lastName: '',
        gender: '',
        genderValue: '',
        dateOfBirth: '',
        contactNumber: '',
        email: '',
        city: '',
        state: '',
        stateValue: '',
        country: '',
        countryValue: '',
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
        emergencyRelationValue: '',
        emergencyContactNumber: '',
      });
      setErrors({});
      navigation.goBack();
    });
  };

  // Custom Error Modal with Animation
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

  // Custom Info Modal with Animation
  const showCustomInfo = (title: string, message: string) => {
    setModalData({ title, message });
    setShowInfoModal(true);
    Animated.sequence([
      Animated.timing(infoAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Custom Reset Confirmation Modal
  const showResetConfirmation = () => {
    setShowResetModal(true);
    Animated.sequence([
      Animated.timing(resetAnimation, {
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
              Visitor "{formData.firstName} {formData.lastName}" has been added successfully
            </Text>
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
      <View style={styles.errorModalOverlay}>
        <Animated.View
          style={[
            styles.errorModalContent,
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
            style={styles.errorGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.errorIconContainer}>
              <Ionicons name="close-circle" size={80} color="white" />
            </View>
            <Text style={styles.errorTitle}>{modalData.title}</Text>
            <Text style={styles.errorMessage}>{modalData.message}</Text>
            <TouchableOpacity
              style={styles.errorButton}
              onPress={() => {
                Animated.timing(errorAnimation, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                  setShowErrorModal(false);
                });
              }}
            >
              <Text style={styles.errorButtonText}>OK</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );

  // Info Modal Component
  const InfoModal = () => (
    <Modal
      visible={showInfoModal}
      transparent
      animationType="fade"
      onRequestClose={() => {
        Animated.timing(infoAnimation, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setShowInfoModal(false);
        });
      }}
    >
      <View style={styles.infoModalOverlay}>
        <Animated.View
          style={[
            styles.infoModalContent,
            {
              opacity: infoAnimation,
              transform: [
                {
                  scale: infoAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#3498db', '#2980b9']}
            style={styles.infoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={80} color="white" />
            </View>
            <Text style={styles.infoTitle}>{modalData.title}</Text>
            <Text style={styles.infoMessage}>{modalData.message}</Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => {
                Animated.timing(infoAnimation, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                  setShowInfoModal(false);
                });
              }}
            >
              <Text style={styles.infoButtonText}>OK</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );

  // Reset Confirmation Modal Component
  const ResetModal = () => (
    <Modal
      visible={showResetModal}
      transparent
      animationType="fade"
      onRequestClose={() => {
        Animated.timing(resetAnimation, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setShowResetModal(false);
        });
      }}
    >
      <View style={styles.resetModalOverlay}>
        <Animated.View
          style={[
            styles.resetModalContent,
            {
              opacity: resetAnimation,
              transform: [
                {
                  scale: resetAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#f39c12', '#e67e22']}
            style={styles.resetGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.resetIconContainer}>
              <Ionicons name="warning" size={80} color="white" />
            </View>
            <Text style={styles.resetTitle}>Reset Form</Text>
            <Text style={styles.resetMessage}>
              Are you sure you want to reset all fields? This action cannot be undone.
            </Text>
            <View style={styles.resetButtonContainer}>
              <TouchableOpacity
                style={[styles.resetModalButton, styles.cancelButton]}
                onPress={() => {
                  Animated.timing(resetAnimation, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                    setShowResetModal(false);
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resetModalButton, styles.confirmButton]}
                onPress={() => {
                  Animated.timing(resetAnimation, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                    setShowResetModal(false);
                    // Reset form
                    setFormData({
                      photo: null,
                      firstName: '',
                      lastName: '',
                      gender: '',
                      genderValue: '',
                      dateOfBirth: '',
                      contactNumber: '',
                      email: '',
                      city: '',
                      state: '',
                      stateValue: '',
                      country: '',
                      countryValue: '',
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
                      emergencyRelationValue: '',
                      emergencyContactNumber: '',
                    });
                    setErrors({});
                  });
                }}
              >
                <Text style={styles.confirmButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );

  // fetch dropdown options (only for gender and relations now)
  const fetchDropdownOptions = async (groupId: string): Promise<DropdownOption[]> => {
    try {
      const valuesString = `0,'RD_TBL_Reference_List','Reference_List_Group_Id','${groupId}','Reference_List_Name','Reference_List_Id'`;
      const requestBody = new URLSearchParams({
        AuthKey: API_CONFIG.authKey,
        HostKey: API_CONFIG.hostKey,
        Object: "CMN_SP_Generic_DropdownList_Get",
        Values: valuesString,
      }).toString();

      const response = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: requestBody,
      });

      const responseText = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${responseText}`);

      const result = JSON.parse(responseText);
      if (result?.Data && Array.isArray(result.Data)) return result.Data;
      return [];
    } catch (error: any) {
      console.error('Dropdown API Error:', error);
      showCustomError('API Error', `Failed to fetch dropdown options: ${error.message || error}`);
      return [];
    }
  };

  // Convert image to base64
  const convertImageToBase64 = async (uri: string): Promise<string | null> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  // Utility function to escape SQL strings
  const escapeSQLString = (str: string): string => {
    if (!str) return '';
    return str.replace(/'/g, "''");
  };

  // Get current date and time in required format
  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().slice(0, 5); // HH:MM
    return { date, time };
  };

  // Submit visitor data to API with correct parameter mapping
  const submitVisitorData = async (): Promise<boolean> => {
    try {
      setIsSubmitting(true);

      // Convert photo to base64 if exists
      let photoBase64 = null;
      if (formData.photo) {
        photoBase64 = await convertImageToBase64(formData.photo);
        // Limit base64 size to prevent server errors
        if (photoBase64 && photoBase64.length > 1500000) {
          showCustomError('Error', 'Image size too large. Please select a smaller image.');
          return false;
        }
      }

      // Get current date and time for check-in
      const { date: currentDate, time: currentTime } = getCurrentDateTime();

      // Prepare visitor data
      const visitorName = escapeSQLString(`${formData.firstName.trim()} ${formData.lastName.trim()}`).trim();
      const checkinDate = formData.visitDate || currentDate;

      // Create the values string with exact parameter mapping for VIM_SP_Visitor_Add
      const parameters = [
        '7', // 1. @p_Society_Id - hardcoded
        '280', // 2. @p_Unit_Id - hardcoded  
        formData.hostUnit ? `'${escapeSQLString(formData.hostUnit.trim())}'` : 'NULL', // 3. @p_Unit_Name
        `'${visitorName}'`, // 4. @p_Visitor_Name
        `'${formData.contactNumber.trim()}'`, // 5. @p_Visitor_Mobile_No
        `'${escapeSQLString(formData.email.trim())}'`, // 6. @p_Visitor_Email
        'NULL', // 7. @p_Visitor_Pass_No
        formData.vehicleNumber ? `'${escapeSQLString(formData.vehicleNumber.trim())}'` : 'NULL', // 8. @p_Vehicle_Registraion_No
        'NULL', // 9. @p_Visitor_Address
        `'${escapeSQLString(formData.city.trim())}'`, // 10. @p_Visitor_City
        formData.stateValue ? `${formData.stateValue}` : 'NULL', // 11. @p_Visitor_State (ID)
        formData.countryValue ? `${formData.countryValue}` : 'NULL', // 12. @p_Visitor_Country (ID)
        'NULL', // 13. @p_Whom_To_Meet_Id
        `'${escapeSQLString(formData.hostName.trim())}'`, // 14. @p_Whom_To_Meet_Name
        `'${escapeSQLString(formData.purposeOfVisit.trim())}'`, // 15. @p_Visiting_Purpose
        'NULL', // 16. @p_Vehicle_Type (can be added later if needed)
        'NULL', // 17. @p_Vehicle_Type_Name
        'NULL', // 18. @p_Make_Model
        'NULL', // 19. @p_Office_Security_Staff_Id
        'NULL', // 20. @p_Security_Personal_Name
        `'${checkinDate}'`, // 21. @p_Checkin_Date
        `'${currentTime}'`, // 22. @p_Checkin_Time
        'NULL', // 23. @p_Checkout_Date
        'NULL', // 24. @p_Checkout_Time
        'NULL', // 25. @p_Pin_Code
        'NULL', // 26. @p_Attribute1 
        'NULL', // 27. @p_Attribute2
        formData.aadharNumber ? `'${formData.aadharNumber.trim()}'` : 'NULL', // 28. @p_Attribute3 - Aadhar
        formData.genderValue ? `'${formData.genderValue}'` : 'NULL', // 29. @p_Attribute4 - Gender
        formData.panNumber ? `'${escapeSQLString(formData.panNumber.trim())}'` : 'NULL', // 30. @p_Attribute5 - PAN
        formData.dateOfBirth ? `'${formData.dateOfBirth.trim()}'` : 'NULL', // 31. @p_Attribute6 - DOB
        formData.hostContactNumber ? `'${formData.hostContactNumber.trim()}'` : 'NULL', // 32. @p_Attribute7 - Host Contact
        formData.expectedDuration ? `'${escapeSQLString(formData.expectedDuration.trim())}'` : 'NULL', // 33. @p_Attribute8 - Duration
        formData.emergencyContactName ? `'${escapeSQLString(formData.emergencyContactName.trim())}'` : 'NULL', // 34. @p_Attribute9 - Emergency Contact
        formData.emergencyContactNumber ? `'${formData.emergencyContactNumber.trim()}'` : 'NULL', // 35. @p_Attribute10 - Emergency Number
        photoBase64 ? `'${photoBase64}'` : 'NULL', // 36. @p_Visitor_Photo
        '1', // 37. @p_Created_By - hardcoded user ID
      ];

      const valuesString = parameters.join(',');

      const requestBody = new URLSearchParams({
        AuthKey: API_CONFIG.authKey,
        HostKey: API_CONFIG.hostKey,
        Object: "VIM_SP_Visitor_Add",
        Values: valuesString,
      }).toString();

      console.log(' Submitting visitor to database...');
      console.log(' Visitor:', visitorName);
      console.log(' Contact:', formData.contactNumber);
      console.log(' Email:', formData.email);
      console.log(' City:', formData.city);
      console.log(' State:', formData.state, `(ID: ${formData.stateValue})`);
      console.log(' Country:', formData.country, `(ID: ${formData.countryValue})`);
      console.log(' Host:', formData.hostName);
      console.log('Unit:', formData.hostUnit);
      console.log('Purpose:', formData.purposeOfVisit);

      const response = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: requestBody,
      });

      const responseText = await response.text();
      console.log('📡 API Response Status:', response.status);
      console.log('📄 API Response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        
        // If response can't be parsed but HTTP status is OK, check for success patterns
        if (response.ok && (
          responseText.toLowerCase().includes('success') || 
          responseText.toLowerCase().includes('inserted') ||
          responseText.toLowerCase().includes('saved') ||
          responseText.includes('"Success":true') ||
          responseText === '1'
        )) {
          console.log('✅ Success detected from response content');
          return true;
        }
        throw new Error('Invalid response format from server');
      }
      
      // Check for various success indicators
      const isSuccess = 
        result.Success === true ||
        result.success === true ||
        (typeof result.Message === 'string' && result.Message.toLowerCase().includes('success')) ||
        (typeof result.message === 'string' && result.message.toLowerCase().includes('success')) ||
        result.Status === "Success" ||
        result.status === "success" ||
        (result.Data && Array.isArray(result.Data)) ||
        result.ReturnValue === 0 ||
        result.returnValue === 0 ||
        result.VisitorId ||
        result.visitor_id ||
        result.Id ||
        result.id;

      if (isSuccess) {
        console.log('✅ Visitor successfully saved to database!');
        return true;
      } else {
        console.log('❌ Success not detected. Full response:', JSON.stringify(result, null, 2));
        
        const errorMessage = result.Message || 
                           result.message || 
                           result.Error || 
                           result.error || 
                           result.ErrorMessage ||
                           result.errorMessage ||
                           'Failed to save visitor to database';
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('💥 Database Save Error:', error);
      showCustomError(
        'Database Error', 
        `Failed to save visitor to database:\n${error.message || error}\n\nPlease try again.`
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const loadDropdownOptions = async () => {
      // Load Gender options from API
      setLoadingGender(true);
      const genderData = await fetchDropdownOptions('4');
      setGenderOptions(genderData);
      setLoadingGender(false);

      // Load Relation options from API
      setLoadingRelations(true);
      const relationData = await fetchDropdownOptions('8');
      setRelationOptions(relationData);
      setLoadingRelations(false);

      // States and Countries are already loaded from hardcoded data
      console.log('✅ Loaded', INDIAN_STATES.length, 'Indian states');
      console.log('✅ Loaded', COUNTRIES.length, 'countries');
    };

    loadDropdownOptions();
  }, []);

  // updateFormData - avoids setting state if value unchanged
  const updateFormData = useCallback((key: keyof VisitorFormData, value: string | null) => {
    setFormData(prev => {
      const newVal = value ?? '';
      if (prev[key] === newVal) return prev;
      return { ...prev, [key]: newVal } as VisitorFormData;
    });
    // clear any error for this field
    setErrors(prev => {
      if (!prev[key]) return prev;
      const newErr = { ...prev };
      delete newErr[key];
      return newErr;
    });
  }, []);

  // Photo handling
  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showCustomError('Permission needed', 'Please grant camera roll permissions to upload photo.');
      return;
    }
    setShowPhotoModal(true);
  };

  const openCamera = async () => {
    setShowPhotoModal(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showCustomError('Permission needed', 'Please grant camera permissions to take photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled) {
      updateFormData('photo', result.assets?.[0]?.uri ?? null);
    }
  };

  const openGallery = async () => {
    setShowPhotoModal(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled) {
      updateFormData('photo', result.assets?.[0]?.uri ?? null);
    }
  };

  const pickDocument = async () => {
    setShowPhotoModal(false);

    try {
      // Cast result to any to avoid TS errors
      const result: any = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      // Check if user picked a document successfully
      if (result.type === 'success') {
        // size may be undefined, so we check safely
        if (result.size && result.size > 5000000) {
          showCustomError('Error', 'File size too large. Please select a file smaller than 5MB.');
          return;
        }

        // Use the file URI
        updateFormData('photo', result.uri);
      }
    } catch (error) {
      showCustomError('Error', 'Failed to pick document');
    }
  };

  // Enhanced validation with new required fields
  const validateForm = (): boolean => {
    const newErrors: Partial<VisitorFormData> = {};

    // Required field validations
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.stateValue.trim()) newErrors.state = 'State is required';
    if (!formData.countryValue.trim()) newErrors.country = 'Country is required';
    if (!formData.purposeOfVisit.trim()) newErrors.purposeOfVisit = 'Purpose of visit is required';
    if (!formData.hostName.trim()) newErrors.hostName = 'Host name is required';
    
    if (!formData.genderValue.trim()) newErrors.gender = 'Gender is required';

    // Format validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) newErrors.email = 'Please enter a valid email';

    const phoneRegex = /^[0-9]{10}$/;
    if (formData.contactNumber && !phoneRegex.test(formData.contactNumber.replace(/\D/g, ''))) {
      newErrors.contactNumber = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Updated handleSave function - directly saves without confirmation
  const handleSave = async () => {
    if (!validateForm()) {
      showCustomError('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    const success = await submitVisitorData();
    if (success) {
      showSuccessAlert();
    }
  };

  // Updated handleReset function - shows custom confirmation
  const handleReset = () => {
    showResetConfirmation();
  };

  // FormField component that keeps local state while typing
  const FormField = React.memo((props: {
    label: string;
    placeholder?: string;
    required?: boolean;
    multiline?: boolean;
    keyboardType?: any;
    value: string;
    error?: string | undefined;
    onCommit: (value: string) => void;
  }) => {
    const { label, placeholder, required = false, multiline = false, keyboardType = 'default', value, error, onCommit } = props;
    const [local, setLocal] = useState<string>(value ?? '');
    
    useEffect(() => {
      setLocal(value ?? '');
    }, [value]);

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <TextInput
          style={[styles.input, multiline && styles.multilineInput, error && styles.inputError]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={local}
          onChangeText={setLocal}
          onBlur={() => onCommit(local)}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          keyboardType={keyboardType}
          autoCorrect={false}
          spellCheck={false}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  });

  // Gender dropdown with modal
  const renderGenderDropdown = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        Gender <Text style={styles.required}>*</Text>
      </Text>
      <TouchableOpacity
        style={[styles.dropdown, errors.gender && styles.inputError]}
        onPress={() => {
          if (loadingGender) {
            showCustomInfo('Loading', 'Please wait while gender options are loading...');
            return;
          }
          // if (genderOptions.length === 0) {
          //   showCustomError('Error', 'No gender options available. Please try again later.');
          //   return;
          // }
          setShowGenderModal(true);
        }}
        disabled={loadingGender}
      >
        <Text style={[styles.dropdownText, !formData.gender && styles.placeholderText]}>
          {formData.gender || 'Select gender'}
        </Text>
        {loadingGender ? <ActivityIndicator size="small" /> : <Ionicons name="chevron-down" size={20} color="#666" />}
      </TouchableOpacity>
      {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
    </View>
  );

  // State dropdown with modal (using hardcoded data)
  const renderStateDropdown = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        State <Text style={styles.required}>*</Text>
      </Text>
      <TouchableOpacity
        style={[styles.dropdown, errors.state && styles.inputError]}
        onPress={() => setShowStateModal(true)}
      >
        <Text style={[styles.dropdownText, !formData.state && styles.placeholderText]}>
          {formData.state || 'Select state'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
    </View>
  );

  // Country dropdown with modal (using hardcoded data)
  const renderCountryDropdown = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        Country <Text style={styles.required}>*</Text>
      </Text>
      <TouchableOpacity
        style={[styles.dropdown, errors.country && styles.inputError]}
        onPress={() => setShowCountryModal(true)}
      >
        <Text style={[styles.dropdownText, !formData.country && styles.placeholderText]}>
          {formData.country || 'Select country'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
    </View>
  );

  // Relation dropdown (opens modal)
  const renderRelationDropdown = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Relation</Text>
      <TouchableOpacity
        style={[styles.dropdown, errors.emergencyRelation && styles.inputError]}
        onPress={() => {
          if (loadingRelations) {
            showCustomInfo('Loading', 'Please wait while relation options are loading...');
            return;
          }
          if (relationOptions.length === 0) {
            showCustomError('Error', 'No relation options available. Please try again later.');
            return;
          }
          setShowRelationModal(true);
        }}
        disabled={loadingRelations}
      >
        <Text style={[styles.dropdownText, !formData.emergencyRelation && styles.placeholderText]}>
          {formData.emergencyRelation || 'Select relation'}
        </Text>
        {loadingRelations ? <ActivityIndicator size="small" /> : <Ionicons name="chevron-down" size={20} color="#666" />}
      </TouchableOpacity>
      {errors.emergencyRelation && <Text style={styles.errorText}>{errors.emergencyRelation}</Text>}
    </View>
  );

  // Photo modal
  const PhotoSelectionModal = React.memo(() => (
    <Modal visible={showPhotoModal} animationType="fade" transparent onRequestClose={() => setShowPhotoModal(false)}>
      <View style={styles.photoModalOverlay}>
        <View style={styles.photoModalContainer}>
          <Text style={styles.photoModalTitle}>Select Photo Option</Text>
          <View style={styles.photoOptionsContainer}>
            <TouchableOpacity style={styles.photoOption} onPress={openCamera}>
              <View style={styles.photoOptionIconContainer}>
                <MaterialIcons name="camera-alt" size={24} color="#146070" />
              </View>
              <Text style={styles.photoOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoOption} onPress={openGallery}>
              <View style={styles.photoOptionIconContainer}>
                <MaterialIcons name="photo-library" size={24} color="#146070" />
              </View>
              <Text style={styles.photoOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoOption} onPress={pickDocument}>
              <View style={styles.photoOptionIconContainer}>
                <MaterialIcons name="insert-drive-file" size={24} color="#146070" />
              </View>
              <Text style={styles.photoOptionText}>Pick Image File</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.photoCancelButton} onPress={() => setShowPhotoModal(false)}>
            <Text style={styles.photoCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  ));

  // Gender Modal
  const GenderModal = React.memo(() => (
    <Modal visible={showGenderModal} animationType="slide" transparent onRequestClose={() => setShowGenderModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            <TouchableOpacity onPress={() => setShowGenderModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {loadingGender ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Loading genders...</Text>
              </View>
            ) : genderOptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No genders available</Text>
              </View>
            ) : (
              genderOptions.map(option => (
                <TouchableOpacity
                  key={option.Value}
                  style={styles.radioButtonContainer}
                  onPress={() => {
                    updateFormData('gender', option.Text);
                    updateFormData('genderValue', option.Value);
                    setShowGenderModal(false);
                  }}
                >
                  <View style={styles.radioButton}>
                    {formData.genderValue === option.Value && <View style={styles.radioButtonSelected} />}
                  </View>
                  <Text style={styles.radioButtonLabel}>{option.Text}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowGenderModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ));

  // State Modal (using hardcoded Indian states)
  const StateModal = React.memo(() => (
    <Modal visible={showStateModal} animationType="slide" transparent onRequestClose={() => setShowStateModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select State</Text>
            <TouchableOpacity onPress={() => setShowStateModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {stateOptions.map(option => (
              <TouchableOpacity
                key={option.Value}
                style={styles.radioButtonContainer}
                onPress={() => {
                  updateFormData('state', option.Text);
                  updateFormData('stateValue', option.Value);
                  setShowStateModal(false);
                }}
              >
                <View style={styles.radioButton}>
                  {formData.stateValue === option.Value && <View style={styles.radioButtonSelected} />}
                </View>
                <Text style={styles.radioButtonLabel}>{option.Text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowStateModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ));

  // Country Modal (using hardcoded countries)
  const CountryModal = React.memo(() => (
    <Modal visible={showCountryModal} animationType="slide" transparent onRequestClose={() => setShowCountryModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity onPress={() => setShowCountryModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {countryOptions.map(option => (
              <TouchableOpacity
                key={option.Value}
                style={styles.radioButtonContainer}
                onPress={() => {
                  updateFormData('country', option.Text);
                  updateFormData('countryValue', option.Value);
                  setShowCountryModal(false);
                }}
              >
                <View style={styles.radioButton}>
                  {formData.countryValue === option.Value && <View style={styles.radioButtonSelected} />}
                </View>
                <Text style={styles.radioButtonLabel}>{option.Text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowCountryModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ));

  const RelationModal = React.memo(() => (
    <Modal visible={showRelationModal} animationType="slide" transparent onRequestClose={() => setShowRelationModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Relation</Text>
            <TouchableOpacity onPress={() => setShowRelationModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {loadingRelations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Loading relations...</Text>
              </View>
            ) : relationOptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No relations available</Text>
              </View>
            ) : (
              relationOptions.map(option => (
                <TouchableOpacity
                  key={option.Value}
                  style={styles.radioButtonContainer}
                  onPress={() => {
                    updateFormData('emergencyRelation', option.Text);
                    updateFormData('emergencyRelationValue', option.Value);
                    setShowRelationModal(false);
                  }}
                >
                  <View style={styles.radioButton}>
                    {formData.emergencyRelationValue === option.Value && <View style={styles.radioButtonSelected} />}
                  </View>
                  <Text style={styles.radioButtonLabel}>{option.Text}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowRelationModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ));

  const SectionCard = React.memo(({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  ));

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading Overlay */}
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingModal}>
            <ActivityIndicator size="large" color="#146070" />
            <Text style={styles.loadingModalText}>Saving...</Text>
            <Text style={styles.loadingModalSubText}>Please wait</Text>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Visitor</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <SectionCard title="Visitor Photo">
            <View style={styles.photoContainer}>
              <TouchableOpacity style={styles.photoUpload} onPress={handleImagePicker}>
                {formData.photo ? <Image source={{ uri: formData.photo }} style={styles.uploadedImage} /> : (
                  <>
                    <MaterialIcons name="camera-alt" size={40} color="#03C174" />
                    <Text style={styles.uploadText}>Upload Photo</Text>
                    <Text style={styles.uploadSubtext}>Supported: JPG, PNG (Max 5MB)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SectionCard>

          <SectionCard title="Personal Information">
            <FormField
              label="First Name"
              required
              placeholder="Enter first name"
              value={formData.firstName}
              onCommit={(v) => updateFormData('firstName', v)}
              error={errors.firstName}
            />
            <FormField
              label="Last Name"
              required
              placeholder="Enter last name"
              value={formData.lastName}
              onCommit={(v) => updateFormData('lastName', v)}
              error={errors.lastName}
            />
            {renderGenderDropdown()}
            <FormField
              label="Date of Birth"
              placeholder="dd-mm-yyyy"
              value={formData.dateOfBirth}
              onCommit={(v) => updateFormData('dateOfBirth', v)}
              error={errors.dateOfBirth}
            />
            <FormField
              label="Contact Number"
              required
              placeholder="Enter 10-digit mobile number"
              value={formData.contactNumber}
              onCommit={(v) => updateFormData('contactNumber', v)}
              keyboardType="phone-pad"
              error={errors.contactNumber}
            />
            <FormField
              label="Email"
              required
              placeholder="Enter email address"
              value={formData.email}
              onCommit={(v) => updateFormData('email', v)}
              keyboardType="email-address"
              error={errors.email}
            />
          </SectionCard>

          <SectionCard title="Address Information">
            <FormField
              label="City"
              required
              placeholder="Enter city name"
              value={formData.city}
              onCommit={(v) => updateFormData('city', v)}
              error={errors.city}
            />
            {renderStateDropdown()}
            {renderCountryDropdown()}
          </SectionCard>

          <SectionCard title="Identity Documents">
            <FormField 
              label="Aadhar Number" 
              placeholder="1234 5678 9012" 
              value={formData.aadharNumber} 
              onCommit={(v) => updateFormData('aadharNumber', v)} 
              keyboardType="numeric" 
              error={errors.aadharNumber} 
            />
            <FormField 
              label="PAN Number" 
              placeholder="ABCDE1234F" 
              value={formData.panNumber} 
              onCommit={(v) => updateFormData('panNumber', v.toUpperCase())} 
              error={errors.panNumber} 
            />
          </SectionCard>

          <SectionCard title="Visit Details">
            <FormField 
              label="Purpose of Visit" 
              required 
              placeholder="Enter purpose of visit" 
              value={formData.purposeOfVisit} 
              onCommit={(v) => updateFormData('purposeOfVisit', v)} 
              error={errors.purposeOfVisit} 
            />
            <FormField 
              label="Host Name" 
              required 
              placeholder="Enter host name" 
              value={formData.hostName} 
              onCommit={(v) => updateFormData('hostName', v)} 
              error={errors.hostName} 
            />
            <FormField 
              label="Host Contact Number" 
              placeholder="Enter host mobile number" 
              value={formData.hostContactNumber} 
              onCommit={(v) => updateFormData('hostContactNumber', v)} 
              keyboardType="phone-pad" 
              error={errors.hostContactNumber} 
            />
            <FormField 
              label="Host Unit" 
              required 
              placeholder="e.g. A-101, B-205, E305" 
              value={formData.hostUnit} 
              onCommit={(v) => updateFormData('hostUnit', v)} 
              error={errors.hostUnit} 
            />
            <FormField 
              label="Vehicle Number" 
              placeholder="Enter vehicle number" 
              value={formData.vehicleNumber} 
              onCommit={(v) => updateFormData('vehicleNumber', v.toUpperCase())} 
            />
            <FormField 
              label="Visit Date" 
              placeholder="yyyy-mm-dd (leave empty for today)" 
              value={formData.visitDate} 
              onCommit={(v) => updateFormData('visitDate', v)} 
            />
            <FormField 
              label="Expected Duration" 
              placeholder="e.g. 2 hours, Half day" 
              value={formData.expectedDuration} 
              onCommit={(v) => updateFormData('expectedDuration', v)} 
            />
          </SectionCard>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.resetButton, isSubmitting && styles.disabledButton]} 
              onPress={handleReset}
              disabled={isSubmitting}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, isSubmitting && styles.disabledButton]} 
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <LinearGradient colors={['#146070', '#03C174']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveButtonGradient}>
                <Text style={styles.saveButtonText}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PhotoSelectionModal />
      <GenderModal />
      <StateModal />
      <CountryModal />
      <RelationModal />
      
      {/* Custom Modals */}
      <SuccessModal />
      <ErrorModal />
      <InfoModal />
      <ResetModal />
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
    color: '#0b8e5aff',
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  
  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
  },
  loadingModalText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingModalSubText: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
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

  // Error Modal Styles
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorModalContent: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 300,
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

  // Info Modal Styles
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  infoModalContent: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 300,
  },
  infoGradient: {
    padding: 40,
    alignItems: 'center',
  },
  infoIconContainer: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoMessage: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 20,
  },
  infoButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  infoButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },

  // Reset Modal Styles
  resetModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  resetModalContent: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 320,
  },
  resetGradient: {
    padding: 40,
    alignItems: 'center',
  },
  resetIconContainer: {
    marginBottom: 20,
  },
  resetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  resetMessage: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 30,
  },
  resetButtonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  resetModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'white',
  },
  confirmButton: {
    backgroundColor: 'white',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#f39c12',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Photo Selection Modal Styles
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalContainer: {
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
  photoModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  photoOptionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  photoOptionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  photoOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  photoCancelButton: {
    paddingVertical: 14,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    alignItems: 'center',
  },
  photoCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
  },
  
  // Radio Button Modal Styles
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
  modalContent: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  
  // Radio Button Styles
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
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
  radioButtonLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  
  // Loading and empty states
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default AddVisitor;
