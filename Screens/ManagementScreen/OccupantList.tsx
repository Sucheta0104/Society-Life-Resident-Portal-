import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';

const { width } = Dimensions.get('window');

// API Configuration
const API_CONFIG = {
  url: 'https://applianceservicemgmt.dev2stage.in/api/rest/Invoke',
  authKey: '86A264E4-ECF8-4627-AF83-5512FE83DAE6',
  hostKey: '8ECB211D2',
};

// Image API Configuration
const IMAGE_API_CONFIG = {
  url: 'https://cp.societylife.itpluspoint.in/api/image/get-image-url',
};

export type RootStackParamList = {
  OccupantList: undefined;
  AddOccupant: undefined;
};

type OccupantListNavigationProp = StackNavigationProp<
  RootStackParamList,
  'OccupantList'
>;

type Occupant = {
  id: string;
  occupantName?: string;
  spaceDetails?: string;
  contact?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  unitName?: string;
  blockName?: string;
  societyName?: string;
  isPrimary?: boolean;
  occupantType?: string;
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  isActive?: boolean;
  profileImage?: string;
  idCardNumber?: string;
  needApprovalExit?: boolean;
  needNotificationOnExit?: boolean;
  approvedBy?: string;
  approvedDate?: string;
  occupantStatus?: string;
  relationshipWithPrimary?: string;
  dateOfBirth?: string;
  createdBy?: string;
  modifiedBy?: string;
  totalOccupant?: string;
};

// Function to extract filename from URL path
const getFileNameFromUrl = (urlOrPath: string): string | null => {
  if (!urlOrPath || typeof urlOrPath !== 'string') {
    return null;
  }
  
  try {
    // Remove any query parameters first
    const cleanUrl = urlOrPath.split('?')[0];
    
    // Extract filename from the path (last segment after /)
    const fileName = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
    
    console.log(`📎 Extracted filename from "${cleanUrl}": "${fileName}"`);
    return fileName || null;
  } catch (error) {
    console.error('❌ Error extracting filename from URL:', error);
    return null;
  }
};

