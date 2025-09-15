import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { useNavigation } from '@react-navigation/native';

const statesOfIndia = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli', 'Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const AddOccupant = () => {
  const navigation = useNavigation();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    contactNumber: '',
    email: '',
    aadharNumber: '',
    panNumber: '',
    country: '',
    state: '',
    pinCode: '',
    address: '',
    unit: '',
    occupantType: '',
    effectiveStartDate: '',
    relationWithPrimary: '',
    isPrimaryOccupant: 'No',
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [showDOBPicker, setShowDOBPicker] = useState(false);
  const [showEffectiveDatePicker, setShowEffectiveDatePicker] = useState(false);

  type FormCardProps = {
    title?: string;
    children?: ReactNode;
  };

  type InputFieldProps = {
    label: string;
    required?: boolean;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  };

  type PickerFieldProps = {
    label: string;
    required?: boolean;
    selectedValue: string;
    onValueChange: (value: string, index: number) => void;
    items: string[];
    placeholder: string;
  };

  type RadioButtonProps = {
    label: string;
    selected: boolean;
    onPress: () => void;
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    let day: string = d.getDate().toString().padStart(2, "0");
    let month: string = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const onDOBChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString("en-GB");
      setFormData(prev => ({ ...prev, dateOfBirth: formattedDate }));
    }
    setShowDOBPicker(false);
  };

  const onEffectiveDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString("en-GB");
      setFormData(prev => ({ ...prev, effectiveStartDate: formattedDate }));
    }
    setShowEffectiveDatePicker(false);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Permission to access camera roll is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Permission to access camera is required!');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Photo',
      'Choose from where you want to select a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = () => {
    console.log('Form Data:', formData);
    console.log('Profile Image:', profileImage);
    Alert.alert('Success', 'Occupant details saved successfully!');
  };

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
      contactNumber: '',
      email: '',
      aadharNumber: '',
      panNumber: '',
      country: '',
      state: '',
      pinCode: '',
      address: '',
      unit: '',
      occupantType: '',
      effectiveStartDate: '',
      relationWithPrimary: '',
      isPrimaryOccupant: 'No',
    });
    setProfileImage(null);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Reusable components
  const FormCard: React.FC<FormCardProps> = ({ title, children }) => (
    <View style={styles.card}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );

  const InputField: React.FC<InputFieldProps> = ({
    label,
    required = false,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        maxLength={keyboardType === "phone-pad" ? 10 : undefined}
        placeholderTextColor="#999"
        autoCorrect={false}
        autoComplete="off"
        textContentType="none"
      />
    </View>
  );

  const PickerField: React.FC<PickerFieldProps> = ({
    label,
    required = false,
    selectedValue,
    onValueChange,
    items,
    placeholder,
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          style={styles.picker}
          onValueChange={onValueChange}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label={placeholder} value="" style={styles.pickerItem} />
          {items.map((item, i) => (
            <Picker.Item key={i} label={item} value={item} style={styles.pickerItem} />
          ))}
        </Picker>
      </View>
    </View>
  );

  const RadioButton: React.FC<RadioButtonProps> = ({ label, selected, onPress }) => (
    <TouchableOpacity style={styles.radioContainer} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.radioCircle, selected && styles.radioSelected]} />
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled'>
      {/* Updated Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#00A86B" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="person-add" size={24} color="#00A86B" />
          <Text style={styles.headerTitle}>Add Occupant</Text>
        </View>
      </View>

      <FormCard>
        <Text style={styles.cardTitle}>Upload Photo<Text style={styles.required}>*</Text></Text>
        <TouchableOpacity style={styles.uploadContainer} onPress={showImagePicker}>
          {profileImage ? <Image source={{ uri: profileImage }} style={styles.uploadedImage} /> : (
            <>
              <Ionicons name="camera" size={40} color="#00A86B" />
              <Text style={styles.uploadText}>Upload Photo</Text>
              <Text style={styles.uploadSubtext}>Accepted file types: PNG, JPG, JPEG</Text>
            </>
          )}
        </TouchableOpacity>
      </FormCard>

      <FormCard title="Personal Information">
        <InputField 
          label="First Name" 
          required 
          value={formData.firstName} 
          onChangeText={(text) => updateFormData('firstName', text)} 
          placeholder="John" 
        />
        <InputField 
          label="Last Name" 
          required 
          value={formData.lastName} 
          onChangeText={(text) => updateFormData('lastName', text)} 
          placeholder="Doe" 
        />
        <PickerField 
          label="Gender" 
          required 
          selectedValue={formData.gender} 
          onValueChange={(value) => updateFormData('gender', value)} 
          placeholder="Select Gender" 
          items={['Male', 'Female', 'Other']} 
        />

        {/* Date of Birth with picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity onPress={() => setShowDOBPicker(true)} activeOpacity={0.7}>
            <View style={[styles.input, styles.dateInput]}>
              <Text style={[styles.dateText, { color: formData.dateOfBirth ? '#333' : '#999' }]}>
                {formData.dateOfBirth || 'dd-mm-yyyy'}
              </Text>
              <Ionicons name="calendar" size={22} color="#00A86B" />
            </View>
          </TouchableOpacity>
          {showDOBPicker && <DateTimePicker
            value={formData.dateOfBirth ? new Date(formData.dateOfBirth.split('-').reverse().join('-')) : new Date(2000,0,1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDOBChange}
            maximumDate={new Date()}
          />}
        </View>

        <InputField 
          label="Contact Number" 
          required 
          value={formData.contactNumber} 
          onChangeText={(text) => updateFormData('contactNumber', text)} 
          placeholder="Phone No.." 
          keyboardType="phone-pad" 
        />
        <InputField 
          label="Email" 
          required 
          value={formData.email} 
          onChangeText={(text) => updateFormData('email', text)} 
          placeholder="example@mail.com" 
          keyboardType="email-address" 
        />
        <InputField 
          label="Aadhar Number" 
          required 
          value={formData.aadharNumber} 
          onChangeText={(text) => updateFormData('aadharNumber', text)} 
          placeholder="1234 5678 9101" 
          keyboardType="numeric" 
        />
        <InputField 
          label="PAN Number" 
          required 
          value={formData.panNumber} 
          onChangeText={(text) => updateFormData('panNumber', text)} 
          placeholder="ABCDE1234F" 
        />
      </FormCard>

      <FormCard title="Address Details">
        <PickerField 
          label="Country" 
          required 
          selectedValue={formData.country} 
          onValueChange={(value) => updateFormData('country', value)} 
          placeholder="Select Country" 
          items={['India', 'USA', 'UK', 'Canada']} 
        />
        <PickerField 
          label="State" 
          required 
          selectedValue={formData.state} 
          onValueChange={(value) => updateFormData('state', value)} 
          placeholder="Select State" 
          items={statesOfIndia} 
        />
        <InputField 
          label="Pin Code" 
          value={formData.pinCode} 
          onChangeText={(text) => updateFormData('pinCode', text)} 
          placeholder="751001" 
          keyboardType="numeric" 
        />
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={formData.address} 
            onChangeText={(text) => updateFormData('address', text)} 
            placeholder="Enter full address..." 
            multiline 
            numberOfLines={4} 
            placeholderTextColor="#999"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            textAlignVertical="top"
          />
        </View>
      </FormCard>

      <FormCard title="Occupant Details">
        <PickerField 
          label="Unit" 
          required 
          selectedValue={formData.unit} 
          onValueChange={(value) => updateFormData('unit', value)} 
          placeholder="Select unit" 
          items={['Room A', 'Room B', 'Room C', 'Apartment 1']} 
        />
        <PickerField 
          label="Occupant Type" 
          required 
          selectedValue={formData.occupantType} 
          onValueChange={(value) => updateFormData('occupantType', value)} 
          placeholder="Select type" 
          items={['Tenant', 'Owner', 'Guest']} 
        />

        {/* Effective Start Date with picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Effective Start Date</Text>
          <TouchableOpacity onPress={() => setShowEffectiveDatePicker(true)} activeOpacity={0.7}>
            <View style={[styles.input, styles.dateInput]}>
              <Text style={[styles.dateText, { color: formData.effectiveStartDate ? '#333' : '#999' }]}>
                {formData.effectiveStartDate || 'dd-mm-yyyy'}
              </Text>
              <Ionicons name="calendar" size={22} color="#00A86B" />
            </View>
          </TouchableOpacity>
          {showEffectiveDatePicker && <DateTimePicker
            value={formData.effectiveStartDate ? new Date(formData.effectiveStartDate.split('-').reverse().join('-')) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onEffectiveDateChange}
            maximumDate={new Date(2100, 12, 31)}
            minimumDate={new Date(1900, 1, 1)}
          />}
        </View>

        <PickerField 
          label="Relation with Primary Occupant" 
          selectedValue={formData.relationWithPrimary} 
          onValueChange={(value) => updateFormData('relationWithPrimary', value)} 
          placeholder="Select Relation" 
          items={['Spouse', 'Child', 'Parent', 'Sibling', 'Friend']} 
        />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Primary Occupant</Text>
          <View style={styles.radioGroup}>
            <RadioButton 
              label="Yes" 
              selected={formData.isPrimaryOccupant === 'Yes'} 
              onPress={() => updateFormData('isPrimaryOccupant', 'Yes')} 
            />
            <RadioButton 
              label="No" 
              selected={formData.isPrimaryOccupant === 'No'} 
              onPress={() => updateFormData('isPrimaryOccupant', 'No')} 
            />
          </View>
        </View>
      </FormCard>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <LinearGradient
            colors={['#808080', '#606060']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <LinearGradient
            colors={['#146070', '#03C174']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00A86B',
    marginLeft: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  uploadContainer: {
    borderWidth: 2,
    borderColor: '#00A86B',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9F6',
    minHeight: 150,
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#00A86B',
    marginTop: 10,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  required: {
    color: '#FF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 52,
    color: '#333333',
    lineHeight: 20,
    textAlignVertical: 'center',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
    lineHeight: 22,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: Platform.OS === 'android' ? 0 : 16,
  },
  picker: {
    height: 52,
    color: '#333333',
    fontSize: 16,
  },
  pickerItem: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'left',
    height: 52,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 52,
    textAlignVertical: 'center',
  },
  dateText: {
    fontSize: 16,
    lineHeight: 20,
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: 8,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
    paddingVertical: 8,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    marginRight: 10,
  },
  radioSelected: {
    borderColor: '#00A86B',
    backgroundColor: '#00A86B',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 20,
    textAlignVertical: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    margin: 16,
    gap: 16,
  },
  resetButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradientButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});

export default AddOccupant;
