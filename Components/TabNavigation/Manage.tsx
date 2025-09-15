import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from "@react-navigation/native";
type Stat = {
  value: number;
  label: string;
};

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap; // ensures valid Ionicons names
  title: string;
  description: string;
  stats: Stat[];
  onPress: () => void;
};
type OverviewCardProps = {
  totalUnit: number;
  totalOccupants: number;
  occupancyRate: number;
};
type ManagementData = {
  overview: {
    totalUnit: number;
    totalOccupants: number;
    occupancyRate: number;
  };
  unitManagement: {
    total: number;
    occupied: number;
    vacant: number;
  };
  ownerManagement: {
    total: number;
    active: number;
    inactive: number;
  };
  tenantManagement: {
    total: number;
    active: number;
    pending: number;
  };
  occupantManagement: {
    total: number;
    primary: number;
    secondary: number;
  };
};


const ManagementHub = () => {
  const [managementData, setManagementData] = useState<ManagementData | null>(null);

  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const API_CONFIG = {
    url: 'https://applianceservicemgmt.dev2stage.in/api/rest/Invoke',
    authKey: '86A264E4-ECF8-4627-AF83-5512FE83DAE6',
    hostKey: '8ECB211D2',
  };
  // Fetch data from API
  useEffect(() => {
    fetchManagementData();
  }, []);

  const fetchManagementData = async () => {
  try {
    setLoading(true);

    const valuesString = `@p_Unit_Id=${280},@p_Society_Id=NULL,@p_Block_Id=NULL,@p_Floor=NULL,@p_Society_GUID=NULL,@p_Unit_Type_Id=NULL,@p_Unit_Name=NULL,@p_Builtup_Area=NULL,@p_Carpet_Area=NULL,@p_Super_Built_Area=NULL,@p_Number_Of_Room=NULL,@p_Number_Of_Bathroom=NULL,@p_Number_Of_Balcony=NULL,@p_Contact_Number=NULL,@p_Current_Occupancy_Type_Id=NULL,@p_Unit_Status_Id=NULL,@p_Attribute1=NULL,@p_Attribute2=NULL,@p_Attribute3=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Attribute10=NULL,@p_Is_Active=1,@p_Is_Archived=0,@p_Skip=0,@p_Take=10,@p_First_Name=NULL,@p_Is_Primary=NULL,@p_Email=NULL`;

    const requestBody = new URLSearchParams({
      AuthKey: API_CONFIG.authKey,
      HostKey: API_CONFIG.hostKey,
      Object: 'UNM_SP_Unit_Get',
      Values: valuesString,
    }).toString();

    const response = await fetch(API_CONFIG.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: requestBody,
    });

    const responseText = await response.text();
    let result: any;

    try {
      result = JSON.parse(responseText);
      console.log('API result:', result);
    } catch (e) {
      console.error('Invalid JSON from API:', responseText);
      throw e;
    }

    // Adjust this path according to your API’s actual structure
    const totalUnit =
      result?.overview?.totalUnit ??
      result?.data?.totalUnit ??
      result?.count ??
      0;

    setManagementData({
      overview: {
        totalUnit,
        totalOccupants: 0,
        occupancyRate: 0,
      },
      unitManagement: {
        total: totalUnit,
        occupied: 0,
        vacant: 0,
      },
      ownerManagement: {
        total: 0,
        active: 0,
        inactive: 0,
      },
      tenantManagement: {
        total: 0,
        active: 0,
        pending: 0,
      },
      occupantManagement: {
        total: 0,
        primary: 0,
        secondary: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching management data:', error);
  } finally {
    setLoading(false);
  }
};


  // Navigation functions - replace with actual navigation logic
  // const handleNavigation = (section:any) => {
  //   console.log(`Navigating to ${section}`);
  //   // Add your navigation logic here
  //   // Example: navigation.navigate(section);
  // };

  const StatCard: React.FC<StatCardProps> = ({ icon, title, description, stats, onPress }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.titleSection}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color="#05ae74" />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </View>
    </View>

    <View style={styles.statsContainer}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          <Text style={styles.statNumber}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>

    <TouchableOpacity style={styles.viewAllButtonContainer} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={["#146070", "#05ae74"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.viewAllButton}
      >
        <Ionicons name="list" size={16} color="white" style={styles.buttonIcon} />
        <Text style={styles.viewAllText}>View All</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
);


 const OverviewCard: React.FC<OverviewCardProps> = ({ totalUnit, totalOccupants, occupancyRate }) => (
  <LinearGradient
    colors={["#e8f5f3", "#f0f8f7"]}
    style={styles.overviewCard}
  >
    <View style={styles.overviewItem}>
      <Text style={styles.overviewNumber}>{totalUnit || 0}</Text>
      <Text style={styles.overviewLabel}>Total Units</Text>
    </View>

    <View style={styles.overviewDivider} />

    <View style={styles.overviewItem}>
      <Text style={styles.overviewNumber}>{totalOccupants || 0}</Text>
      <Text style={styles.overviewLabel}>Total Occupants</Text>
    </View>

    <View style={styles.overviewDivider} />

    <View style={styles.overviewItem}>
      <Text style={styles.overviewNumber}>{occupancyRate || 0}%</Text>
      <Text style={styles.overviewLabel}>Occupancy Rate</Text>
    </View>
  </LinearGradient>
);


  const LoadingCard = () => (
    <View style={[styles.card, styles.loadingCard]}>
      <View style={styles.loadingContent}>
        <View style={styles.loadingLine} />
        <View style={[styles.loadingLine, { width: '60%' }]} />
        <View style={styles.loadingStats}>
          <View style={styles.loadingStat} />
          <View style={styles.loadingStat} />
          <View style={styles.loadingStat} />
        </View>
      </View>
    </View>
  );

  if (loading || !managementData) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.mainTitle}>Management Hub</Text>
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Management Hub</Text>
        </View>

        <OverviewCard
          totalUnit={managementData.overview.totalUnit}
          totalOccupants={managementData.overview.totalOccupants}
          occupancyRate={managementData.overview.occupancyRate}
        />

        <StatCard
          icon="grid-outline"
          title="Unit Management"
          description="Manage apartment units, view occupancy status, and unit details"
          stats={[
            { value: managementData.unitManagement.total, label: 'Total' },
            { value: managementData.unitManagement.occupied, label: 'Occupied' },
            { value: managementData.unitManagement.vacant, label: 'Vacant' }
          ]}
          onPress={() => navigation.navigate("UnitManagement" as never)}
        />

        <StatCard
          icon="person-outline"
          title="Owner Management"
          description="Manage property owners, contact information, and ownership details"
          stats={[
            { value: managementData.ownerManagement.total, label: 'Total' },
            { value: managementData.ownerManagement.active, label: 'Active' },
            { value: managementData.ownerManagement.inactive, label: 'Inactive' }
          ]}
          onPress={() => navigation.navigate("OwnerManagement" as never)}
          // showPlus={true}
        />

        <StatCard
          icon="people-outline"
          title="Tenant Management"
          description="Manage tenant information, lease agreements, and rental details"
          stats={[
            { value: managementData.tenantManagement.total, label: 'Total' },
            { value: managementData.tenantManagement.active, label: 'Active' },
            { value: managementData.tenantManagement.pending, label: 'Pending' }
          ]}
          onPress={() => navigation.navigate("TenantManagement" as never)}
          // showPlus={true}
        />

        <StatCard
          icon="people"
          title="Occupant Management"
          description="Manage all residents, family members, and occupancy records"
          stats={[
            { value: managementData.occupantManagement.total, label: 'Total' },
            { value: managementData.occupantManagement.primary, label: 'Primary' },
            { value: managementData.occupantManagement.secondary, label: 'Secondary' }
          ]}
          onPress={() => navigation.navigate("OccupantList" as never)}
          // showPlus={true}
        />
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafb',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#146070',
    letterSpacing: -0.5,
  },
  overviewCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#05ae74',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#05ae74',
    opacity: 0.2,
    marginHorizontal: 8,
  },
  overviewNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#146070',
    marginBottom: 6,
  },
  overviewLabel: {
    fontSize: 13,
    color: '#05ae74',
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#146070',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f2f5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f8f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#146070',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    fontWeight: '400',
  },
  plusButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f8f7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0f2f1',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#146070',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  viewAllButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  viewAllButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  viewAllText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  loadingCard: {
    backgroundColor: '#f8f9fa',
  },
  loadingContent: {
    paddingVertical: 10,
  },
  loadingLine: {
    height: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    marginBottom: 8,
    width: '80%',
  },
  loadingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 10,
  },
  loadingStat: {
    width: 40,
    height: 40,
    backgroundColor: '#e9ecef',
    borderRadius: 20,
  },
  bottomPadding: {
    height: 20,
  },
});

export default ManagementHub;