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

  // UPDATED: Transform API response function to match your exact database structure
  const transformApiResponse = (item: any): Owner => {
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
      profileImage: getFirstValidValue(item.Profile_Image) || '',
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

  // UPDATED: Improved API call with better error handling and response parsing
  const loadOwners = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Fetching owners from API...');

      // Build parameter string for the stored procedure - using Society_Id=7 and Unit_Id=280 from your data
      const valuesString = `@p_Owner_Id=NULL,@p_Society_Id=7,@p_Society_GUID=NULL,@p_Contact_Id=NULL,@p_Unit_Id=280,@p_From_Effective_Start_Date=NULL,@p_To_Effective_Start_Date=NULL,@p_From_Effective_End_Date=NULL,@p_To_Effective_End_Date=NULL,@p_Approved_By=NULL,@p_From_Approved_Date=NULL,@p_To_Approved_Date=NULL,@p_Profile_Image=NULL,@p_Occupied_Type=NULL,@p_Attribute2=NULL,@p_Attribute3=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Owner_Status_Id=NULL,@p_Is_Active=NULL,@p_Is_Archived=NULL,@p_Skip=0,@p_Take=50000,@p_Email=NULL,@p_First_Name=NULL,@p_Is_Primary=NULL,@p_Is_Access=NULL,@p_Owner_GUID=NULL`;

      // Prepare request body
      const requestBody = new URLSearchParams({
        AuthKey: API_CONFIG.authKey,
        HostKey: API_CONFIG.hostKey,
        Object: "OWM_SP_Owner_Get",
        Values: valuesString,
      }).toString();

      console.log('API Request Body:', requestBody);

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
      console.log('Raw API Response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      console.log('Parsed API Response:', JSON.stringify(result, null, 2));

      // UPDATED: More comprehensive response parsing
      let transformedData: Owner[] = [];
      let rawData: any[] = [];

      // Try multiple ways to extract the data array based on common API response patterns
      if (result && Array.isArray(result)) {
        console.log('Found direct array with length:', result.length);
        rawData = result;
      } else if (result?.Data && Array.isArray(result.Data)) {
        console.log('Found Data array with length:', result.Data.length);
        rawData = result.Data;
      } else if (result?.data && Array.isArray(result.data)) {
        console.log('Found data array with length:', result.data.length);
        rawData = result.data;
      } else if (result?.Result && Array.isArray(result.Result)) {
        console.log('Found Result array with length:', result.Result.length);
        rawData = result.Result;
      } else if (result?.results && Array.isArray(result.results)) {
        console.log('Found results array with length:', result.results.length);
        rawData = result.results;
      } else if (result?.Records && Array.isArray(result.Records)) {
        console.log('Found Records array with length:', result.Records.length);
        rawData = result.Records;
      } else if (result?.records && Array.isArray(result.records)) {
        console.log('Found records array with length:', result.records.length);
        rawData = result.records;
      } else if (typeof result === 'object' && result !== null) {
        // If it's a single object, wrap it in an array
        console.log('Found single object, converting to array');
        rawData = [result];
      } else {
        console.log('No recognizable data structure found. Full response:', result);
        rawData = [];
      }

      // Transform the raw data
      if (rawData.length > 0) {
        console.log('Sample raw data item:', JSON.stringify(rawData, null, 2));
        transformedData = rawData.map((item: any) => transformApiResponse(item));
      }

      console.log('Final transformed owners:', transformedData.length, 'items');
      setOwners(transformedData);
      setFilteredOwners(transformedData);

      if (transformedData.length === 0) {
        setError('No owners found for this society');
      }

    } catch (error: any) {
      console.error('API Error:', error);
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

  // Owner Card Component - Compact design without icons
  const OwnerCard = ({ owner, index }: { owner: Owner; index: number }) => (
    <View style={styles.ownerCard}>
      {/* Card Header - Compact */}
      <View style={styles.cardHeader}>
        <View style={styles.ownerInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {owner.ownerName?.split(' ').map(n => n).join('').toUpperCase() || 'UN'}
            </Text>
          </View>
          <View style={styles.ownerDetails}>
            <Text style={styles.ownerName}>{owner.ownerName}</Text>
            <Text style={styles.unitText}>{owner.spaceDetails}</Text>
          </View>
        </View>
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>#{index + startIndex + 1}</Text>
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

  // UPDATED: Owner Details Modal with better data display
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
          
          <TouchableOpacity  
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AddOwner" as never)}
          >
            <LinearGradient
              colors={['#146070', '#03C174']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButton}
            >
              <Ionicons name="add" size={18} color="#fff" style={styles.addIcon} />
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
              onPress={loadOwners}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
            <TouchableOpacity
              style={styles.searchDropdown}
              onPress={() => setShowAdvancedSearch(!showAdvancedSearch)}
            >
              <Ionicons 
                name="options" 
                size={18} 
                color="#146070" 
              />
            </TouchableOpacity>
          </View>
          
          {/* Advanced Search Options */}
          {showAdvancedSearch && (
            <View style={styles.advancedSearchContainer}>
              <View style={styles.filterRow}>
                <TouchableOpacity style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Name</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Contact</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Unit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

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

// Styles remain the same as your original code
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#03C174',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 85,
  },
  addIcon: {
    marginRight: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
    height: 52,
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
  advancedSearchContainer: {
    backgroundColor: '#fff',
    marginTop: 12,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8F4F3',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterChip: {
    backgroundColor: '#F0F8F7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E8F4F3',
  },
  filterChipText: {
    color: '#146070',
    fontSize: 12,
    fontWeight: '500',
  },
  // Stats Section with Linear Gradient
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#146070',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    minHeight: 100,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#d2f4ea',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  cardsContainer: {
    paddingHorizontal: 24,
  },
  // UPDATED: Compact Owner Card without icons
  ownerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    overflow: 'hidden',
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#146070',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#146070',
    marginBottom: 2,
  },
  unitText: {
    fontSize: 13,
    color: '#7A9B9B',
    fontWeight: '500',
  },
  cardBadge: {
    backgroundColor: '#f0f8f7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8f4f3',
  },
  cardBadgeText: {
    color: '#146070',
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  cardLabel: {
    fontSize: 11,
    color: '#7A9B9B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  cardValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
