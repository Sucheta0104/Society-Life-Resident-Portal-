import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Define TypeScript interface for unit data
interface UnitData {
  id?: number;
  space?: string;
  floor?: number;
  buildArea?: number;
  carpetArea?: number;
  owner?: string;
  unitName?: string;
  superBuiltArea?: number;
  numberOfRooms?: number;
  numberOfBathrooms?: number;
  numberOfBalconies?: number;
  contactNumber?: string;
}

export default function SpaceManagementApp() {
  // Initialize navigation
  const navigation = useNavigation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [unitData, setUnitData] = useState<UnitData[]>([]);
  const [filteredData, setFilteredData] = useState<UnitData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState({
    floor: '',
    minBuildArea: '',
    maxBuildArea: '',
    minCarpetArea: '',
    maxCarpetArea: '',
    owner: '',
  });

  // API Configuration
  const API_CONFIG = {
    url: 'https://applianceservicemgmt.dev2stage.in/api/rest/Invoke',
    authKey: '86A264E4-ECF8-4627-AF83-5512FE83DAE6',
    hostKey: '8ECB211D2',
  };

  // Handle back navigation
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Fetch unit data from API with improved error handling
  const fetchUnitData = async (unitId: number = 280) => {
    setLoading(true);
    setError("");

    try {
      console.log("Starting API call...");

      // Build request body string
      const valuesString = `@p_Unit_Id=${unitId},@p_Society_Id=NULL,@p_Block_Id=NULL,@p_Floor=NULL,@p_Society_GUID=NULL,@p_Unit_Type_Id=NULL,@p_Unit_Name=NULL,@p_Builtup_Area=NULL,@p_Carpet_Area=NULL,@p_Super_Built_Area=NULL,@p_Number_Of_Room=NULL,@p_Number_Of_Bathroom=NULL,@p_Number_Of_Balcony=NULL,@p_Contact_Number=NULL,@p_Current_Occupancy_Type_Id=NULL,@p_Unit_Status_Id=NULL,@p_Attribute1=NULL,@p_Attribute2=NULL,@p_Attribute3=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Attribute10=NULL,@p_Is_Active=1,@p_Is_Archived=0,@p_Skip=0,@p_Take=10,@p_First_Name=NULL,@p_Is_Primary=NULL,@p_Email=NULL`;

      const requestBody = new URLSearchParams({
        AuthKey: API_CONFIG.authKey,
        HostKey: API_CONFIG.hostKey,
        Object: "UNM_SP_Unit_Get",
        Values: valuesString,
      }).toString();

      console.log("Request Body:", requestBody);

      // API call
      const response = await fetch(API_CONFIG.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: requestBody,
      });

      console.log("Response Status:", response.status);

      const responseText = await response.text();
      console.log("Response Text:", responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      // Parse JSON safely
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log("Parsed API Response:", result);

      // Normalize API response into array
      let transformedData: UnitData[] = [];
      if (result?.Data) {
        transformedData = result.Data.map((item: any, i: number) =>
          transformApiResponse(item, i)
        );
      } else if (Array.isArray(result)) {
        transformedData = result.map((item: any, i: number) =>
          transformApiResponse(item, i)
        );
      } else if (typeof result === "object") {
        transformedData = [transformApiResponse(result, 0)];
      }

      console.log("Transformed Data:", transformedData);

      setUnitData(transformedData);
      setFilteredData(transformedData);
    } catch (error) {
      console.error("Detailed Error:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      setUnitData([]);
      setFilteredData([]);

      Alert.alert(
        "API Error",
        `Failed to fetch data: ${error instanceof Error ? error.message : "Unknown error"}`,
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Transform API response to component data structure
  const transformApiResponse = (item: any, index: number): UnitData => ({
    id: item.Unit_Id || index + 1,
    space: item.Unit_Name || `Unit ${item.Unit_Id || index + 1}`,
    floor: item.Floor || 0,
    buildArea: item.Builtup_Area || 0,
    carpetArea: item.Carpet_Area || 0,
    superBuiltArea: item.Super_Built_Area || 0,
    owner: item.Owner_FirstName
      ? `${item.Owner_FirstName} ${item.Owner_LastName || ''}`.trim()
      : 'N/A',
    unitName: item.Unit_Name || '',
    numberOfRooms: item.Number_Of_Room || 0,
    numberOfBathrooms: item.Number_Of_Bathroom || 0,
    numberOfBalconies: item.Number_Of_Balcony || 0,
    contactNumber: item.Owner_Mobile_Number || item.Contact_Number || '',
  });

  // Alternative API call method - try if the first one fails
  const fetchUnitDataAlternative = async (unitId: number = 280) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Trying alternative API call format...');
      
      // Alternative request format
      const requestBody = {
        "StoredProcedure": "UNM_SP_Unit_Get",
        "Parameters": {
          "p_Unit_Id": unitId,
          "p_Society_Id": null,
          "p_Block_Id": null,
          "p_Floor": null,
          "p_Society_GUID": null,
          "p_Unit_Type_Id": null,
          "p_Unit_Name": null,
          "p_Builtup_Area": null,
          "p_Carpet_Area": null,
          "p_Super_Built_Area": null,
          "p_Number_Of_Room": null,
          "p_Number_Of_Bathroom": null,
          "p_Number_Of_Balcony": null,
          "p_Contact_Number": null,
          "p_Current_Occupancy_Type_Id": null,
          "p_Unit_Status_Id": null,
          "p_Attribute1": null,
          "p_Attribute2": null,
          "p_Attribute3": null,
          "p_Attribute4": null,
          "p_Attribute5": null,
          "p_Attribute6": null,
          "p_Attribute7": null,
          "p_Attribute8": null,
          "p_Attribute9": null,
          "p_Attribute10": null,
          "p_Is_Active": 1,
          "p_Is_Archived": 0,
          "p_Skip": 0,
          "p_Take": 10,
          "p_First_Name": null,
          "p_Is_Primary": null,
          "p_Email": null
        }
      };

      console.log('Alternative Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.authKey}`,
          'X-Host-Key': API_CONFIG.hostKey,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('Alternative Response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      // Process result similar to the main method
      // ... (rest of the processing logic)

    } catch (error) {
      console.error('Alternative method also failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchUnitData();
  }, []);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Search and filter logic
  useEffect(() => {
    let filtered = unitData;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.space?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.owner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.floor?.toString().includes(searchQuery) ||
        item.buildArea?.toString().includes(searchQuery) ||
        item.carpetArea?.toString().includes(searchQuery)
      );
    }

    if (filters.floor) {
      filtered = filtered.filter(item => item.floor?.toString() === filters.floor);
    }
    if (filters.minBuildArea) {
      filtered = filtered.filter(item => (item.buildArea || 0) >= parseFloat(filters.minBuildArea));
    }
    if (filters.maxBuildArea) {
      filtered = filtered.filter(item => (item.buildArea || 0) <= parseFloat(filters.maxBuildArea));
    }
    if (filters.minCarpetArea) {
      filtered = filtered.filter(item => (item.carpetArea || 0) >= parseFloat(filters.minCarpetArea));
    }
    if (filters.maxCarpetArea) {
      filtered = filtered.filter(item => (item.carpetArea || 0) <= parseFloat(filters.maxCarpetArea));
    }
    if (filters.owner) {
      filtered = filtered.filter(item =>
        item.owner?.toLowerCase().includes(filters.owner.toLowerCase())
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchQuery, filters, unitData]);

  const clearFilters = () => {
    setFilters({
      floor: '',
      minBuildArea: '',
      maxBuildArea: '',
      minCarpetArea: '',
      maxCarpetArea: '',
      owner: '',
    });
    setSearchQuery('');
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerText, { width: width * 0.15 }]}>Unit</Text>
      <Text style={[styles.headerText, { width: width * 0.12 }]}>Floor</Text>
      <Text style={[styles.headerText, { width: width * 0.18 }]}>Build Area</Text>
      <Text style={[styles.headerText, { width: width * 0.18 }]}>Carpet Area</Text>
      <Text style={[styles.headerText, { width: width * 0.25 }]}>Owner</Text>
    </View>
  );

  const renderTableRow = ({ item, index }: { item: UnitData; index: number }) => (
    <View style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff' }]}>
      <Text style={[styles.cellText, { width: width * 0.15 }]}>{item.space || 'N/A'}</Text>
      <Text style={[styles.cellText, { width: width * 0.12 }]}>{item.floor || 'N/A'}</Text>
      <Text style={[styles.cellText, { width: width * 0.18 }]}>{item.buildArea || 'N/A'}</Text>
      <Text style={[styles.cellText, { width: width * 0.18 }]}>{item.carpetArea || 'N/A'}</Text>
      <Text style={[styles.cellText, { width: width * 0.25 }]} numberOfLines={2} ellipsizeMode="tail">
        {item.owner || 'N/A'}
      </Text>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      <View style={styles.paginationTop}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
          onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? '#ccc' : '#2563eb'} />
        </TouchableOpacity>

        <View style={styles.pageNumbers}>
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 3) {
              pageNum = i + 1;
            } else if (currentPage <= 2) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 1) {
              pageNum = totalPages - 2 + i;
            } else {
              pageNum = currentPage - 1 + i;
            }

            return (
              <TouchableOpacity
                key={pageNum}
                style={[
                  styles.pageButton,
                  currentPage === pageNum && styles.activePageButton
                ]}
                onPress={() => setCurrentPage(pageNum)}
              >
                <Text style={[
                  styles.pageButtonText,
                  currentPage === pageNum && styles.activePageButtonText
                ]}>
                  {pageNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
          onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          <Ionicons name="chevron-forward" size={18} color={currentPage === totalPages ? '#ccc' : '#2563eb'} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.paginationInfo}>
        Page {currentPage} of {totalPages} • {filteredData.length} items
      </Text>
    </View>
  );

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Advanced Filters</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Floor No</Text>
            <TextInput
              style={styles.filterInput}
              value={filters.floor}
              onChangeText={(text) => setFilters(prev => ({ ...prev, floor: text }))}
              placeholder="Enter floor number"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Build Area Range (Sqf)</Text>
            <View style={styles.rangeInputContainer}>
              <TextInput
                style={[styles.filterInput, { flex: 1, marginRight: 8 }]}
                value={filters.minBuildArea}
                onChangeText={(text) => setFilters(prev => ({ ...prev, minBuildArea: text }))}
                placeholder="Min"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.filterInput, { flex: 1 }]}
                value={filters.maxBuildArea}
                onChangeText={(text) => setFilters(prev => ({ ...prev, maxBuildArea: text }))}
                placeholder="Max"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Carpet Area Range (Sqf)</Text>
            <View style={styles.rangeInputContainer}>
              <TextInput
                style={[styles.filterInput, { flex: 1, marginRight: 8 }]}
                value={filters.minCarpetArea}
                onChangeText={(text) => setFilters(prev => ({ ...prev, minCarpetArea: text }))}
                placeholder="Min"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.filterInput, { flex: 1 }]}
                value={filters.maxCarpetArea}
                onChangeText={(text) => setFilters(prev => ({ ...prev, maxCarpetArea: text }))}
                placeholder="Max"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Owner</Text>
            <TextInput
              style={styles.filterInput}
              value={filters.owner}
              onChangeText={(text) => setFilters(prev => ({ ...prev, owner: text }))}
              placeholder="Enter owner name"
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header with Back Arrow */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#059669" />
          </TouchableOpacity>
          <Text style={styles.title}>Unit Management</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={() => fetchUnitData()}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Display */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => fetchUnitData()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Search Section */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by unit, owner, floor, area..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={18} color="#6b7280" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options" size={18} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Info */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {searchQuery ? `Search: "${searchQuery}" • ` : ''}
          Showing {currentItems.length} of {filteredData.length} results
          {filteredData.length !== unitData.length ? ` (filtered from ${unitData.length})` : ''}
        </Text>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#03C174" />
          <Text style={styles.loadingText}>Loading unit data...</Text>
        </View>
      )}

      {/* Table Container */}
      <View style={styles.tableContainer}>
        {renderTableHeader()}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScrollContainer}>
          <View style={{ minWidth: width * 0.9 }}>
            <FlatList
              data={currentItems}
              renderItem={renderTableRow}
              keyExtractor={(item, index) => item.id?.toString() || index.toString()}
              showsVerticalScrollIndicator={false}
              style={styles.tableList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {loading ? 'Loading...' : error ? 'Error loading data' : 'No data available'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {loading ? 'Please wait while we fetch the data' : 
                     error ? 'Check console for error details' :
                     'Unit data will appear here once loaded from API'}
                  </Text>
                </View>
              }
            />
          </View>
        </ScrollView>
      </View>

      {/* Pagination */}
      {filteredData.length > 0 && renderPagination()}

      {/* Filter Modal */}
      <FilterModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f9ff',
  },
  debugButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fef3c7',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    margin: 16,
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    height: 42,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '400',
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterButton: {
    padding: 6,
    marginLeft: 4,
  },
  clearSearchButton: {
    padding: 4,
    marginRight: 4,
  },
  resultsInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tableScrollContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  tableList: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
    minHeight: 45,
  },
  cellText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  paginationContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  paginationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paginationButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  disabledButton: {
    backgroundColor: '#f9fafb',
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 2,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    minWidth: 32,
    alignItems: 'center',
  },
  activePageButton: {
    backgroundColor: '#03C174',
  },
  pageButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  activePageButtonText: {
    color: '#ffffff',
  },
  paginationInfo: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  rangeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  clearButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#03C174',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});
