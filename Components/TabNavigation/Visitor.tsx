import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { ColorValue } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Home: undefined;
  AddVisitor: undefined;
  AddTenant: { tenantId: string };
};

// Visitor Types
type VisitorStatus = "checked-in" | "checked-out" | "still-in";
type VisitorPurpose =
  | "Personal Work"
  | "Business Meeting"
  | "Delivery"
  | "Meeting"
  | "Interview"
  | "Maintenance";

interface Visitor {
  id: string;
  name: string;
  phone: string;
  checkIn: string;
  checkOut: string | null;
  meeting: string;
  purpose: VisitorPurpose;
  status: VisitorStatus;
  visitDate: string;
  company?: string;
  email?: string;
  host?: string;
  department?: string;
  vehicleNumber?: string;
  address?: string;
  badgeNumber?: string;
  notes?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  vehicleType?: string;
  makeModel?: string;
  securityStaff?: string;
  photo?: string;
}

const ITEMS_PER_PAGE = 10;

// API Config
const API_CONFIG = {
  url: "https://applianceservicemgmt.dev2stage.in/api/rest/Invoke",
  authKey: "86A264E4-ECF8-4627-AF83-5512FE83DAE6",
  hostKey: "8ECB211D2",
};

// Image API Config
const IMAGE_API_CONFIG = {
  url: "https://cp.societylife.itpluspoint.in/api/image/get-image-url",
};

// Function to get current unit ID
const getCurrentUnitId = (): number => {
  return 280; // Default fallback - you can modify this based on your app's state management
};
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
    console.log('📋 Response Headers:', response.headers);

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
      console.error('📄 Response text that failed to parse:', responseText);
      return null;
    }
    
    console.log('✅ Parsed Image API response data:', data);
    
    if (data && data.Url) {
      console.log('🎯 Successfully got image URL:', data.Url);
      // Test if the URL is accessible
      try {
        const testResponse = await fetch(data.Url, { method: 'HEAD' });
        console.log(` Image URL test - Status: ${testResponse.status}, Content-Type: ${testResponse.headers.get('content-type')}`);
      } catch (testError) {
        console.warn('⚠️  Image URL test failed:', testError);
      }
      return data.Url;
    } else {
      console.warn('⚠️  No URL found in response data. Available keys:', Object.keys(data || {}));
      return null;
    }
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(' Image fetch timeout after 15 seconds');
    } else {
      console.error(' Error fetching image URL:', error.message || error);
      console.error('📊 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 200)
      });
    }
    return null;
  }
};

