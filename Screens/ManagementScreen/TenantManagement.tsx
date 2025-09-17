import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// API Configuration
const API_CONFIG = {
  url: 'https://applianceservicemgmt.dev2stage.in/api/rest/Invoke',
  authKey: '86A264E4-ECF8-4627-AF83-5512FE83DAE6',
  hostKey: '8ECB211D2',
};

interface Tenant {
  id: string;
  name: string;
  unitNumber: string;
  phone: string;
  email: string;
  leaseStartDate: string;
  leaseEndDate: string;
  rentAmount: number;
  status: 'active' | 'inactive' | 'pending';
  profileImage?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  occupation: string;
  company: string;
  moveInDate: string;
  securityDeposit: number;
  documents: string[];
  notes: string;
  // Additional fields from API
  firstName?: string;
  lastName?: string;
  unitName?: string;
  societyName?: string;
  contactId?: string;
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  isApproved?: boolean;
  tenantStatusId?: string;
  isActive?: boolean;
  isAccess?: boolean;
  tenantGUID?: string;
}

const TenantManagement: React.FC = () => {
  const navigation = useNavigation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [error, setError] = useState('');

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
  });

  // Handle back navigation
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Transform API response to Tenant object
  const transformApiResponse = (item: any): Tenant => {
    return {
      id: String(item.Tenant_Id || item.Id || Math.random()),
      name: `${item.First_Name || ''} ${item.Last_Name || ''}`.trim() || 'N/A',
      firstName: item.First_Name || '',
      lastName: item.Last_Name || '',
      unitNumber: item.Unit_Name || item.Unit_Number || 'N/A',
      phone: item.Mobile_Number || item.Contact_Number || item.Phone_Number || 'N/A',
      email: item.Email || 'N/A',
      leaseStartDate: item.Effective_Start_Date || item.Lease_Start_Date || 'N/A',
      leaseEndDate: item.Effective_End_Date || item.Lease_End_Date || 'N/A',
      rentAmount: item.Rent_Amount || 0,
      status: item.Is_Active === 1 ? 'active' : (item.Is_Active === 0 ? 'inactive' : 'pending'),
      profileImage: item.Profile_Image || '',
      emergencyContact: {
        name: item.Emergency_Contact_Name || 'N/A',
        phone: item.Emergency_Contact_Phone || 'N/A',
        relation: item.Emergency_Contact_Relation || 'N/A',
      },
      occupation: item.Occupation || 'N/A',
      company: item.Company || 'N/A',
      moveInDate: item.Move_In_Date || item.Effective_Start_Date || 'N/A',
      securityDeposit: item.Security_Deposit || 0,
      documents: item.Documents ? item.Documents.split(',') : [],
      notes: item.Notes || item.Remarks || '',
      unitName: item.Unit_Name || '',
      societyName: item.Society_Name || '',
      contactId: item.Contact_Id || '',
      effectiveStartDate: item.Effective_Start_Date || '',
      effectiveEndDate: item.Effective_End_Date || '',
      approvedBy: item.Approved_By || '',
      approvedDate: item.Approved_Date || '',
      isApproved: item.Is_Approved === 1 || item.Is_Approved === true,
      tenantStatusId: item.Tenant_Status_Id || '',
      isActive: item.Is_Active === 1 || item.Is_Active === true,
      isAccess: item.Is_Access === 1 || item.Is_Access === true,
      tenantGUID: item.Tenant_GUID || '',
    };
  };

  // Fetch tenants from API
  const fetchTenants = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    
    try {
      console.log('Fetching tenants from API...');

      // Build parameter string for the stored procedure
      const valuesString = `@p_Tenant_Id=NULL,@p_Society_Id=7,@p_Society_GUID=NULL,@p_Contact_Id=NULL,@p_Unit_Id=280,@p_From_Effective_Start_Date=NULL,@p_To_Effective_Start_Date=NULL,@p_From_Effective_End_Date=NULL,@p_To_Effective_End_Date=NULL,@p_Approved_By=NULL,@p_From_Approved_Date=NULL,@p_To_Approved_Date=NULL,@p_Is_Approved=NULL,@p_Tenant_Status_Id=NULL,@p_Profile_Image=NULL,@p_Attribute1=NULL,@p_Attribute2=NULL,@p_Attribute3=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Is_Active=NULL,@p_Is_Archived=NULL,@p_Skip=0,@p_Take=50000,@p_Email=NULL,@p_First_Name=NULL,@p_Is_Access=NULL,@p_Tenant_GUID=NULL`;

      // Prepare request body
      const requestBody = new URLSearchParams({
        AuthKey: API_CONFIG.authKey,
        HostKey: API_CONFIG.hostKey,
        Object: "TEN_SP_Tenant_Get",
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

      const result = JSON.parse(responseText);
      console.log('Parsed API Response:', result);

      // Transform API response into Tenant array
      let transformedData: Tenant[] = [];
      if (result?.Data && Array.isArray(result.Data)) {
        console.log('Found Data array with length:', result.Data.length);
        transformedData = result.Data.map((item: any) => transformApiResponse(item));
      } else if (Array.isArray(result)) {
        console.log('Found direct array with length:', result.length);
        transformedData = result.map((item: any) => transformApiResponse(item));
      } else if (result?.data && Array.isArray(result.data)) {
        console.log('Found data array with length:', result.data.length);
        transformedData = result.data.map((item: any) => transformApiResponse(item));
      } else if (result?.Result && Array.isArray(result.Result)) {
        console.log('Found Result array with length:', result.Result.length);
        transformedData = result.Result.map((item: any) => transformApiResponse(item));
      } else if (typeof result === 'object' && result !== null) {
        console.log('Found single object, converting to array');
        transformedData = [transformApiResponse(result)];
      } else {
        console.log('No recognizable data structure found');
        transformedData = [];
      }

      console.log('Final transformed tenants:', transformedData);
      setTenants(transformedData);
      setFilteredTenants(transformedData);
      calculateStats(transformedData);

      if (transformedData.length === 0) {
        setError('No tenants found for this society');
      }
      
    } catch (error: any) {
      console.error('Error fetching tenants:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setError(errorMessage);
      Alert.alert('API Error', `Failed to fetch tenants: ${errorMessage}`);
      setTenants([]);
      setFilteredTenants([]);
      calculateStats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate statistics
  const calculateStats = (tenantsData: Tenant[]) => {
    const total = tenantsData.length;
    const active = tenantsData.filter(t => t.status === 'active').length;
    const inactive = tenantsData.filter(t => t.status === 'inactive').length;
    const pending = tenantsData.filter(t => t.status === 'pending').length;
    
    setStats({ total, active, inactive, pending });
  };

  // Initial load
  useEffect(() => {
    fetchTenants();
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTenants(false);
  }, []);

  // Search and filter functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(query, filterStatus);
  };

  const handleStatusFilter = (status: 'all' | 'active' | 'inactive' | 'pending') => {
    setFilterStatus(status);
    applyFilters(searchQuery, status);
  };

  const applyFilters = (query: string, status: string) => {
    let filtered = [...tenants];

    // Apply search filter
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(tenant =>
        tenant.name.toLowerCase().includes(searchLower) ||
        tenant.unitNumber.toLowerCase().includes(searchLower) ||
        tenant.phone.includes(searchLower) ||
        tenant.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(tenant => tenant.status === status);
    }

    setFilteredTenants(filtered);
  };

  // View tenant details
  const handleViewTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setModalVisible(true);
  };

  // Navigate to Add Tenant
  const handleAddTenant = () => {
    try {
      navigation.navigate('AddTenant' as never);
    } catch (error) {
      Alert.alert('Navigate', 'Navigate to Add Tenant page');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#03C174';
      case 'inactive':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  // Render tenant card
  const renderTenantCard = ({ item }: { item: Tenant }) => (
    <View style={styles.tenantCard}>
      <View style={styles.cardHeader}>
        <View style={styles.tenantInfo}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#146070', '#03C174']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
          <View style={styles.tenantDetails}>
            <Text style={styles.tenantName}>{item.name}</Text>
            <Text style={styles.unitNumber}>Unit: {item.unitNumber}</Text>
            <Text style={styles.tenantPhone}>{item.phone}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={14} color="#666" />
          <Text style={styles.infoText} numberOfLines={1}>{item.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.infoText}>Lease: {item.leaseStartDate} - {item.leaseEndDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="card-outline" size={14} color="#666" />
          <Text style={styles.infoText}>₹{item.rentAmount.toLocaleString()}/month</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewTenant(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={16} color="#146070" />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#f8fafc', '#e2e8f0']}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="people-outline" size={48} color="#94a3b8" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No Tenants Found</Text>
      <Text style={styles.emptySubtext}>
        {tenants.length === 0
          ? "There are no tenants to display. Add your first tenant to get started."
          : "No tenants match your search criteria. Try adjusting your filters."
        }
      </Text>
      {tenants.length === 0 && (
        <TouchableOpacity style={styles.addFirstTenantButton} onPress={handleAddTenant}>
          <LinearGradient
            colors={['#146070', '#03C174']}
            style={styles.addFirstTenantGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addFirstTenantText}>Add First Tenant</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  // Tenant details modal
  const TenantDetailsModal = () => (
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
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.modalTitle}>Tenant Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {selectedTenant && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Personal Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.name}</Text>
                </View>
                 <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.phone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Occupation:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.occupation}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Company:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.company}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Lease Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Unit Number:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.unitNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Society:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.societyName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Lease Start:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.leaseStartDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Lease End:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.leaseEndDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Move-in Date:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.moveInDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Monthly Rent:</Text>
                  <Text style={styles.detailValue}>₹{selectedTenant.rentAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Security Deposit:</Text>
                  <Text style={styles.detailValue}>₹{selectedTenant.securityDeposit.toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTenant.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedTenant.status) }]}>
                      {getStatusLabel(selectedTenant.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Approved:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.isApproved ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Approved By:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.approvedBy}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Approved Date:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.approvedDate}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Emergency Contact</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.emergencyContact.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.emergencyContact.phone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Relation:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.emergencyContact.relation}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Access Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Has Access:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.isAccess ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tenant GUID:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.tenantGUID}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact ID:</Text>
                  <Text style={styles.detailValue}>{selectedTenant.contactId}</Text>
                </View>
              </View>

              {selectedTenant.notes && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Notes</Text>
                  <Text style={styles.notesText}>{selectedTenant.notes}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#146070" />

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#146070']}
            tintColor="#146070"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBackPress}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#146070" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Tenant Management</Text>
                <Text style={styles.headerSubtitle}>Manage your tenants</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddTenant}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#146070', '#03C174']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Display */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => fetchTenants()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total.toString().padStart(2, '0')}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#03C174' }]}>
                {stats.active.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
                {stats.pending.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#ef4444' }]}>
                {stats.inactive.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.statLabel}>Inactive</Text>
            </View>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tenants..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'active', 'pending', 'inactive'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterPill,
                  filterStatus === status && styles.filterPillActive,
                ]}
                onPress={() => handleStatusFilter(status)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterStatus === status && styles.filterPillTextActive,
                  ]}
                >
                  {status === 'all' ? 'All' : getStatusLabel(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tenants List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#146070" />
              <Text style={styles.loadingText}>Loading tenants...</Text>
            </View>
          ) : filteredTenants.length === 0 ? (
            <EmptyState />
          ) : (
            <View style={styles.tenantsContainer}>
              {filteredTenants.map((item) => (
                <View key={item.id}>
                  {renderTenantCard({ item })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TenantDetailsModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },

  // Header Styles
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(20, 96, 112, 0.1)',
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#146070',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Error Display
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

  // Stats Styles
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#146070',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },

  // Filter Styles
  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterPillActive: {
    backgroundColor: '#146070',
    borderColor: '#146070',
  },
  filterPillText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // List Styles
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  tenantsContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },

  // Tenant Card Styles
  tenantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tenantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  tenantDetails: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  unitNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  tenantPhone: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
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

  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  addFirstTenantButton: {
    borderRadius: 12,
  },
  addFirstTenantGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFirstTenantText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
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
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
});

export default TenantManagement;
