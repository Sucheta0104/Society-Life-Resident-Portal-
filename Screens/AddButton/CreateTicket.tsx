import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const HelpTicketForm = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<FormData>({
  unitNumber: '',
  category: '',
  priority: '',
  requestBy: '',
  serviceType: '',
  summary: '',
  description: '',
});
type Attachment = {
  id: string;
  uri: string;
  type: 'image' | 'file' | 'document'; // extend later if needed
  name: string;
  size?: number; // in bytes
};
type DropdownFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string, index: number) => void;
  options: string[];
  required?: boolean;
};
type FormData = {
  unitNumber: string;
  category: string;
  priority: string;
  requestBy: string;
  serviceType: string;
  summary: string;
  description: string;
};
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Dropdown options
  const unitOptions = ['Space 101', 'Space 102', 'Space 103', 'Space 104'];
  const categoryOptions = ['Technical', 'Maintenance', 'General Inquiry', 'Emergency'];
  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
  const requesterOptions = ['John Doe', 'Jane Smith', 'Admin User', 'Maintenance Team'];
  const serviceTypeOptions = ['Repair', 'Installation', 'Consultation', 'Inspection'];

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return false;
    }
    return true;
  };

const takePhoto = async () => {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) return;

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newAttachment: Attachment = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        type: 'image',
        name: `photo_${Date.now()}.jpg`,
      };

      setAttachments(prev => [...prev, newAttachment]); // ✅ no error
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to take photo');
  }
};

const pickDocument = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
      });

    if (!result.canceled) {
      const newAttachment: Attachment = {
        id: Date.now().toString(),
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType?.includes('image') ? 'image' : 'document',
          name: result.assets[0].name,
          size: result.assets[0].size,
        };
        setAttachments(prev => [...prev, newAttachment]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(item => item.id !== id));
  };

  const validateForm = () => {
  const requiredFields: (keyof FormData)[] = [
    'unitNumber',
    'category',
    'priority',
    'requestBy',
    'serviceType',
    'summary',
    'description',
  ];

  for (const field of requiredFields) {
    if (!formData[field]) {
      Alert.alert(
        'Validation Error',
        `${String(field).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`
      );
      return false;
    }
  }
  return true;
};

  const handleSubmit = () => {
    if (validateForm()) {
      Alert.alert(
        'Ticket Submitted',
        'Your help ticket has been successfully submitted!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFormData({
                unitNumber: '',
                category: '',
                priority: '',
                requestBy: '',
                serviceType: '',
                summary: '',
                description: '',
              });
              setAttachments([]);
            }
          }
        ]
      );
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Form',
      'Are you sure you want to reset all fields?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          onPress: () => {
            setFormData({
              unitNumber: '',
              category: '',
              priority: '',
              requestBy: '',
              serviceType: '',
              summary: '',
              description: '',
            });
            setAttachments([]);
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (navigation) {
      navigation.goBack();
    } else {
      Alert.alert('Navigation', 'Back button pressed');
    }
  };

 const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  value,
  onValueChange,
  options,
  required = false,
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={value}
        onValueChange={onValueChange}
        style={styles.picker}
      >
        <Picker.Item
          label={`Select ${label.toLowerCase()}`}
          value=""
          color="#999"
        />
        {options.map((option, index) => (
          <Picker.Item key={index} label={option} value={option} />
        ))}
      </Picker>
    </View>
  </View>
);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#00A86B" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="help-circle" size={24} color="#00A86B" />
          <Text style={styles.headerTitle}>Create Help Ticket</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Ticket Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ticket Details</Text>
          
          <DropdownField
            label="Unit Number"
            value={formData.unitNumber}
            onValueChange={(value: string) => handleInputChange('unitNumber', value)}
            options={unitOptions}
            required
          />

          <DropdownField
            label="Category"
            value={formData.category}
            onValueChange={(value: string) => handleInputChange('category', value)}
            options={categoryOptions}
            required
          />

          <DropdownField
            label="Priority"
            value={formData.priority}
            onValueChange={(value: string) => handleInputChange('priority', value)}
            options={priorityOptions}
            required
          />

          <DropdownField
            label="Request By"
            value={formData.requestBy}
            onValueChange={(value: string) => handleInputChange('requestBy', value)}
            options={requesterOptions}
            required
          />

          <DropdownField
            label="Service Type"
            value={formData.serviceType}
            onValueChange={(value: string) => handleInputChange('serviceType', value)}
            options={serviceTypeOptions}
            required
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Summary/Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Brief description of issue"
              value={formData.summary}
              onChangeText={(text) => handleInputChange('summary', text)}
              multiline={false}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Descriptions <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Provide detailed information"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Attachments Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Attach images/documents <Text style={styles.required}>*</Text>
          </Text>
          
          <View style={styles.attachmentContainer}>
            <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
              <Ionicons name="camera" size={32} color="#00A86B" />
              <Text style={styles.uploadText}>Take a photo</Text>
              <Text style={styles.uploadSubtext}>or</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
              <Ionicons name="cloud-upload" size={32} color="#00A86B" />
              <Text style={styles.uploadText}>upload documents</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.supportedText}>Supported: JPG, PNG, PDF (Max 5MB each)</Text>
          
          {/* Display attachments */}
          {attachments.length > 0 && (
            <View style={styles.attachmentsList}>
              {attachments.map((attachment) => (
                <View key={attachment.id} style={styles.attachmentItem}>
                  {attachment.type === 'image' ? (
                    <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                  ) : (
                    <View style={styles.documentIcon}>
                      <Ionicons name="document" size={24} color="#666" />
                    </View>
                  )}
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                    {attachment.size && (
                      <Text style={styles.attachmentSize}>
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => removeAttachment(attachment.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#ff4757" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Ticket</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#00A86B',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#ff4757',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  attachmentContainer: {
    borderWidth: 2,
    borderColor: '#00A86B',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#f8fffe',
    marginBottom: 10,
  },
  uploadButton: {
    alignItems: 'center',
    marginVertical: 5,
  },
  uploadText: {
    fontSize: 16,
    color: '#00A86B',
    fontWeight: '500',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  supportedText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  attachmentsList: {
    marginTop: 15,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  documentIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  attachmentSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#00A86B',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HelpTicketForm;