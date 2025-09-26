import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";

const API_CONFIG = {
  url: 'https://applianceservicemgmt.dev2stage.in/api/rest/Invoke',
  authKey: '86A264E4-ECF8-4627-AF83-5512FE83DAE6',
  hostKey: '8ECB211D2'
};

const { width } = Dimensions.get('window');

type TicketStatus = 'completed' | 'inProgress' | 'pending';
type Ticket = {
  id: string;
  date: string;
  space: string;
  category: string;
  details: string;
  requester: string;
  status: TicketStatus;
  priority: string;
  item?: string;
};

const HelpDesk = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    ticketId: '',
    category: '',
    requester: '',
    status: 'all'
  });

  const navigation = useNavigation();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const calculateStats = useCallback((ticketData: Ticket[]) => {
    const total = ticketData.length;
    const completed = ticketData.filter(t => t.status === 'completed').length;
    const inProgress = ticketData.filter(t => t.status === 'inProgress').length;
    const pending = ticketData.filter(t => t.status === 'pending').length;
    return { total, completed, inProgress, pending };
  }, []);

  const transformApiResponse = (item: any): Ticket => {
    const mapStatus = (apiStatus: string): TicketStatus => {
      const status = (apiStatus || '').toLowerCase();
      if (status.includes('complete')) return 'completed';
      if (status.includes('progress')) return 'inProgress';
      return 'pending';
    };

    const mapPriority = (apiPriority: string): string => {
      const priority = (apiPriority || '').toLowerCase();
      if (priority.includes('high')) return 'high';
      if (priority.includes('medium')) return 'medium';
      return 'low';
    };

    const formatDate = (dateStr: string): string => {
      if (!dateStr) return new Date().toLocaleDateString();
      try {
        const [day, month, year] = dateStr.split('/');
        return new Date(+year, +month - 1, +day).toLocaleDateString();
      } catch {
        return dateStr;
      }
    };

    return {
      id: String(item.Help_Desk_Id || Math.random()),
      date: formatDate(item.Request_Date),
      space: item.UNITHLPDSK_Unit_Name || 'N/A',
      category: item.CategoryHelpDesk || 'General',
      details: item.Description?.replace(/<[^>]*>/g, '') || 'No description available',
      requester: item.RequestedContact || item.First_Name || 'Unknown',
      status: mapStatus(item.Help_Status),
      priority: mapPriority(item.PriorityHelp),
      item: item.Help_Title || 'No title',
    };
  };

  const fetchTickets = async (page: number = 1, showLoading: boolean = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const valuesString = `@p_Help_Desk_Id=NULL,@p_Society_Id=7,@p_Unit_Id=280,@p_Help_Category_Id=NULL,@p_Help_Priority_Id=NULL,@p_Requested_By=NULL,@p_From_Request_Date=NULL,@p_To_Request_Date=NULL,@p_Service_Type=NULL,@p_Assign_To=NULL,@p_From_Resolve_Date=NULL,@p_To_Resolve_Date=NULL,@p_Help_Title=NULL,@p_Description=NULL,@p_Help_Status_Id=NULL,@p_Attribute1=NULL,@p_Attribute2=NULL,@p_Attribute3=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Attribute10=NULL,@p_Help_Desk_GUId=NULL,@p_Token_No=NULL,@p_Is_Active=NULL,@p_Is_Archived=NULL,@p_Skip=0,@p_Take=50000,@p_Email=NULL,@p_First_Name=NULL,@p_Mobile_Number=NULL,@p_Assign_To_Email=NULL,@p_Assign_To_First_Name=NULL,@p_Assign_To_Mobile_Number=NULL`.replace(/\s+/g, '');

      const requestBody = new URLSearchParams({
        AuthKey: API_CONFIG.authKey,
        HostKey: API_CONFIG.hostKey,
        Object: "HEM_SP_HelpDesk_Get",
        Values: valuesString,
      }).toString();

      const response = await fetch(API_CONFIG.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: requestBody,
      });

      const responseText = await response.text();

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${responseText}`);

      const result = JSON.parse(responseText);

      let transformedData: Ticket[] = [];
      if (result?.Data && Array.isArray(result.Data)) transformedData = result.Data.map(transformApiResponse);
      else if (Array.isArray(result)) transformedData = result.map(transformApiResponse);
      else if (result?.data && Array.isArray(result.data)) transformedData = result.data.map(transformApiResponse);
      else if (result?.Result && Array.isArray(result.Result)) transformedData = result.Result.map(transformApiResponse);
      else if (typeof result === "object" && result !== null) transformedData = [transformApiResponse(result)];
      else transformedData = [];

      setTickets(transformedData);
      setFilteredTickets(transformedData);
      setStats(calculateStats(transformedData));
      setCurrentPage(page);

      if (transformedData.length === 0) setError('No help desk tickets found for this unit');
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch tickets";
      setError(errorMessage);
      setTickets([]);
      setFilteredTickets([]);
      setStats({ total: 0, completed: 0, inProgress: 0, pending: 0 });
      Alert.alert("API Error", `Failed to fetch tickets: ${errorMessage}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets(currentPage);
  }, [currentPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets(1, false);
  }, []);

  const handleSearch = () => setSearchVisible(true);

  const applySearch = () => {
    let filtered = [...tickets];
    if (searchFilters.ticketId.trim()) filtered = filtered.filter(t => t.id.toLowerCase().includes(searchFilters.ticketId.toLowerCase()));
    if (searchFilters.category.trim()) filtered = filtered.filter(t => t.category.toLowerCase().includes(searchFilters.category.toLowerCase()));
    if (searchFilters.requester.trim()) filtered = filtered.filter(t => t.requester.toLowerCase().includes(searchFilters.requester.toLowerCase()));
    if (searchFilters.status !== 'all') filtered = filtered.filter(t => t.status === searchFilters.status);
    setFilteredTickets(filtered);
    setSearchVisible(false);
  };

  const clearSearch = () => {
    setSearchFilters({ ticketId: '', category: '', requester: '', status: 'all' });
    setFilteredTickets(tickets);
    setSearchVisible(false);
  };

  const getStatusText = (status: TicketStatus) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'inProgress': return 'In Progress';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderTicketCard = ({ item }: { item: Ticket }) => (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 18,
      marginBottom: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: '#dadada',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10,
      shadowRadius: 8,
      elevation: 3,
      flexDirection: 'row',
      alignItems: 'flex-start',
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 4 }}>{item.item}</Text>
        <Text style={{ fontSize: 14, color: '#555', marginBottom: 2 }}>
          Unit: <Text style={{ fontWeight: '500', color: '#0891b2' }}>{item.space}</Text>
        </Text>
        <Text style={{ fontSize: 14, color: '#555', marginBottom: 2 }}>
          Owner: <Text style={{ fontWeight: '500', color: '#146070' }}>{item.requester}</Text>
        </Text>
        <Text style={{ fontSize: 13, color: '#aaa', marginBottom: 2 }}>{item.date}</Text>
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: '#e7faf2',
          borderRadius: 8,
          paddingVertical: 6,
          paddingHorizontal: 18,
          alignSelf: 'flex-start',
        }}
        onPress={() => {
          setSelectedTicket(item);
          setViewModalVisible(true);
        }}
        activeOpacity={0.75}
      >
        <Text style={{ color: '#146070', fontWeight: '600', fontSize: 15 }}>View</Text>
      </TouchableOpacity>
    </View>
  );

  // SearchModal component as requested from your original code
  const SearchModal = () => (
    <Modal
      visible={searchVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSearchVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#146070', '#0891b2']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Advanced Search</Text>
            <TouchableOpacity onPress={() => setSearchVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          <ScrollView style={styles.searchForm} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ticket ID</Text>
              <TextInput
                style={styles.searchInput}
                value={searchFilters.ticketId}
                onChangeText={(text) => setSearchFilters({ ...searchFilters, ticketId: text })}
                placeholder="Enter ticket ID"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.searchInput}
                value={searchFilters.category}
                onChangeText={(text) => setSearchFilters({ ...searchFilters, category: text })}
                placeholder="Enter category"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Requester</Text>
              <TextInput
                style={styles.searchInput}
                value={searchFilters.requester}
                onChangeText={(text) => setSearchFilters({ ...searchFilters, requester: text })}
                placeholder="Enter requester name"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusButtonsContainer}>
                {['all', 'pending', 'inProgress', 'completed'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusFilterButton,
                      searchFilters.status === status && styles.statusFilterButtonActive
                    ]}
                    onPress={() => setSearchFilters({ ...searchFilters, status })}
                  >
                    <Text style={[
                      styles.statusFilterText,
                      searchFilters.status === status && styles.statusFilterTextActive
                    ]}>
                      {status === 'all' ? 'All' : getStatusText(status as TicketStatus)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.searchButton}
            >
              <TouchableOpacity style={styles.searchButtonInner} onPress={applySearch}>
                <Ionicons name="search" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.searchButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </View>
    </Modal>
  );

  const ViewTicketModal = () => (
    <Modal
      visible={viewModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setViewModalVisible(false)}
    >
      <View style={{
        flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center',
        alignItems: 'center', padding: 20,
      }}>
        <View style={{
          backgroundColor: '#fff', borderRadius: 18, width: '100%', maxWidth: 380,
          padding: 24, shadowColor: '#146070', shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12, shadowRadius: 24, elevation: 9,
        }}>
          <Text style={{
            fontSize: 20, fontWeight: '700', marginBottom: 6, color: '#146070',
            letterSpacing: 0.5
          }}>{selectedTicket?.item || '-'}</Text>

          <View style={{ marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#222' }}>
              Unit: <Text style={{ color: '#0891b2' }}>{selectedTicket?.space}</Text></Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#222' }}>
              Owner: <Text style={{ color: '#146070' }}>{selectedTicket?.requester}</Text></Text>
          </View>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            Date: {selectedTicket?.date}
          </Text>

          <View style={{ height: 1, backgroundColor: '#e0e8f0', marginVertical: 10 }} />

          <Text style={{ fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 4 }}>
            Category: <Text style={{ color: '#03C174' }}>{selectedTicket?.category}</Text>
          </Text>

          <Text style={{ fontSize: 15, color: '#444', marginBottom: 6 }}>
            Details: <Text style={{ color: '#475569', fontWeight: '500' }}>{selectedTicket?.details}</Text>
          </Text>

          <Text style={{ fontSize: 14, color: '#586b7b', marginBottom: 6 }}>
            Status: <Text style={{ color: '#146070', fontWeight: 'bold' }}>{getStatusText(selectedTicket?.status || 'pending')}</Text>
          </Text>

          <Text style={{ fontSize: 14, color: '#874c1b', marginBottom: 6 }}>
            Priority: <Text style={{ color: getPriorityColor(selectedTicket?.priority || 'low'), fontWeight: 'bold' }}>{selectedTicket?.priority}</Text>
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 }}>
            <TouchableOpacity
              onPress={() => setViewModalVisible(false)}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#03C174',
                borderRadius: 8,
                paddingHorizontal: 26,
                paddingVertical: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Add your EmptyState component if you need it (unchanged from your code)
  // For brevity, this example omits it but you can copy-paste from your original too.

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#146070']}
            tintColor="#146070"
          />
        }
      >
        {/* Header with Back Arrow */}
        <LinearGradient
          colors={['#fff', '#f8fafc']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#1e293b" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Help Desk</Text>
                <Text style={styles.headerSubtitle}>Manage support tickets</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.newTicketButton}
              onPress={() => {
                try {
                  navigation.navigate("CreateTicket" as never);
                } catch {
                  Alert.alert('Navigate', 'Navigate to Create Ticket page');
                }
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#146070', '#03C174']}
                style={styles.newTicketGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="add" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.newTicketText}>Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#fff', '#f8fafc']}
            style={styles.statsCard}
          >
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#3b82f6', '#1d4ed8']}
                  style={styles.statIconContainer}
                >
                  <Ionicons name="document-text" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.statNumber}>{stats.total.toString().padStart(2, '0')}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.statIconContainer}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.statNumber}>{stats.completed.toString().padStart(2, '0')}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.statIconContainer}
                >
                  <Ionicons name="time" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.statNumber}>{stats.inProgress.toString().padStart(2, '0')}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={styles.statIconContainer}
                >
                  <Ionicons name="alert-circle" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.statNumber}>{stats.pending.toString().padStart(2, '0')}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchContainer} onPress={handleSearch} activeOpacity={0.7}>
          <LinearGradient
            colors={['#fff', '#f9fafb']}
            style={styles.searchGradient}
          >
            <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Advanced Search & Filter</Text>
            <Ionicons name="options-outline" size={18} color="#6b7280" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Tickets List */}
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#146070" />
              <Text style={styles.loadingText}>Loading tickets...</Text>
            </View>
          ) : (
            <View style={styles.ticketsContainer}>
              {filteredTickets.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <LinearGradient colors={['#f8fafc', '#e2e8f0']} style={styles.emptyIconContainer}>
                    <Ionicons name="document-text-outline" size={48} color="#94a3b8" />
                  </LinearGradient>
                  <Text style={styles.emptyTitle}>{error ? 'Error Loading Tickets' : 'No Tickets Found'}</Text>
                  <Text style={styles.emptySubtext}>
                    {error ? error : 'No help desk tickets are available at the moment.'}
                  </Text>
                  {error ? (
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchTickets(1)}>
                      <LinearGradient colors={['#146070', '#03C174']} style={styles.retryButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                        <Text style={styles.retryButtonText}>Retry</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.createFirstTicketButton}
                      onPress={() => {
                        try {
                          navigation.navigate("CreateTicket" as never);
                        } catch {
                          Alert.alert('Navigate', 'Navigate to Create Ticket page');
                        }
                      }}
                    >
                      <LinearGradient colors={['#146070', '#03C174']} style={styles.createFirstTicketGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.createFirstTicketText}>Create First Ticket</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                filteredTickets.map((item) => (
                  <View key={item.id}>{renderTicketCard({ item })}</View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <SearchModal />
      <ViewTicketModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollContainer: { flex: 1 },

  header: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(20, 96, 112, 0.1)',
  },
  titleContainer: { flex: 1 },
  headerTitle: { fontSize: 25, fontWeight: '700', color: '#146070' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  newTicketButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  newTicketGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 15, // reduced from 20
  paddingVertical: 10,    // reduced from 12
},

buttonIcon: { marginRight: 4 }, // slightly smaller spacing
newTicketText: { 
  color: '#fff', 
  fontWeight: '600', 
  fontSize: 13, // reduced from 15
},
statsContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500', textAlign: 'center' },

  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: { marginRight: 12 },
  searchPlaceholder: { flex: 1, color: '#64748b', fontSize: 15, fontWeight: '500' },

  contentContainer: { paddingHorizontal: 20, minHeight: 200 },
  ticketsContainer: { paddingBottom: 20 },

  loadingContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, color: '#64748b', fontSize: 16, fontWeight: '500' },

  // Modal and Search Modal Styles
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
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  closeButton: { padding: 4 },
  searchForm: { paddingHorizontal: 24, paddingTop: 20, maxHeight: 400 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#f9fafb',
  },
  statusButtonsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusFilterButtonActive: { backgroundColor: '#146070', borderColor: '#146070' },
  statusFilterText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  statusFilterTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 24, gap: 12 },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  clearButtonText: { color: '#6b7280', fontWeight: '600', fontSize: 16 },
  searchButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  searchButtonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  searchButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  createFirstTicketButton: { borderRadius: 12 },
  createFirstTicketGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createFirstTicketText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
  retryButton: { borderRadius: 12, marginTop: 16 },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: { color: '#171616ff', fontWeight: '600', marginLeft: 8 },
});

export default HelpDesk;