// Visitor Management Component
export default function VisitorManagement() {
  type NavigationProps = NativeStackNavigationProp<RootStackParamList, "Home">;
  const navigation = useNavigation<NavigationProps>();

  // States
  const [visitors, setVisitors] = useState<Visitor[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUnitId, setCurrentUnitId] = useState<number>(getCurrentUnitId());

  // Handle back navigation
  const handleBackPress = () => {
    navigation.goBack();
  };

  // UPDATED: Enhanced date formatting function for DD/MM/YYYY format
  const formatDateTime = (dateString: string, timeString?: string) => {
    if (!dateString || dateString === 'NULL' || dateString === null || dateString === '') return 'N/A';
    
    try {
      let dateObj: Date;
      
      // Handle DD/MM/YYYY format from your database
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          dateObj = new Date(year, month - 1, day);
        } else {
          dateObj = new Date(dateString);
        }
      } else if (dateString.includes('-')) {
        dateObj = new Date(dateString);
      } else {
        dateObj = new Date(dateString);
      }
      
      if (isNaN(dateObj.getTime())) {
        return dateString; // Return original if parsing fails
      }
      
      // Add time if provided and valid
      if (timeString && timeString !== 'NULL' && timeString !== null && timeString !== '') {
        try {
          const timeParts = String(timeString).split(':');
          if (timeParts.length >= 2) {
            const hour = parseInt(timeParts[0]);
            const minute = parseInt(timeParts[1]);
            const second = timeParts.length >= 3 ? parseInt(timeParts[2]) : 0;
            
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
              dateObj.setHours(hour, minute, second);
            }
          }
        } catch (timeError) {
          console.warn(`Error parsing time: ${timeString}`);
        }
      }
      
      // Format the date/time
      const options: Intl.DateTimeFormatOptions = timeString ? {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      } : {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      };
      
      return dateObj.toLocaleDateString('en-US', options);
      
    } catch (error) {
      console.error(`Date formatting error for "${dateString}":`, error);
      return dateString; // Return original on error
    }
  };

  // UPDATED: Enhanced transform API response function with better debugging and error handling
  const transformApiResponse = async (item: any, index: number): Promise<Visitor> => {
    console.log(`🔄 Processing visitor ${index + 1}:`, item.Visitor_Name || 'Unknown');
    console.log('📋 Raw visitor data:', {
      id: item.Visitor_Id,
      name: item.Visitor_Name,
      photo: item.Visitor_Photo
    });
    
    // Map the exact field names from your database response
    const checkInDate = item.Checkin_Date;
    const checkInTime = item.Checkin_Time;
    const checkOutDate = item.Checkout_Date;
    const checkOutTime = item.Checkout_Time;
    
    const checkInDateTime = checkInDate 
      ? formatDateTime(checkInDate, checkInTime)
      : 'N/A';
    
    const checkOutDateTime = checkOutDate && checkOutDate !== 'NULL' && checkOutDate !== null
      ? formatDateTime(checkOutDate, checkOutTime)
      : null;

    // Determine status based on check-in/out data
    let status: VisitorStatus = "checked-out";
    if (checkInDate && (!checkOutDate || checkOutDate === 'NULL' || checkOutDate === null)) {
      status = "still-in";
    } else if (checkInDate && checkOutDate && checkOutDate !== 'NULL' && checkOutDate !== null) {
      status = "checked-out";
    } else if (checkInDate) {
      status = "checked-in";
    }

    // ENHANCED: Better image URL fetching with comprehensive debugging
    let imageUrl = "";
    
    if (item.Visitor_Photo && typeof item.Visitor_Photo === 'string') {
      const photoData = item.Visitor_Photo.trim();
      console.log(`🖼️  Processing photo for ${item.Visitor_Name}:`, photoData);
      
      // Check if it's not HTML content and has actual data
      if (!photoData.startsWith('<!DOCTYPE') && 
          !photoData.startsWith('<html') && 
          !photoData.startsWith('<HTML') &&
          photoData !== 'NULL' &&
          photoData !== 'null' &&
          photoData !== '') {
        
        try {
          console.log(`🚀 Attempting to fetch image URL for: "${photoData}"`);
          
          // UPDATED: Use the correct folder name "Visitor_FolderPath"
          const fetchedImageUrl = await fetchImageUrl(photoData, 'Visitor_FolderPath');
          
          if (fetchedImageUrl) {
            console.log(`✅ Successfully got image URL:`, fetchedImageUrl);
            imageUrl = fetchedImageUrl;
          } else {
            console.log(`❌ No image URL received for: ${photoData}`);
            
            // Try alternative folder names as fallback
            const alternativeFolders = ['Profile_Image', 'Visitor_Photos', 'Images'];
            for (const folderName of alternativeFolders) {
              console.log(`🔄 Trying fallback folder: ${folderName}`);
              const fallbackUrl = await fetchImageUrl(photoData, folderName);
              if (fallbackUrl) {
                console.log(`✅ Fallback successful with ${folderName}:`, fallbackUrl);
                imageUrl = fallbackUrl;
                break;
              }
            }
            
            if (!imageUrl) {
              console.warn(`⚠️  Could not fetch image URL for any folder name. fileName: ${photoData}`);
            }
          }
          
        } catch (error) {
          console.error(`💥 Error processing photo for ${item.Visitor_Name}:`, error);
        }
      } else {
        console.log(`🚫 Skipping invalid photo data for ${item.Visitor_Name}:`, photoData.substring(0, 50) + (photoData.length > 50 ? '...' : ''));
      }
    } else {
      console.log(`📝 No photo data for ${item.Visitor_Name}`);
    }

    const visitor: Visitor = {
      id: String(item.Visitor_Id || index + 1),
      name: item.Visitor_Name || "Unknown Visitor",
      phone: item.Visitor_Mobile_No || "N/A",
      email: item.Visitor_Email || "N/A",
      checkIn: checkInDateTime,
      checkOut: checkOutDateTime,
      meeting: item.Whom_To_Meet_Name || "N/A",
      purpose: (item.Visiting_Purpose || "Meeting") as VisitorPurpose,
      status,
      visitDate: checkInDate ? formatDateTime(checkInDate) : new Date().toISOString().split("T")[0],
      host: item.Whom_To_Meet_Name || "N/A",
      vehicleNumber: item.Vehicle_Registraion_No || "N/A", // Note: your DB has "Registraion" (typo)
      address: item.Visitor_Address || "N/A",
      city: item.Visitor_City || "N/A",
      state: item.VisitorState || String(item.Visitor_State) || "N/A", // Use the readable state name
      country: item.VisitorCountry || String(item.Visitor_Country) || "N/A", // Use the readable country name
      pinCode: item.Pin_Code || "N/A",
      badgeNumber: item.Visitor_Pass_No || "N/A",
      vehicleType: item.VisitorVehicleType || item.Vehicle_Type_Name || "N/A",
      makeModel: item.Make_Model || "N/A",
      securityStaff: item.VisitorOfficeStaff || item.Security_Personal_Name || "N/A",
      photo: imageUrl, // Use the fetched image URL
    };

    console.log(`✅ Transformed visitor ${visitor.name}:`, {
      id: visitor.id,
      name: visitor.name,
      hasPhoto: !!visitor.photo,
      photoUrl: visitor.photo ? visitor.photo.substring(0, 50) + '...' : 'None'
    });
    
    return visitor;
  };

  // UPDATED: Fetch visitors API function with enhanced error handling
  const fetchVisitors = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log('🔍 Fetching visitors for unit ID:', currentUnitId);
      
      // Build the parameter string - set Unit_Id to fetch data for specific unit
      const valuesString = `@p_Visitor_Id=NULL,@p_Society_Id=NULL,@p_Unit_Id=${currentUnitId},@p_Unit_Name=NULL,@p_Visitor_Name=NULL,@p_Visitor_Mobile_No=NULL,@p_Visitor_Email=NULL,@p_Visitor_Pass_No=NULL,@p_Vehicle_Registraion_No=NULL,@p_Visitor_Address=NULL,@p_Visitor_City=NULL,@p_Visitor_State=NULL,@p_Visitor_Country=NULL,@p_Whom_To_Meet_Id=NULL,@p_Whom_To_Meet_Name=NULL,@p_Visiting_Purpose=NULL,@p_Vehicle_Type=NULL,@p_Vehicle_Type_Name=NULL,@p_Make_Model=NULL,@p_Office_Security_Staff_Id=NULL,@p_Security_Personal_Name=NULL,@p_From_Checkin_Date=NULL,@p_To_Checkin_Date=NULL,@p_Checkin_Time=NULL,@p_From_Checkout_Date=NULL,@p_To_Checkout_Date=NULL,@p_Checkout_Time=NULL,@p_Pin_Code=NULL,@p_Attribute1=NULL,@p_Attribute2=NULL,@p_Attribute3=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Attribute10=NULL,@p_Is_Active=NULL,@p_Is_Archived=NULL,@p_Skip=0,@p_Take=50000,@p_Visitor_Photo=NULL`;

      const requestBody = new URLSearchParams({
        AuthKey: API_CONFIG.authKey,
        HostKey: API_CONFIG.hostKey,
        Object: "VIM_SP_Visitor_Get",
        Values: valuesString,
      }).toString();

      console.log('📤 Visitor API Request Body:', requestBody);

      const response = await fetch(API_CONFIG.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: requestBody,
      });

      const responseText = await response.text();
      console.log('📥 Raw Visitor API Response (first 500 chars):', responseText.substring(0, 500) + '...');

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

      console.log('✅ Parsed Visitor API Response structure:', Object.keys(result || {}));

      let rawData: any[] = [];

      // Handle different possible response structures
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
      } else if (typeof result === "object" && result !== null && !Array.isArray(result)) {
        // Single object response
        console.log('📋 Found single object, converting to array');
        rawData = [result];
      } else {
        console.log('❌ No recognizable data structure found in response');
        rawData = [];
      }

      // Transform data with image URL fetching (async operation)
      console.log(`🔄 Starting transformation of ${rawData.length} visitor records...`);
      const transformedData: Visitor[] = [];
      
      for (let i = 0; i < rawData.length; i++) {
        try {
          const transformedVisitor = await transformApiResponse(rawData[i], i);
          transformedData.push(transformedVisitor);
        } catch (transformError) {
          console.error(`💥 Error transforming visitor ${i + 1}:`, transformError);
          // Continue with other visitors even if one fails
        }
      }

      console.log(`✅ Successfully transformed ${transformedData.length} visitors`);
      console.log('📊 Visitors with photos:', transformedData.filter(v => v.photo).length);
      
      setVisitors(transformedData);
      
      if (transformedData.length === 0) {
        setError("No visitors found for this unit");
      }
      
    } catch (err: any) {
      console.error('💥 Visitor API Error:', err);
      const errorMessage = err.message || "Unknown error occurred";
      setError(`Failed to fetch visitors: ${errorMessage}`);
      setVisitors([]);
      
      // Show alert only for network errors, not for "no data found"
      if (!errorMessage.includes('No visitors found')) {
        Alert.alert("API Error", `Failed to fetch visitors: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Effect to refetch when unit changes
  useEffect(() => {
    fetchVisitors();
  }, [currentUnitId]);

  // Initial fetch
  useEffect(() => {
    fetchVisitors();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const totalVisitors = visitors.length;
    const checkedOut = visitors.filter(v => v.status === "checked-out").length;
    const stillIn = visitors.filter(v => v.status === "still-in" || v.status === "checked-in").length;
    return { totalVisitors, checkedOut, stillIn };
  }, [visitors]);

  // Filter & Pagination
  const filteredVisitors = useMemo(() => {
    if (!searchQuery.trim()) return visitors;
    const query = searchQuery.toLowerCase();
    return visitors.filter(
      v => v.name.toLowerCase().includes(query)
        || v.phone.includes(query)
        || v.purpose.toLowerCase().includes(query)
        || v.meeting.toLowerCase().includes(query)
        || (v.email && v.email.toLowerCase().includes(query))
    );
  }, [visitors, searchQuery]);

  const totalPages = Math.ceil(filteredVisitors.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVisitors = filteredVisitors.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handle visitor view
  const handleView = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setModalVisible(true);
  };

  const handleAddVisitor = () => navigation.navigate("AddVisitor");

  // Status helpers
  const getStatusColor = (status: VisitorStatus) => {
    switch (status) {
      case "checked-in": return "#03C174";
      case "still-in": return "#146070";
      case "checked-out": return "#8884d8";
      default: return "#999";
    }
  };

  const getStatusLabel = (status: VisitorStatus) => {
    switch (status) {
      case "checked-in": return "Check In";
      case "still-in": return "Still In";
      case "checked-out": return "Check Out";
      default: return status;
    }
  };

  const formatTime = (timeStr: string | null) => timeStr ?? "Not checked out";

  // ENHANCED: Visitor Image Component with comprehensive error handling and debugging
  const VisitorImage = ({ photo, name, size = 50, style }: { photo?: string; name: string; size?: number; style?: any }) => {
    const [imageError, setImageError] = useState(false);
    const [loadingImg, setLoadingImg] = useState(false);
    
    const getInitials = (fullName: string) => 
      fullName.split(' ').map(w => w[0]?.toUpperCase() || '').join('').substring(0, 2) || "UV";
    
    useEffect(() => {
      console.log(`🖼️  VisitorImage useEffect - ${name}:`, { photo: photo?.substring(0, 50) + '...', hasPhoto: !!photo });
      setImageError(false);
      setLoadingImg(!!photo);
    }, [photo, name]);
    
    // Show initials if no photo or error
    if (!photo || imageError) {
      console.log(`👤 Showing initials for ${name} - hasPhoto: ${!!photo}, imageError: ${imageError}`);
      return (
        <View style={[{ 
          width: size, 
          height: size, 
          borderRadius: size/2, 
          backgroundColor: "#146070", 
          justifyContent: "center", 
          alignItems: "center", 
          borderWidth: 2, 
          borderColor: "#146070" 
        }, style]}>
          <Text style={{ fontSize: size*0.35, fontWeight: "700", color: "#fff" }}>
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
            borderRadius: size/2, 
            backgroundColor: "#f0f0f0", 
            justifyContent: "center", 
            alignItems: "center", 
            borderWidth: 2, 
            borderColor: "#146070",
            position: 'absolute',
            zIndex: 2
          }, style]}>
            <ActivityIndicator size="small" color="#146070" />
          </View>
        )}
        
        {/* Actual image */}
        <Image 
          source={{ uri: photo }} 
          style={[{ 
            width: size, 
            height: size, 
            borderRadius: size/2, 
            borderWidth: 2, 
            borderColor: "#146070",
            backgroundColor: 'transparent'
          }, style]} 
          onLoadStart={() => {
            console.log(`🔄 Image load started for ${name}`);
            setLoadingImg(true);
          }}
          onLoad={(event) => {
            console.log(`✅ Image loaded successfully for ${name}:`, {
              url: photo?.substring(0, 50) + '...',
              dimensions: `${event.nativeEvent.source?.width}x${event.nativeEvent.source?.height}`
            });
            setLoadingImg(false);
            setImageError(false);
          }} 
          onError={(error) => {
            console.error(`❌ Image load failed for ${name}:`, {
              url: photo?.substring(0, 50) + '...',
              error: error.nativeEvent
            });
            setImageError(true);
            setLoadingImg(false);
          }} 
          onLoadEnd={() => {
            console.log(`🏁 Image load ended for ${name}`);
            setLoadingImg(false);
          }}
          resizeMode="cover"
        />
      </View>
    );
  };

  // Visitor Card Component
  const VisitorCard = ({ item, onView }: { item: Visitor; onView: (v:Visitor)=>void }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <View style={styles.visitorInfo}>
            <VisitorImage photo={item.photo} name={item.name} size={50} />
            <View style={styles.visitorTextInfo}>
              <Text style={styles.visitorName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.phoneNumber} numberOfLines={1}>{item.phone}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Check-In:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{item.checkIn}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Check-Out:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{formatTime(item.checkOut)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Meeting:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{item.meeting}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Purpose:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{item.purpose}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <Pressable style={[styles.actionBtn, styles.viewBtn]} onPress={() => onView(item)}>
          <MaterialIcons name="visibility" size={16} color="#146070" />
          <Text style={[styles.actionBtnText, styles.viewBtnText]}>View</Text>
        </Pressable>
      </View>
    </View>
  );

  // Visitor Details Modal
  const VisitorDetailsModal = ({ visible, visitor, onClose }: { visible:boolean; visitor:Visitor|null; onClose:()=>void }) => {
    if (!visitor) return null;
    const DetailRow = ({ label, value }: { label:string; value?:string|null }) => (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={styles.detailValue}>{value || "-"}</Text>
      </View>
    );
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <LinearGradient colors={["#146070","#03C174"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visitor Details</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </Pressable>
            </LinearGradient>
            <ScrollView style={styles.modalContent}>
              <View style={styles.visitorPhotoSection}>
                <Text style={styles.sectionTitle}>Visitor Photo</Text>
                <View style={styles.photoContainer}>
                  <VisitorImage photo={visitor.photo} name={visitor.name} size={80} />
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoName}>{visitor.name}</Text>
                    <Text style={styles.photoBadge}>Badge: {visitor.badgeNumber || "N/A"}</Text>
                    <View style={[styles.photoStatus,{backgroundColor:getStatusColor(visitor.status)}]}>
                      <Text style={styles.photoStatusText}>{getStatusLabel(visitor.status)}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <DetailRow label="ID" value={visitor.id} />
                <DetailRow label="Name" value={visitor.name} />
                <DetailRow label="Phone" value={visitor.phone} />
                <DetailRow label="Email" value={visitor.email} />
                <DetailRow label="Address" value={visitor.address} />
                <DetailRow label="City" value={visitor.city} />
                <DetailRow label="State" value={visitor.state} />
                <DetailRow label="Country" value={visitor.country} />
                <DetailRow label="Pin Code" value={visitor.pinCode} />
              </View>
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Visit Information</Text>
                <DetailRow label="Host/Meeting With" value={visitor.host} />
                <DetailRow label="Purpose" value={visitor.purpose} />
                <DetailRow label="Visit Date" value={visitor.visitDate} />
                <DetailRow label="Check In Time" value={visitor.checkIn} />
                <DetailRow label="Check Out Time" value={visitor.checkOut} />
                <DetailRow label="Status" value={getStatusLabel(visitor.status)} />
                <DetailRow label="Security Staff" value={visitor.securityStaff} />
              </View>
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Vehicle Information</Text>
                <DetailRow label="Vehicle Number" value={visitor.vehicleNumber} />
                <DetailRow label="Badge Number" value={visitor.badgeNumber} />
                <DetailRow label="Vehicle Type" value={visitor.vehicleType} />
                <DetailRow label="Make/Model" value={visitor.makeModel} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // StatCard
  const StatCard = ({
    number,
    label,
    colors,
  }: {
    number: number;
    label: string;
    colors: [ColorValue, ColorValue, ...ColorValue[]];
  }) => (
    <LinearGradient
      colors={colors}
      style={styles.statCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.statNumber}>{number.toString().padStart(2, "0")}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );

  // Header Component
  const HeaderComponent = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#146070" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitleLine1}>Visitor</Text>
            <Text style={styles.headerTitleLine2}>Management</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddVisitor}>
            <LinearGradient 
              colors={["#146070","#03C174"]} 
              start={{x:0,y:0}} 
              end={{x:1,y:1}} 
              style={styles.addButtonGradient}
            >
              <MaterialIcons name="add" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <StatCard number={stats.totalVisitors} label="Total Visitors" colors={["#146070","#03C174"]} />
        <StatCard number={stats.checkedOut} label="Check Out" colors={["#146070","#03C174"]} />
        <StatCard number={stats.stillIn} label="Still In" colors={["#146070","#03C174"]} />
      </View>
      
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search visitors..." 
          value={searchQuery} 
          onChangeText={setSearchQuery} 
          placeholderTextColor="#999" 
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchQuery("")}>
            <MaterialIcons name="close" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Footer (Pagination)
  const FooterComponent = () => (
    <View style={styles.pagination}>
      <Pressable 
        style={[styles.paginationBtn, currentPage === 1 && styles.paginationBtnDisabled]} 
        onPress={() => setCurrentPage(p => Math.max(1, p - 1))} 
        disabled={currentPage === 1}
      >
        <MaterialIcons name="chevron-left" size={20} color={currentPage === 1 ? "#ccc" : "#146070"} />
      </Pressable>
      <Text style={styles.paginationText}>
        Page {currentPage} of {totalPages} • {filteredVisitors.length} visitors
      </Text>
      <Pressable 
        style={[styles.paginationBtn, currentPage === totalPages && styles.paginationBtnDisabled]} 
        onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
        disabled={currentPage === totalPages}
      >
        <MaterialIcons name="chevron-right" size={20} color={currentPage === totalPages ? "#ccc" : "#146070"} />
      </Pressable>
    </View>
  );

  // Enhanced Empty Component
  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#146070" />
          <Text style={styles.emptyTitle}>Loading Visitors...</Text>
          <Text style={styles.emptySubtitle}>Please wait while we fetch visitor data</Text>
        </>
      ) : error ? (
        <>
          <MaterialIcons name="error-outline" size={80} color="#ff6b6b" />
          <Text style={styles.emptyTitle}>Error Loading Visitors</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchVisitors}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <MaterialIcons name="people-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Visitors Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 
              `No visitors match your search "${searchQuery}"` : 
              `No visitor data available for Unit ID: ${currentUnitId}`
            }
          </Text>
          {!searchQuery && (
            <TouchableOpacity style={styles.retryButton} onPress={fetchVisitors}>
              <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={paginatedVisitors}
        keyExtractor={item => item.id}
        ListHeaderComponent={HeaderComponent}
        ListFooterComponent={paginatedVisitors.length > 0 ? FooterComponent : null}
        ListEmptyComponent={EmptyComponent}
        renderItem={({ item }) => <VisitorCard item={item} onView={handleView} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchVisitors}
      />
      <VisitorDetailsModal 
        visible={modalVisible} 
        visitor={selectedVisitor} 
        onClose={() => {
          setModalVisible(false); 
          setSelectedVisitor(null);
        }} 
      />
    </SafeAreaView>
  );
}

// Styles (same as before)
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },
  listContent: { 
    paddingBottom: 20 
  },
  header: { 
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: { 
    padding: 8, 
    borderRadius: 8, 
    backgroundColor: "rgba(20, 96, 112, 0.1)",
    minWidth: 40,
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitleLine1: { 
    fontSize: 22, 
    fontWeight: "700", 
    color: "#146070",
    textAlign: "center",
    lineHeight: 26,
  },
  headerTitleLine2: { 
    fontSize: 22, 
    fontWeight: "700", 
    color: "#146070",
    textAlign: "center",
    lineHeight: 26,
    marginTop: -2,
  },
  addButton: { 
    borderRadius: 8, 
    overflow: "hidden", 
    elevation: 3, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4,
    minWidth: 70,
  },
  addButtonGradient: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    gap: 4,
    justifyContent: "center",
  },
  addButtonText: { 
    color: "#fff", 
    fontSize: 12, 
    fontWeight: "600" 
  },
  statsContainer: { 
    flexDirection: "row", 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    justifyContent: "space-between", 
    backgroundColor: "#fff",
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statCard: { 
    flex: 1, 
    paddingVertical: 16, 
    paddingHorizontal: 12, 
    borderRadius: 12, 
    marginHorizontal: 4, 
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  statNumber: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: "#fff", 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 11, 
    color: "#fff", 
    textAlign: "center", 
    opacity: 0.9,
    fontWeight: "500",
  },
  searchContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    marginHorizontal: 20, 
    marginVertical: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderWidth: 1, 
    borderColor: "#e0e0e0", 
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: { 
    marginRight: 12 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 14, 
    color: "#333", 
    paddingVertical: 0,
  },
  clearSearchButton: { 
    padding: 6,
    marginLeft: 8,
  },
 card: { 
    backgroundColor: "#fff", 
    marginHorizontal: 20, 
    marginVertical: 6, 
    borderRadius: 16, 
    padding: 16, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 3,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.05)",
  },
  cardHeader: { 
    marginBottom: 12 
  },
  visitorInfo: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1, 
    gap: 12 
  },
  visitorTextInfo: { 
    flex: 1 
  },
  visitorName: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: "#333", 
    marginBottom: 2 
  },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  statusText: { 
    color: "#fff", 
    fontSize: 10, 
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  phoneNumber: { 
    fontSize: 14, 
    color: "#666",
    fontWeight: "500",
  },
  cardContent: { 
    marginBottom: 16 
  },
  infoRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 8, 
    alignItems: "center" 
  },
  infoLabel: { 
    fontSize: 13, 
    color: "#666", 
    fontWeight: "500", 
    flex: 1 
  },
  infoValue: { 
    fontSize: 13, 
    color: "#333", 
    flex: 2, 
    textAlign: "right",
    fontWeight: "400",
  },
  cardActions: { 
    flexDirection: "row", 
    justifyContent: "flex-end" 
  },
  actionBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    gap: 6 
  },
  viewBtn: { 
    backgroundColor: "#f0f9ff", 
    borderWidth: 1, 
    borderColor: "#146070" 
  },
  actionBtnText: { 
    fontSize: 12, 
    fontWeight: "600" 
  },
  viewBtnText: { 
    color: "#146070" 
  },
  pagination: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: "#fff", 
    marginHorizontal: 20, 
    marginTop: 12, 
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  paginationBtn: { 
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  paginationBtnDisabled: { 
    opacity: 0.3 
  },
  paginationText: { 
    fontSize: 12, 
    color: "#666", 
    fontWeight: "500" 
  },
  emptyContainer: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 80, 
    paddingHorizontal: 40 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: "#666", 
    marginTop: 16, 
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: { 
    fontSize: 14, 
    color: "#999", 
    textAlign: "center", 
    lineHeight: 20, 
    marginBottom: 24 
  },
  retryButton: { 
    backgroundColor: "#146070", 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: { 
    color: "#fff", 
    fontSize: 14, 
    fontWeight: "600" 
  },
  modalBackdrop: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  modalSheet: { 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    maxHeight: "85%", 
    width: "90%", 
    overflow: "hidden",
    elevation: 10,
  },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    paddingVertical: 16 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#fff" 
  },
  closeButton: { 
    padding: 4 
  },
  modalContent: { 
    padding: 20 
  },
  visitorPhotoSection: { 
    marginBottom: 24, 
    paddingBottom: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: "#f0f0f0" 
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#146070", 
    marginBottom: 12, 
    textTransform: "uppercase", 
    letterSpacing: 0.5 
  },
  photoContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#f8f9fa", 
    padding: 16, 
    borderRadius: 12, 
    gap: 16 
  },
  photoInfo: { 
    flex: 1, 
    gap: 8 
  },
  photoName: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#333" 
  },
  photoBadge: { 
    fontSize: 13, 
    color: "#666", 
    fontWeight: "500" 
  },
  photoStatus: { 
    alignSelf: "flex-start", 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  photoStatusText: { 
    color: "#fff", 
    fontSize: 10, 
    fontWeight: "600" 
  },
  detailsSection: { 
    marginBottom: 20, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: "#f0f0f0" 
  },
  detailRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 12, 
    paddingBottom: 8, 
    borderBottomWidth: 0.5, 
    borderBottomColor: "#f5f5f5" 
  },
  detailLabel: { 
    fontSize: 13, 
    color: "#666", 
    fontWeight: "500", 
    flex: 1 
  },
  detailValue: { 
    fontSize: 13, 
    color: "#333", 
    flex: 2, 
    textAlign: "right", 
    fontWeight: "400" 
  },
});
