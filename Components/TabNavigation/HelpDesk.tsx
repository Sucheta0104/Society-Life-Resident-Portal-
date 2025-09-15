import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
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

// Add API_CONFIG constant
const API_CONFIG = {
  url: 'https://applianceservicemgmt.dev2stage.in/api/rest/Invoke',
  authKey: '86A264E4-ECF8-4627-AF83-5512FE83DAE6',
  hostKey: '8ECB211D2'
};

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

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
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
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

  // Handle back navigation
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Calculate stats from tickets
  const calculateStats = useCallback((ticketData: Ticket[]) => {
    const total = ticketData.length;
    const completed = ticketData.filter(ticket => ticket.status === 'completed').length;
    const inProgress = ticketData.filter(ticket => ticket.status === 'inProgress').length;
    const pending = ticketData.filter(ticket => ticket.status === 'pending').length;
    
    return { total, completed, inProgress, pending };
  }, []);

  // API Response Transformer
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
        // API date format: dd/MM/yyyy
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

  // UPDATED: Fetch tickets function - removed mock data
  const fetchTickets = async (page: number = 1, showLoading: boolean = true) => {
    if (showLoading) setLoading(true);
    setError("");
    
    try {
      console.log('Fetching tickets from API...');

      // Build parameter string
      const valuesString = `@p_Help_Desk_Id=NULL,@p_Society_Id=7,@p_Unit_Id=280,@p_Help_Category_Id=NULL,@p_Help_Priority_Id=NULL,@p_Requested_By=NULL,@p_From_Request_Date=NULL,@p_To_Request_Date=NULL,@p_Service_Type=NULL,@p_Assign_To=NULL,@p_From_Resolve_Date=NULL,@p_To_Resolve_Date=NULL,@p_Help_Title=NULL,@p_Description=NULL,@p_Help_Status_Id=NULL,@p_Attribute1=NULL,@p_Attribute2=NULL,@p_Attribute3=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Attribute10=NULL,@p_Help_Desk_GUId=NULL,@p_Token_No=NULL,@p_Is_Active=NULL,@p_Is_Archived=NULL,@p_Skip=0,@p_Take=50000,@p_Email=NULL,@p_First_Name=NULL,@p_Mobile_Number=NULL,@p_Assign_To_Email=NULL,@p_Assign_To_First_Name=NULL,@p_Assign_To_Mobile_Number=NULL`.replace(/\s+/g, '');

      // Prepare URL-encoded body
      const requestBody = new URLSearchParams({
        AuthKey: API_CONFIG.authKey,
        HostKey: API_CONFIG.hostKey,
        Object: "HEM_SP_HelpDesk_Get",
        Values: valuesString,
      }).toString();

      console.log('API Request Body:', requestBody);

      // Send POST request
      const response = await fetch(API_CONFIG.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
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

      // Transform API response to Ticket[]
      let transformedData: Ticket[] = [];
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
      } else if (typeof result === "object" && result !== null) {
        console.log('Found single object, converting to array');
        transformedData = [transformApiResponse(result)];
      } else {
        console.log('No recognizable data structure found');
        transformedData = [];
      }

      console.log('Final transformed tickets:', transformedData);

      setTickets(transformedData);
      setFilteredTickets(transformedData);
      setStats(calculateStats(transformedData));
      setCurrentPage(page);

      // Show message if no data found
      if (transformedData.length === 0) {
        setError('No help desk tickets found for this unit');
      }

    } catch (err: any) {
      console.error('API Error:', err);
      const errorMessage = err.message || "Failed to fetch tickets";
      setError(errorMessage);
      
      // Clear data on error - NO MORE MOCK DATA
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

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets(1, false);
  }, []);

  // Search functionality
  const handleSearch = () => {
    setSearchVisible(true);
  };

  const applySearch = () => {
    let filtered = [...tickets];
    if (searchFilters.ticketId.trim()) {
      filtered = filtered.filter(ticket => 
        ticket.id.toLowerCase().includes(searchFilters.ticketId.toLowerCase())
      );
    }
    if (searchFilters.category.trim()) {
      filtered = filtered.filter(ticket => 
        ticket.category.toLowerCase().includes(searchFilters.category.toLowerCase())
      );
    }
    if (searchFilters.requester.trim()) {
      filtered = filtered.filter(ticket => 
        ticket.requester.toLowerCase().includes(searchFilters.requester.toLowerCase())
      );
    }
    if (searchFilters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === searchFilters.status);
    }
    setFilteredTickets([...filtered]);
    setSearchVisible(false);
  };

  const clearSearch = () => {
    setSearchFilters({
      ticketId: '',
      category: '',
      requester: '',
      status: 'all'
    });
    setFilteredTickets([...tickets]);
    setSearchVisible(false);
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'inProgress':
        return '#f59e0b';
      case 'pending':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: TicketStatus) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'inProgress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const handleTicketPress = (ticket: Ticket) => {
    Alert.alert('Ticket Selected', `Selected ticket: ${ticket.id}`);
  };

  const handleViewTicket = (ticket: Ticket) => {
    Alert.alert(
      'View Ticket Details',
      `Ticket ID: ${ticket.id}\n` +
      `Category: ${ticket.category}\n` +
      `Status: ${getStatusText(ticket.status)}\n` +
      `Priority: ${ticket.priority}\n` +
      `Requester: ${ticket.requester}\n` +
      `Space: ${ticket.space}\n` +
      `Date: ${ticket.date}\n` +
      `Details: ${ticket.details}`,
      [
        {
          text: 'Close',
          style: 'cancel'
        },
        {
          text: 'Back',
          onPress: () => {
            console.log('Navigate to ticket details:', ticket);
          }
        }
      ]
    );
  };

  // const handleEditTicket = (ticket: Ticket) => {
  //   Alert.alert(
  //     'Edit Ticket',
  //     `Edit ticket: ${ticket.id}`,
  //     [
  //       {
  //         text: 'Cancel',
  //         style: 'cancel'
  //       },
  //       {
  //         text: 'Edit Details',
  //         onPress: () => {
  //           console.log('Navigate to edit ticket:', ticket);
  //         }
  //       },
  //       {
  //         text: 'Change Status',
  //         onPress: () => handleChangeStatus(ticket)
  //       }
  //     ]
  //   );
  // };

  // const handleChangeStatus = (ticket: Ticket) => {
  //   const statusOptions: { label: string; value: TicketStatus }[] = [
  //     { label: "Pending", value: "pending" },
  //     { label: "In Progress", value: "inProgress" },
  //     { label: "Completed", value: "completed" }
  //   ];
  //   const statusButtons = statusOptions
  //     .filter(option => option.value !== ticket.status)
  //     .map(option => ({
  //       text: option.label,
  //       onPress: () => updateTicketStatus(ticket, option.value)
  //     }));
  //   Alert.alert(
  //     'Change Status',
  //     `Current status: ${getStatusText(ticket.status)}\nSelect new status:`,
  //     [
  //       ...statusButtons,
  //       { text: 'Cancel', style: 'cancel' }
  //     ]
  //   );
  // };

  // const updateTicketStatus = (ticket: Ticket, newStatus: TicketStatus) => {
  //   const updatedTickets = tickets.map(t => 
  //     t.id === ticket.id ? { ...t, status: newStatus } : t
  //   );

  //   setTickets([...updatedTickets]);
  //   setFilteredTickets([...updatedTickets]);
  //   setStats(calculateStats(updatedTickets));

  //   Alert.alert(
  //     "Status Updated",
  //     `Ticket ${ticket.id} status changed to ${getStatusText(newStatus)}`
  //   );
  // };

  const renderTicketCard = ({ item, index }: { item: Ticket; index: number }) => (
    <TouchableOpacity
      style={[styles.ticketCard, { marginBottom: index === filteredTickets.length - 1 ? 20 : 16 }]}
      onPress={() => handleTicketPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.ticketCardHeader}>
        <View style={styles.ticketIdContainer}>
          <Text style={styles.ticketIdText}>{item.id}</Text>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
      <View style={styles.ticketCardContent}>
        <Text style={styles.categoryTitle}>{item.category}</Text>
        <Text style={styles.ticketDetails} numberOfLines={2}>{item.details}</Text>
        
        <View style={styles.ticketMetadata}>
          <View style={styles.metadataItem}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.metadataText}>{item.space}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Ionicons name="person-outline" size={14} color="#6b7280" />
            <Text style={styles.metadataText}>{item.requester}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Ionicons name="calendar-outline" size={14} color="#6b7280" />
            <Text style={styles.metadataText}>{item.date}</Text>
          </View>
        </View>
      </View>
      <View style={styles.ticketCardFooter}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleViewTicket(item);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={16} color="#146070" />
          <Text style={[styles.actionButtonText, { color: '#146070' }]}>View</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // UPDATED: Empty State - shows different messages based on error vs no data
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#f8fafc', '#e2e8f0']}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="document-text-outline" size={48} color="#94a3b8" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>
        {error ? 'Error Loading Tickets' : 'No Tickets Found'}
      </Text>
      <Text style={styles.emptySubtext}>
        {error 
          ? error
          : "No help desk tickets are available at the moment."
        }
      </Text>
      {error && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchTickets(1)}
        >
          <LinearGradient
            colors={['#146070', '#03C174']}
            style={styles.retryButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      {!error && (
        <TouchableOpacity 
          style={styles.createFirstTicketButton}
          onPress={() => {
            try {
              navigation.navigate("CreateTicket" as never);
            } catch (error) {
              Alert.alert('Navigate', 'Navigate to Create Ticket page');
            }
          }}
        >
          <LinearGradient
            colors={['#146070', '#03C174']}
            style={styles.createFirstTicketGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createFirstTicketText}>Create First Ticket</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

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
                onChangeText={(text) => setSearchFilters({...searchFilters, ticketId: text})}
                placeholder="Enter ticket ID"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.searchInput}
                value={searchFilters.category}
                onChangeText={(text) => setSearchFilters({...searchFilters, category: text})}
                placeholder="Enter category"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Requester</Text>
              <TextInput
                style={styles.searchInput}
                value={searchFilters.requester}
                onChangeText={(text) => setSearchFilters({...searchFilters, requester: text})}
                placeholder="Enter requester name"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusButtonsContainer}>
                {['all', 'pending', 'inProgress', 'completed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusFilterButton,
                      searchFilters.status === status && styles.statusFilterButtonActive
                    ]}
                    onPress={() => setSearchFilters({...searchFilters, status})}
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
                } catch (error) {
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
                <EmptyState />
              ) : (
                filteredTickets.map((item, index) => (
                  <View key={item.id}>
                    {renderTicketCard({ item, index })}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <SearchModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContainer: {
    flex: 1,
  },
  
  // Header Styles
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(20, 96, 112, 0.1)',
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#146070',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonIcon: {
    marginRight: 5,
  },
  newTicketText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  
  // Stats Styles
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Search Styles
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
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#64748b',
    fontSize: 15,
    fontWeight: '500',
  },

  // Content Styles
  contentContainer: {
    paddingHorizontal: 20,
    minHeight: 200,
  },
  ticketsContainer: {
    paddingBottom: 20,
  },

  // Ticket Card Styles
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketIdText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginRight: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketCardContent: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  ticketDetails: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metadataText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  ticketCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },

  // Loading and Empty States
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createFirstTicketButton: {
    borderRadius: 12,
  },
  createFirstTicketGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createFirstTicketText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  // NEW: Retry Button Styles
  retryButton: {
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  searchForm: {
    paddingHorizontal: 24,
    paddingTop: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
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
  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusFilterButtonActive: {
    backgroundColor: '#146070',
    borderColor: '#146070',
  },
  statusFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  statusFilterTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  clearButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 16,
  },
  searchButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchButtonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default HelpDesk;