// Function to fetch image URL from server
const fetchImageUrl = async (fileName: string, imageFolderName: string): Promise<string | null> => {
  if (!fileName || fileName === 'NULL' || fileName === null || fileName === '') {
    console.log('🚫 fetchImageUrl: No fileName provided');
    return null;
  }

  try {
    console.log(`🖼️  Fetching image URL for fileName: "${fileName}", imageFolderName: "${imageFolderName}"`);
    
    const apiUrl = `${IMAGE_API_CONFIG.url}?fileName=${encodeURIComponent(fileName)}&imageFolderName=${encodeURIComponent(imageFolderName)}`;
    console.log('🌐 Full Image API URL:', apiUrl);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    console.log(`📡 Image API Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`❌ Image fetch failed with status: ${response.status}`);
      console.warn('❌ Error response body:', errorText);
      return null;
    }

    const responseText = await response.text();
    console.log('📄 Raw Image API response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('💥 Failed to parse Image API JSON response:', parseError);
      return null;
    }
    
    console.log('✅ Parsed Image API response data:', data);
    
    if (data && data.Url) {
      console.log('🎯 Successfully got image URL:', data.Url);
      return data.Url;
    } else {
      console.warn('⚠️  No URL found in response data. Available keys:', Object.keys(data || {}));
      return null;
    }
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('⏰ Image fetch timeout after 15 seconds');
    } else {
      console.error('💥 Error fetching image URL:', error.message || error);
    }
    return null;
  }
};

// Enhanced Avatar Component with dynamic image fetching
const OccupantAvatar: React.FC<{ 
  profileImage?: string; 
  name: string; 
  size?: number;
  style?: any;
}> = ({ profileImage, name, size = 40, style }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);
  
  const getInitials = (fullName: string) => 
    fullName.split(' ').map(w => w[0]?.toUpperCase() || '').join('').substring(0, 2) || "OC";

  useEffect(() => {
    const fetchOccupantImage = async () => {
      if (profileImage && typeof profileImage === 'string') {
        const photoData = profileImage.trim();
        console.log(`🖼️  Processing occupant photo for ${name}:`, photoData);
        
        // Check if it's not HTML content and has actual data
        if (!photoData.startsWith('<!DOCTYPE') && 
            !photoData.startsWith('<html') && 
            !photoData.startsWith('<HTML') &&
            photoData !== 'NULL' &&
            photoData !== 'null' &&
            photoData !== '') {
          
          try {
            setLoadingImg(true);
            
            // Check if it's already a full URL or just a filename
            let fileName: string | null = null;
            
            if (photoData.startsWith('http://') || photoData.startsWith('https://')) {
              // Extract filename from full URL
              console.log(`🔍 Extracting filename from URL: ${photoData}`);
              fileName = getFileNameFromUrl(photoData);
              
              if (!fileName) {
                console.warn(`⚠️  Could not extract filename from URL: ${photoData}`);
                setImageError(true);
                return;
              }
            } else {
              // Assume it's already a filename
              fileName = photoData;
            }
            
            console.log(`🚀 Attempting to fetch occupant image URL for filename: "${fileName}"`);
            
            // Use the correct folder name "OccupantSocietyLogo_FolderPath"
            const fetchedImageUrl = await fetchImageUrl(fileName, 'OccupantSocietyLogo_FolderPath');
            
            if (fetchedImageUrl) {
              console.log(`✅ Successfully got occupant image URL:`, fetchedImageUrl);
              setImageUrl(fetchedImageUrl);
              setImageError(false);
            } else {
              console.log(`❌ No occupant image URL received for filename: ${fileName}`);
              setImageError(true);
            }
            
          } catch (error) {
            console.error(`💥 Error processing occupant photo for ${name}:`, error);
            setImageError(true);
          } finally {
            setLoadingImg(false);
          }
        } else {
          console.log(`🚫 Skipping invalid occupant photo data for ${name}`);
          setImageError(true);
        }
      } else {
        console.log(`📝 No photo data for occupant ${name}`);
        setImageError(true);
      }
    };

    fetchOccupantImage();
  }, [profileImage, name]);

  // Show fallback avatar if no image URL or error
  if (!imageUrl || imageError) {
    return (
      <View style={[{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#146070',
        justifyContent: 'center',
        alignItems: 'center',
      }, style]}>
        <Text style={{
          color: '#fff',
          fontSize: size * 0.4,
          fontWeight: '600',
        }}>
          {getInitials(name)}
        </Text>
      </View>
    );
  }

  // Show image with loading state
  return (
    <View style={{ position: 'relative' }}>
      {/* Loading indicator */}
      {loadingImg && (
        <View style={[{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#f0f0f0',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          zIndex: 2
        }, style]}>
          <ActivityIndicator size="small" color="#146070" />
        </View>
      )}
      
      {/* Actual image */}
      <Image 
        source={{ uri: imageUrl }} 
        style={[{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#f0f0f0',
          borderWidth: 2,
          borderColor: '#146070',
        }, style]} 
        onLoadStart={() => {
          console.log(`🔄 Occupant image load started for ${name}`);
          setLoadingImg(true);
        }}
        onLoad={() => {
          console.log(`✅ Occupant image loaded successfully for ${name}`);
          setLoadingImg(false);
          setImageError(false);
        }} 
        onError={(error) => {
          console.error(`❌ Occupant image load failed for ${name}:`, error.nativeEvent);
          setImageError(true);
          setLoadingImg(false);
        }} 
        onLoadEnd={() => {
          setLoadingImg(false);
        }}
        resizeMode="cover"
      />
    </View>
  );
};

const OccupantListPage = () => {
  const navigation = useNavigation<OccupantListNavigationProp>();
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [filteredOccupants, setFilteredOccupants] = useState<Occupant[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState('');
  const [selectedOccupant, setSelectedOccupant] = useState<Occupant | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOccupants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOccupants = filteredOccupants.slice(startIndex, endIndex);

  // Handle back navigation
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Helper function to get the first valid (non-null, non-empty) value
  const getFirstValidValue = (...values: any[]) => {
    for (const value of values) {
      if (value !== null && value !== undefined && value !== '' && value !== 'NULL' && value !== 'null') {
        return String(value).trim();
      }
    }
    return '';
  };

  // ENHANCED: Transform API response with image URL fetching
  const transformApiResponse = async (item: any): Promise<Occupant> => {
    // Log raw item for debugging
    console.log('Raw API occupant item:', JSON.stringify(item, null, 2));

    // Fetch image URL if profile image data exists
    let profileImageUrl = "";
    if (item.Profile_Image && typeof item.Profile_Image === 'string') {
      const photoData = item.Profile_Image.trim();
      console.log(`🖼️  Processing occupant profile image:`, photoData);
      
      if (!photoData.startsWith('<!DOCTYPE') && 
          !photoData.startsWith('<html') && 
          !photoData.startsWith('<HTML') &&
          photoData !== 'NULL' &&
          photoData !== 'null' &&
          photoData !== '') {
        
        try {
          // Extract filename from URL if it's a full URL
          let fileName: string | null = null;
          
          if (photoData.startsWith('http://') || photoData.startsWith('https://')) {
            // Extract filename from full URL
            console.log(`🔍 Extracting filename from occupant profile image URL: ${photoData}`);
            fileName = getFileNameFromUrl(photoData);
          } else {
            // Assume it's already a filename
            fileName = photoData;
          }
          
          if (fileName) {
            const fetchedImageUrl = await fetchImageUrl(fileName, 'OccupantSocietyLogo_FolderPath');
            if (fetchedImageUrl) {
              console.log(`✅ Successfully got occupant profile image URL:`, fetchedImageUrl);
              profileImageUrl = fetchedImageUrl;
            }
          }
        } catch (error) {
          console.error(`💥 Error fetching occupant profile image:`, error);
        }
      }
    }

    const occupant: Occupant = {
      // ID mapping
      id: String(item.Occupant_Id || item.Id || Math.random()),
      
      // Name fields - using exact field names from your API
      firstName: getFirstValidValue(item.First_Name, item.CONTOCUPNT_First_Name) || 'N/A',
      middleName: getFirstValidValue(item.Middle_Name) || '',
      lastName: getFirstValidValue(item.Last_Name) || 'N/A',
      
      // Contact information - using exact field names
      contact: getFirstValidValue(item.Mobile_Number) || 'N/A',
      email: getFirstValidValue(item.Email) || 'N/A',
      
      // Location information - using exact field names from your API
      unitName: getFirstValidValue(item.UNITOCPNT_Unit_Name) || 'N/A',
      blockName: getFirstValidValue(item.BLOKOCUPNT_Block_Code) || 'N/A', 
      societyName: getFirstValidValue(item.SCTOCUPNT_Society_Name) || 'N/A',
      
      // Status and type fields - using exact field names
      isPrimary: item.Is_Primary === true || item.Is_Primary === 1,
      isActive: item.Is_Active === true || item.Is_Active === 1,
      
      // Type and status - using exact field names from your API
      occupantType: getFirstValidValue(item.OccupantType) || 'N/A',
      occupantStatus: getFirstValidValue(item.Occupant_Status) || 'N/A',
      
      // Date fields - using exact field names
      effectiveStartDate: getFirstValidValue(item.Effective_Start_Date) || 'N/A',
      effectiveEndDate: getFirstValidValue(item.Effective_End_Date) || 'N/A',
      dateOfBirth: getFirstValidValue(item.Date_of_Birth) || 'N/A',
      
      // Relationship - using exact field name from your API
      relationshipWithPrimary: getFirstValidValue(item.RelationwithPrimaryOccupant) || 'N/A',
      
      // Other fields - using exact field names
      profileImage: profileImageUrl, // Use the fetched image URL
      idCardNumber: getFirstValidValue(item.ID_Card_Number) || 'N/A',
      
      // Approval fields - using exact field names
      needApprovalExit: item.Need_Approval_Exit_From_Gate === true || item.Need_Approval_Exit_From_Gate === 1,
      needNotificationOnExit: item.Need_Notification_On_Exit === true || item.Need_Notification_On_Exit === 1,
      
      // Who approved/created/modified - using exact field names
      approvedBy: getFirstValidValue(item.OccupantApprovedBy) || 'N/A',
      approvedDate: getFirstValidValue(item.Approved_Date) || 'N/A',
      createdBy: getFirstValidValue(item.CreatedBy) || 'N/A',
      modifiedBy: getFirstValidValue(item.ModifiedBy) || 'N/A',
      
      // Additional field
      totalOccupant: getFirstValidValue(item.Total_Ocupant) ? String(item.Total_Ocupant) : 'N/A',
    };

    // Construct full name
    const nameParts = [occupant.firstName, occupant.middleName, occupant.lastName].filter(part => part && part !== 'N/A');
    occupant.occupantName = nameParts.length > 0 ? nameParts.join(' ') : 'Unknown Occupant';

    // Set space details (prefer unit name)
    occupant.spaceDetails = occupant.unitName !== 'N/A' ? occupant.unitName : 'N/A';

    console.log('Transformed occupant:', JSON.stringify(occupant, null, 2));
    return occupant;
  };

  // ENHANCED: Fetch occupants from API with better error handling and image fetching
  const loadOccupants = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Fetching occupants from API...');

      // Build parameter string for the stored procedure
      const valuesString = `@p_Occupant_Id=NULL,@p_Society_Id=7,@p_Block_Id=NULL,@p_Unit_Id=280,@p_Contact_Id=NULL,@p_Society_GUID=NULL,@p_Is_Primary=NULL,@p_Primary_Occupant_Id=NULL,@p_Relationship_Id_With_Primary_Occupant=NULL,@p_From_Effective_Start_Date=NULL,@p_To_Effective_Start_Date=NULL,@p_From_Effective_End_Date=NULL,@p_To_Effective_End_Date=NULL,@p_Occupant_Type_Id=NULL,@p_ID_Card_Number=NULL,@p_Need_Approval_Exit_From_Gate=NULL,@p_Need_Notification_On_Exit=NULL,@p_Approved_By=NULL,@p_From_Approved_Date=NULL,@p_To_Approved_Date=NULL,@p_Occupant_Status_Id=NULL,@p_Profile_Image=NULL,@p_Attribute1=NULL,@p_Attribute2=NULL,@p_Attribute3=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Is_Active=NULL,@p_Is_Archived=NULL,@p_Skip=0,@p_Take=50000,@p_Email=NULL,@p_First_Name=NULL,@p_Occupant_GUID=NULL`;

      // Prepare request body
      const requestBody = new URLSearchParams({
        AuthKey: API_CONFIG.authKey,
        HostKey: API_CONFIG.hostKey,
        Object: "OCM_SP_Occupant_Get",
        Values: valuesString,
      }).toString();

      console.log('📤 Occupant API Request Body:', requestBody);

      // Make API call
      const response = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: requestBody,
      });

      const responseText = await response.text();
      console.log('📥 Raw Occupant API Response (first 500 chars):', responseText.substring(0, 500) + '...');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log('✅ Parsed Occupant API Response structure:', Object.keys(result || {}));

      // ENHANCED: More comprehensive response parsing
      let rawData: any[] = [];

      // Try multiple ways to extract the data array
      if (result?.Data && Array.isArray(result.Data)) {
        console.log('📋 Found Data array with length:', result.Data.length);
        rawData = result.Data;
      } else if (Array.isArray(result)) {
        console.log('📋 Found direct array with length:', result.length);
        rawData = result;
      } else if (result?.data && Array.isArray(result.data)) {
        console.log('📋 Found data array with length:', result.data.length);
        rawData = result.data;
      } else if (result?.Result && Array.isArray(result.Result)) {
        console.log('📋 Found Result array with length:', result.Result.length);
        rawData = result.Result;
      } else if (result?.results && Array.isArray(result.results)) {
        console.log('📋 Found results array with length:', result.results.length);
        rawData = result.results;
      } else if (result?.Records && Array.isArray(result.Records)) {
        console.log('📋 Found Records array with length:', result.Records.length);
        rawData = result.Records;
      } else if (result?.records && Array.isArray(result.records)) {
        console.log('📋 Found records array with length:', result.records.length);
        rawData = result.records;
      } else if (typeof result === 'object' && result !== null) {
        console.log('📋 Found single object, converting to array');
        rawData = [result];
      } else {
        console.log('❌ No recognizable data structure found. Full response:', result);
        rawData = [];
      }

      // Transform data with image URL fetching (async operation)
      console.log(`🔄 Starting transformation of ${rawData.length} occupant records...`);
      const transformedData: Occupant[] = [];
      
      for (let i = 0; i < rawData.length; i++) {
        try {
          const transformedOccupant = await transformApiResponse(rawData[i]);
          transformedData.push(transformedOccupant);
        } catch (transformError) {
          console.error(`💥 Error transforming occupant ${i + 1}:`, transformError);
          // Continue with other occupants even if one fails
        }
      }

      console.log(`✅ Successfully transformed ${transformedData.length} occupants`);
      console.log('📊 Occupants with profile images:', transformedData.filter(o => o.profileImage).length);
      
      setOccupants(transformedData);
      setFilteredOccupants(transformedData);

      if (transformedData.length === 0) {
        setError('No occupants found');
      }

    } catch (error: any) {
      console.error('💥 Occupant API Error:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setError(errorMessage);
      setOccupants([]);
      setFilteredOccupants([]);
      Alert.alert('API Error', `Failed to fetch occupants: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOccupants();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOccupants();
  }, []);

  useEffect(() => {
    filterOccupants();
  }, [occupants, searchQuery]);

  const filterOccupants = () => {
    if (!searchQuery.trim()) {
      setFilteredOccupants(occupants);
    } else {
      const filtered = occupants.filter(occupant =>
        occupant.occupantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        occupant.spaceDetails?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        occupant.contact?.includes(searchQuery) ||
        occupant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        occupant.unitName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        occupant.blockName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        occupant.societyName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOccupants(filtered);
    }
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleAddOccupant = () => {
    navigation.navigate("AddOccupant");
  };

  const handleViewOccupant = (occupant: Occupant) => {
    setSelectedOccupant(occupant);
    setModalVisible(true);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      buttons.push(
        <TouchableOpacity
          key="prev"
          style={styles.paginationButton}
          onPress={() => setCurrentPage(currentPage - 1)}
        >
          <Text style={styles.paginationButtonText}>‹</Text>
        </TouchableOpacity>
      );
    }

    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.paginationButton,
            currentPage === i && styles.paginationButtonActive
          ]}
          onPress={() => setCurrentPage(i)}
        >
          <Text style={[
            styles.paginationButtonText,
            currentPage === i && styles.paginationButtonTextActive
          ]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      buttons.push(
        <TouchableOpacity
          key="next"
          style={styles.paginationButton}
          onPress={() => setCurrentPage(currentPage + 1)}
        >
          <Text style={styles.paginationButtonText}>›</Text>
        </TouchableOpacity>
      );
    }

    return buttons;
  };

  const OccupantCard = ({ occupant, index }: { occupant: Occupant; index: number }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <OccupantAvatar profileImage={occupant.profileImage} name={occupant.occupantName || 'N/A'} size={40} />
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{occupant.occupantName || 'N/A'}</Text>
            <Text style={styles.cardSubtitle}>{occupant.spaceDetails || 'N/A'}</Text>
          </View>
        </View>
      </View>
      
      {/* Card Content - Without icons */}
      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>CONTACT</Text>
          <Text style={styles.cardValue}>{occupant.contact || 'N/A'}</Text>
        </View>

        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>EMAIL</Text>
          <Text style={[styles.cardValue, styles.emailText]} numberOfLines={1}>
            {occupant.email || 'N/A'}
          </Text>
        </View>

        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>STATUS</Text>
          <View style={[styles.statusBadge, { backgroundColor: occupant.isActive ? '#03C174' : '#ef4444' }]}>
            <Text style={styles.statusText}>{occupant.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
      </View>

      {/* View Button */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewOccupant(occupant)}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={16} color="#146070" />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // UPDATED: Occupant Details Modal with profile image
  const OccupantDetailsModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#146070', '#03C174']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Occupant Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {selectedOccupant && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* UPDATED: Profile Image Section */}
              <View style={styles.modalProfileSection}>
                <OccupantAvatar 
                  profileImage={selectedOccupant.profileImage} 
                  name={selectedOccupant.occupantName || 'N/A'} 
                  size={80} 
                />
                <Text style={styles.modalProfileName}>{selectedOccupant.occupantName}</Text>
                <Text style={styles.modalProfileUnit}>{selectedOccupant.spaceDetails}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Personal Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Full Name:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.occupantName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Name:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.lastName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date of Birth:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.dateOfBirth}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.contact}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID Card Number:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.idCardNumber}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Location Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Unit Name:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.unitName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Block Code:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.blockName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Society:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.societyName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Unit Details:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.spaceDetails}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Occupant Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Occupant Type:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.occupantType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Primary Occupant:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.isPrimary ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Relationship with Primary:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.relationshipWithPrimary}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Occupant Status:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.occupantStatus}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Occupants:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.totalOccupant}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Access & Permissions</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Need Approval for Exit:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.needApprovalExit ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Need Notification on Exit:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.needNotificationOnExit ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Active Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: selectedOccupant.isActive ? '#03C174' : '#ef4444' }]}>
                    <Text style={styles.statusText}>{selectedOccupant.isActive ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Date & Approval Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Effective Start Date:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.effectiveStartDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Effective End Date:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.effectiveEndDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Approved By:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.approvedBy}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Approved Date:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.approvedDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created By:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.createdBy}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Modified By:</Text>
                  <Text style={styles.detailValue}>{selectedOccupant.modifiedBy}</Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Back Arrow, Title and Add Button */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#146070" />
            </TouchableOpacity>
            <Text style={styles.title}>Occupant List</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddOccupant}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#146070', '#03C174']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Error Display */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={loadOccupants}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#146070', '#03C174']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>{occupants.length.toString().padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>Total Occupants</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#146070', '#03C174']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>{occupants.filter(o => o.isActive).length.toString().padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#146070', '#03C174']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>{occupants.filter(o => o.isPrimary).length.toString().padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>Primary</Text>
          </LinearGradient>
        </View>

        {/* Search Section */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search occupants..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Cards Container */}
        <View style={styles.cardsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#03C174" />
              <Text style={styles.loadingText}>Loading occupants...</Text>
            </View>
          ) : currentOccupants.length > 0 ? (
            currentOccupants.map((occupant, index) => (
              <OccupantCard key={occupant.id || index} occupant={occupant} index={index} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No occupants found</Text>
              <Text style={styles.emptySubText}>
                {searchQuery ? 'Try adjusting your search criteria' : 'No occupant data available from API'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyAddButton}
                  onPress={handleAddOccupant}
                >
                  <LinearGradient
                    colors={['#146070', '#03C174']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyAddButtonGradient}
                  >
                    <Text style={styles.emptyAddButtonText}>Add First Occupant</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <Text style={styles.paginationInfo}>
              Page {currentPage} of {totalPages} • {filteredOccupants.length} total results
            </Text>
            <View style={styles.paginationButtons}>
              {renderPaginationButtons()}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Occupant Details Modal */}
      <OccupantDetailsModal />
    </SafeAreaView>
  );
};

