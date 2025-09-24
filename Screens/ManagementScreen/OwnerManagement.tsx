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
  StatusBar,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

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

type Owner = {
  id: string;
  ownerName?: string;
  spaceDetails?: string;
  contact?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  unitName?: string;
  mobileNumber?: string;
  isActive?: boolean;
  societyName?: string;
  profileImage?: string;
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  occupiedType?: string;
  ownerStatus?: string;
  isPrimary?: boolean;
  isAccess?: boolean;
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
const OwnerAvatar: React.FC<{ 
  profileImage?: string; 
  name: string; 
  size?: number;
  style?: any;
}> = ({ profileImage, name, size = 34, style }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);
  
  const getInitials = (fullName: string) => 
    fullName.split(' ').map(w => w[0]?.toUpperCase() || '').join('').substring(0, 2) || "OW";

  useEffect(() => {
    const fetchOwnerImage = async () => {
      if (profileImage && typeof profileImage === 'string') {
        const photoData = profileImage.trim();
        console.log(`🖼️  Processing owner photo for ${name}:`, photoData);
        
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
            
            console.log(`🚀 Attempting to fetch owner image URL for filename: "${fileName}"`);
            
            // Use the correct folder name "SocietyLogo_FolderPath"
            const fetchedImageUrl = await fetchImageUrl(fileName, 'SocietyLogo_FolderPath');
            
            if (fetchedImageUrl) {
              console.log(`✅ Successfully got owner image URL:`, fetchedImageUrl);
              setImageUrl(fetchedImageUrl);
              setImageError(false);
            } else {
              console.log(`❌ No owner image URL received for filename: ${fileName}`);
              setImageError(true);
            }
            
          } catch (error) {
            console.error(`💥 Error processing owner photo for ${name}:`, error);
            setImageError(true);
          } finally {
            setLoadingImg(false);
          }
        } else {
          console.log(`🚫 Skipping invalid owner photo data for ${name}`);
          setImageError(true);
        }
      } else {
        console.log(`📝 No photo data for owner ${name}`);
        setImageError(true);
      }
    };

    fetchOwnerImage();
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
          fontWeight: '700',
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
          console.log(`🔄 Owner image load started for ${name}`);
          setLoadingImg(true);
        }}
        onLoad={() => {
          console.log(`✅ Owner image loaded successfully for ${name}`);
          setLoadingImg(false);
          setImageError(false);
        }} 
        onError={(error) => {
          console.error(`❌ Owner image load failed for ${name}:`, error.nativeEvent);
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

const OwnerManagementPage = () => {
  const navigation = useNavigation();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [error, setError] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOwners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOwners = filteredOwners.slice(startIndex, endIndex);

  // Handle back navigation
  const handleBackPress = () => {
    navigation.goBack();
  };

  // UPDATED: Enhanced date formatting function for DD/MM/YYYY format
  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === "null" || dateString === "NULL") return "N/A";

    try {
      // Handle DD/MM/YYYY format
      if (dateString.includes("/")) {
        const parts = dateString.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);

          const dateObj = new Date(year, month - 1, day);

          if (!isNaN(dateObj.getTime())) {
            return dateObj.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "2-digit",
            });
          }
          return dateString;
        }
      }

      // Fallback
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) return dateString;

      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch (error) {
      console.error(`Date formatting error for "${dateString}":`, error);
      return dateString;
    }
  };

  // ENHANCED: Transform API response function with image URL fetching
  const transformApiResponse = async (item: any): Promise<Owner> => {
    console.log('Raw API item:', JSON.stringify(item, null, 2));

    // Helper function to get the first non-null/non-empty value
    const getFirstValidValue = (...values: any[]) => {
      for (const value of values) {
        if (value !== null && value !== undefined && value !== '' && value !== 'NULL' && value !== 'null') {
          return String(value).trim();
        }
      }
      return '';
    };

    // Fetch image URL if profile image data exists
    let profileImageUrl = "";
    if (item.Profile_Image && typeof item.Profile_Image === 'string') {
      const photoData = item.Profile_Image.trim();
      console.log(`🖼️  Processing owner profile image:`, photoData);
      
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
            console.log(`🔍 Extracting filename from owner profile image URL: ${photoData}`);
            fileName = getFileNameFromUrl(photoData);
          } else {
            // Assume it's already a filename
            fileName = photoData;
          }
          
          if (fileName) {
            const fetchedImageUrl = await fetchImageUrl(fileName, 'SocietyLogo_FolderPath');
            if (fetchedImageUrl) {
              console.log(`✅ Successfully got owner profile image URL:`, fetchedImageUrl);
              profileImageUrl = fetchedImageUrl;
            }
          }
        } catch (error) {
          console.error(`💥 Error fetching owner profile image:`, error);
        }
      }
    }

    // Map the exact field names from your database response
    const owner: Owner = {
      // Primary ID from your database structure
      id: String(item.Owner_Id || Math.random()),
      
      // Name fields - using the exact field names from your database
      firstName: getFirstValidValue(item.First_Name, item.CONTOWNER_First_Name) || 'N/A',
      lastName: getFirstValidValue(item.Last_Name) || '',
      ownerName: '',
      
      // Contact information - using exact field names
      contact: getFirstValidValue(item.Mobile_Number) || 'N/A',
      mobileNumber: getFirstValidValue(item.Mobile_Number) || 'N/A',
      email: getFirstValidValue(item.Email) || 'N/A',
      
      // Unit/Space information - using exact field names
      unitName: getFirstValidValue(item.UNITOWNER_Unit_Name) || 'N/A',
      spaceDetails: getFirstValidValue(item.UNITOWNER_Unit_Name) || 'N/A',
      
      // Society information - using exact field names
      societyName: getFirstValidValue(item.SCTOWNER_Society_Name) || 'N/A',
      
      // Status fields - using exact boolean/number conversions from your database
      isActive: item.Is_Active === true || item.Is_Active === 1,
      isPrimary: item.Is_Primary === true || item.Is_Primary === 1,
      isAccess: item.Is_Access === true || item.Is_Access === 1,
      
      // Other fields - using exact field names from your database
      profileImage: profileImageUrl, // Use the fetched image URL
      effectiveStartDate: formatDate(item.Effective_Start_Date),
      effectiveEndDate: formatDate(item.Effective_End_Date),
      approvedBy: getFirstValidValue(item.OwnerApprovedBy) || 'N/A',
      approvedDate: formatDate(item.Approved_Date),
      occupiedType: getFirstValidValue(item.Occupied_Type) || 'N/A',
      ownerStatus: getFirstValidValue(item.Owner_Status) || 'N/A',
    };

    // Construct full name from firstName and lastName
    if (owner.firstName && owner.firstName !== 'N/A' && owner.lastName) {
      owner.ownerName = `${owner.firstName} ${owner.lastName}`.trim();
    } else if (owner.firstName && owner.firstName !== 'N/A') {
      owner.ownerName = owner.firstName;
    } else {
      owner.ownerName = 'Unknown Owner';
    }

    console.log('Transformed owner:', JSON.stringify(owner, null, 2));
    return owner;
  };

  // ENHANCED: Improved API call with better error handling and response parsing with image fetching
  const loadOwners = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Fetching owners from API...');

      // Build parameter string for the stored procedure - using Society_Id=7 and Unit_Id=280 from your data
      const valuesString = `@p_Owner_Id=NULL,@p_Society_Id=7,@p_Society_GUID=NULL,@p_Contact_Id=NULL,@p_Unit_Id=280,@p_From_Effective_Start_Date=NULL,@p_To_Effective_Start_Date=NULL,@p_From_Effective_End_Date=NULL,@p_To_Effective_End_Date=NULL,@p_Approved_By=NULL,@p_From_Approved_Date=NULL,@p_To_Approved_Date=NULL,@p_Profile_Image=NULL,@p_Occupied_Type=NULL,@p_Attribute2=NULL,@p_Attribute3=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Owner_Status_Id=NULL,@p_Is_Active=NULL,@p_Is_Archived=NULL,@p_Skip=0,@p_Take=50000,@p_Email=NULL,@p_First_Name=NULL,@p_Is_Primary=NULL,@p_Is_Access=NULL,@p_Owner_GUID=NULL`;

      // Prepare request body
      const requestBody = new URLSearchParams({
        AuthKey: API_CONFIG.authKey,
        HostKey: API_CONFIG.hostKey,
        Object: "OWM_SP_Owner_Get",
        Values: valuesString,
      }).toString();

      console.log('📤 Owner API Request Body:', requestBody);

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
      console.log('📥 Raw Owner API Response (first 500 chars):', responseText.substring(0, 500) + '...');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('💥 JSON Parse Error:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      console.log('✅ Parsed Owner API Response structure:', Object.keys(result || {}));

      // UPDATED: More comprehensive response parsing
      let rawData: any[] = [];

      // Try multiple ways to extract the data array based on common API response patterns
      if (result && Array.isArray(result)) {
        console.log('📋 Found direct array with length:', result.length);
        rawData = result;
      } else if (result?.Data && Array.isArray(result.Data)) {
        console.log('📋 Found Data array with length:', result.Data.length);
        rawData = result.Data;
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
        // If it's a single object, wrap it in an array
        console.log('📋 Found single object, converting to array');
        rawData = [result];
      } else {
        console.log('❌ No recognizable data structure found. Full response:', result);
        rawData = [];
      }

      // Transform data with image URL fetching (async operation)
      console.log(`🔄 Starting transformation of ${rawData.length} owner records...`);
      const transformedData: Owner[] = [];
      
      for (let i = 0; i < rawData.length; i++) {
        try {
          const transformedOwner = await transformApiResponse(rawData[i]);
          transformedData.push(transformedOwner);
        } catch (transformError) {
          console.error(`💥 Error transforming owner ${i + 1}:`, transformError);
          // Continue with other owners even if one fails
        }
      }

      console.log(`✅ Successfully transformed ${transformedData.length} owners`);
      console.log('📊 Owners with profile images:', transformedData.filter(o => o.profileImage).length);

      setOwners(transformedData);
      setFilteredOwners(transformedData);

      if (transformedData.length === 0) {
        setError('No owners found for this society');
      }

    } catch (error: any) {
      console.error('💥 Owner API Error:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setError(`Failed to fetch owners: ${errorMessage}`);
      setOwners([]);
      setFilteredOwners([]);
      
      // Show alert only for network errors, not for "no data found"
      if (!errorMessage.includes('No owners found')) {
        Alert.alert('API Error', `Failed to fetch owners: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOwners();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOwners();
  }, []);

  useEffect(() => {
    filterOwners();
  }, [owners, searchQuery]);

  const filterOwners = () => {
    if (!searchQuery.trim()) {
      setFilteredOwners(owners);
    } else {
      const filtered = owners.filter(owner =>
        owner.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        owner.spaceDetails?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        owner.contact?.includes(searchQuery) ||
        owner.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        owner.unitName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        owner.societyName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOwners(filtered);
    }
    setCurrentPage(1);
  };

  const handleViewOwner = (owner: Owner) => {
    setSelectedOwner(owner);
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

  // Owner Card Component - Updated with avatar image
  const OwnerCard = ({ owner, index }: { owner: Owner; index: number }) => (
    <View style={styles.ownerCard}>
      {/* Card Header - Compact with avatar */}
      <View style={styles.cardHeader}>
        <View style={styles.ownerInfo}>
          <View style={styles.avatarContainer}>
            <OwnerAvatar profileImage={owner.profileImage} name={owner.ownerName || 'N/A'} size={34} />
          </View>
          <View style={styles.ownerDetails}>
            <Text style={styles.ownerName}>{owner.ownerName}</Text>
            <Text style={styles.unitText}>{owner.spaceDetails}</Text>
          </View>
        </View>
       </View>

      {/* Card Content - Without icons */}
      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>CONTACT</Text>
          <Text style={styles.cardValue}>{owner.contact}</Text>
        </View>

        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>EMAIL</Text>
          <Text style={styles.cardValue} numberOfLines={1}>{owner.email}</Text>
        </View>

        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>STATUS</Text>
          <View style={[styles.statusBadge, { backgroundColor: owner.isActive ? '#03C174' : '#ef4444' }]}>
            <Text style={styles.statusText}>{owner.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
      </View>

      {/* Card Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewOwner(owner)}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={16} color="#146070" />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // UPDATED: Owner Details Modal with better data display and profile image
  const OwnerDetailsModal = () => (
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
            <Text style={styles.modalTitle}>Owner Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {selectedOwner && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Profile Image Section */}
              <View style={styles.modalProfileSection}>
                <OwnerAvatar 
                  profileImage={selectedOwner.profileImage} 
                  name={selectedOwner.ownerName || 'N/A'} 
                  size={80} 
                />
                <Text style={styles.modalProfileName}>{selectedOwner.ownerName}</Text>
                <Text style={styles.modalProfileUnit}>{selectedOwner.spaceDetails}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Personal Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.ownerName || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>First Name:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.firstName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Name:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.lastName || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.contact}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.email}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Property Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Unit Name:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.unitName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Space Details:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.spaceDetails}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Society:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.societyName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Occupied Type:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.occupiedType || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Status Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Active Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: selectedOwner.isActive ? '#03C174' : '#ef4444' }]}>
                    <Text style={styles.statusText}>{selectedOwner.isActive ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Primary Owner:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.isPrimary ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Has Access:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.isAccess ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Owner Status:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.ownerStatus || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Additional Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Effective Start Date:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.effectiveStartDate || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Effective End Date:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.effectiveEndDate || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Approved By:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.approvedBy || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Approved Date:</Text>
                  <Text style={styles.detailValue}>{selectedOwner.approvedDate || 'N/A'}</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor="#f4f9f8" />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#03C174']} />
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
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Owner Management</Text>
              <Text style={styles.subtitle}>Manage your property owners</Text>
            </View>
          </View>
         </View>

        {/* Error Display */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={loadOwners}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {/* Stats Section with Linear Gradient */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#146070', '#03C174']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>{owners.length.toString().padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>Total Owners</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#146070', '#03C174']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>{owners.filter(o => o.isActive).length.toString().padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#146070', '#03C174']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>{owners.filter(o => !o.isActive).length.toString().padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </LinearGradient>
        </View>

        {/* Search Section */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#146070" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search owners..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#7A9B9B"
            />
            {searchQuery ? (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={18} color="#7A9B9B" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        
        {/* Cards Container */}
        <View style={styles.cardsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#03C174" />
              <Text style={styles.loadingText}>Loading owners...</Text>
            </View>
          ) : currentOwners.length > 0 ? (
            currentOwners.map((owner, index) => (
              <OwnerCard key={owner.id || index} owner={owner} index={index} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="person-add-outline" size={48} color="#B0CCCC" />
              </View>
              <Text style={styles.emptyText}>No owners found</Text>
              <Text style={styles.emptySubText}>
                {searchQuery ? 'Try adjusting your search criteria' : 'No owner data available from API'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={loadOwners}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <Text style={styles.paginationInfo}>
              Page {currentPage} of {totalPages} • {filteredOwners.length} results
            </Text>
            <View style={styles.paginationButtons}>
              {renderPaginationButtons()}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Owner Details Modal */}
      <OwnerDetailsModal />
    </SafeAreaView>
  );
};

// Styles remain the same as your original code with added profile section styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f9f8',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 10,
    marginRight: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(20, 96, 112, 0.1)',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#146070',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7A9B9B',
    fontWeight: '400',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 18,
    height: 40,
    borderWidth: 1,
    borderColor: '#E8F4F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#146070',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 8,
    marginRight: 8,
  },
  searchDropdown: {
    padding: 8,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
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
    fontSize: 12,
    color: '#d2f4ea',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  cardsContainer: {
  paddingHorizontal: 16, // was 24
},
ownerCard: {
  backgroundColor: '#ffffff',
  borderRadius: 8,       // was 12
  marginBottom: 12,      // was 16
  elevation: 1,          // was 2
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 }, // softer shadow
  shadowOpacity: 0.06,   // was 0.08
  shadowRadius: 3,       // was 4
  overflow: 'hidden',
  padding: 10,           // was 14
},
cardHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,       // was 12
},
ownerInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},
avatarContainer: {
  marginRight: 8,        // was 12
},
avatarText: {
  color: '#fff',
  fontSize: 14,          // was 16
  fontWeight: '700',
},
ownerDetails: {
  flex: 1,
},
ownerName: {
  fontSize: 14,          // was 16
  fontWeight: 'bold',
  color: '#146070',
  marginBottom: 1,       // was 2
},
unitText: {
  fontSize: 12,          // was 13
  color: '#7A9B9B',
  fontWeight: '500',
},
cardBadge: {
  backgroundColor: '#f0f8f7',
  paddingHorizontal: 8,  // was 10
  paddingVertical: 3,    // was 4
  borderRadius: 10,      // was 12
  borderWidth: 1,
  borderColor: '#e8f4f3',
},
cardBadgeText: {
  color: '#146070',
  fontSize: 10,          // was 11
  fontWeight: '600',
},
cardContent: {
  marginBottom: 8,       // was 12
},
cardRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 6,       // was 10
  paddingHorizontal: 6,  // was 8
},
cardLabel: {
  fontSize: 10,          // was 11
  color: '#7A9B9B',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  flex: 1,
},
cardValue: {
  fontSize: 13,          // was 14
  color: '#333',
  fontWeight: '500',
  flex: 2,
  textAlign: 'right',
},
statusBadge: {
  paddingHorizontal: 6,  // was 8
  paddingVertical: 2,    // was 3
  borderRadius: 8,       // was 10
  minWidth: 50,          // was 60
  alignItems: 'center',
},
statusText: {
  color: '#fff',
  fontSize: 9,           // was 10
  fontWeight: '600',
},
cardActions: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  paddingTop: 6,         // was 8
  borderTopWidth: 1,
  borderTopColor: '#f5f5f5',
},
viewButton: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12, // was 16
  paddingVertical: 6,    // was 8
  borderRadius: 6,       // was 8
  backgroundColor: '#f8f9fa',
  borderWidth: 1,
  borderColor: '#146070',
},
viewButtonText: {
  color: '#146070',
  fontSize: 11,          // was 12
  fontWeight: '600',
  marginLeft: 3,         // was 4
},

  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#146070',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0F8F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#146070',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#7A9B9B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  paginationContainer: {
    padding: 24,
    alignItems: 'center',
  },
  paginationInfo: {
    fontSize: 13,
    color: '#7A9B9B',
    marginBottom: 18,
    fontWeight: '500',
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8F4F3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  paginationButtonActive: {
    backgroundColor: '#03C174',
    borderColor: '#03C174',
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#146070',
    fontWeight: '600',
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
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 6,
  },
  modalContent: {
    padding: 24,
  },
  // Profile section styles
  modalProfileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 24,
  },
  modalProfileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#146070',
    marginTop: 12,
  },
  modalProfileUnit: {
    fontSize: 16,
    color: '#7A9B9B',
    marginTop: 4,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 6,
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

export default OwnerManagementPage;