// UPDATED: Styles with profile image support
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(20, 96, 112, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#146070',
  },
  addButton: {
    borderRadius: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    margin: 20,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 14,
    color: '#333',
  },
  cardsContainer: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,      
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  // UPDATED: Card Header with profile image
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,     
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,           
    fontWeight: 'bold',
    color: '#146070',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cardBadge: {
    backgroundColor: '#146070',
    paddingHorizontal: 6,   
    borderRadius: 12,
  },
  // Content
  cardContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,    
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,        
    paddingHorizontal: 6,   
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 13,          
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,        
  },
  emailText: {
    color: '#03C174',
  },
  statusBadge: {
    paddingHorizontal: 6,  
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  // Actions
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,  
    paddingVertical: 8,     
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,  
    paddingVertical: 6,     
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#146070',
  },
  viewButtonText: {
    color: '#146070',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
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
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyAddButton: {
    borderRadius: 6,
  },
  emptyAddButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paginationContainer: {
    padding: 20,
    alignItems: 'center',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  paginationButtonActive: {
    backgroundColor: '#146070',
    borderColor: '#146070',
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  paginationButtonTextActive: {
    color: '#fff',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  // UPDATED: Modal profile section
  modalProfileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 20,
  },
  modalProfileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#146070',
    marginTop: 12,
  },
  modalProfileUnit: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
});

export default OccupantListPage;
