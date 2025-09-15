import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const navigation = useNavigation();
  
  // State for user data - will be populated when user fills information
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    openTickets: 0,
    dueAmount: 0,
    visitorsToday: 0,
  });

  // Handle back navigation
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Mock function to simulate fetching user data
  const fetchUserData = () => {
    // This will be replaced with actual API call when user fills data
    // For now, keeping empty to show the structure
    console.log('Fetching user data...');
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const ProfileHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.profileInfo}>
        <LinearGradient
          colors={['#146070', '#05ae74']}
          style={styles.avatarContainer}
        >
          <Text style={styles.avatarText}>
            {userData.name ? userData.name.split(' ').map(n => n[0]).join('') : 'KK'}
          </Text>
        </LinearGradient>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {userData.name || 'Kumudini Kar'}
          </Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, styles.ownerBadge]}>
              <Text style={styles.badgeText}>Owner</Text>
            </View>
            <View style={[styles.badge, styles.spaceBadge]}>
              <Text style={styles.badgeTextBlue}>Unit E305</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.contactInfo}>
        <View style={styles.contactRow}>
          <MaterialIcons name="email" size={16} color="#666" />
          <Text style={styles.contactText}>
            {userData.email || 'kumudinikar@dummyemail.com'}
          </Text>
        </View>
        <View style={styles.contactRow}>
          <MaterialIcons name="phone" size={16} color="#666" />
          <Text style={styles.contactText}>
            {userData.phone || '+91 9439 891 564'}
          </Text>
        </View>
      </View>
    </View>
  );

  const StatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{userData.openTickets || '00'}</Text>
        <Text style={styles.statLabel}>Open Tickets</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>₹{userData.dueAmount || '0'}</Text>
        <Text style={styles.statLabel}>Due Amount</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{userData.visitorsToday || '00'}</Text>
        <Text style={styles.statLabel}>Visitors Today</Text>
      </View>
    </View>
  );

  type MenuCardProps = {
    icon: React.ReactNode; // because you're passing JSX (e.g., <Ionicons .../>)
    title: string;
    subtitle: string;
    onPress: () => void; // function with no args, returns nothing
    iconColor?: string;  // optional, default provided
  };

  const MenuCard = ({ icon, title, subtitle, onPress, iconColor = '#05ae74' }: MenuCardProps) => (
    <TouchableOpacity style={styles.menuCard} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <View style={[styles.menuIcon, { backgroundColor: iconColor + '20' }]}>
          {icon}
        </View>
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  const handlePersonalInfo = () => {
    console.log('Navigate to Personal Information');
    // Navigation logic here
  };

  const handleSpaceDetails = () => {
    console.log('Navigate to Space Details');
    // Navigation logic here
  };

  const handleChangePassword = () => {
    console.log('Navigate to Change Password');
    // Navigation logic here
  };

  const handleNotifications = () => {
    console.log('Navigate to Notifications');
    // Navigation logic here
  };

  const handlePrivacySecurity = () => {
    console.log('Navigate to Privacy & Security');
    // Navigation logic here
  };

  const handleHelpSupport = () => {
    console.log('Navigate to Help & Support');
    // Navigation logic here
  };

  const handleLogout = () => {
    console.log('Logout pressed');
    // Logout logic here
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* UPDATED: Header with Back Arrow */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#146070" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ProfileHeader />

        {/* Stats Cards */}
        <StatsCards />

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <MenuCard
            icon={<MaterialIcons name="person" size={24} color="#05ae74" />}
            title="Personal Information"
            subtitle="Update your personal details"
            onPress={handlePersonalInfo}
          />

          <MenuCard
            icon={<MaterialIcons name="dashboard" size={24} color="#146070" />}
            title="Unit Details"
            subtitle="View and manage unit information"
            onPress={handleSpaceDetails}
            iconColor="#146070"
          />

          <MenuCard
            icon={<MaterialIcons name="lock" size={24} color="#05ae74" />}
            title="Change password"
            subtitle="Update your account password"
            onPress={handleChangePassword}
          />

          <MenuCard
            icon={<MaterialIcons name="notifications" size={24} color="#05ae74" />}
            title="Notifications"
            subtitle="Manage notification preferences"
            onPress={handleNotifications}
          />

          <MenuCard
            icon={<MaterialIcons name="security" size={24} color="#146070" />}
            title="Privacy & Security"
            subtitle="Control your privacy settings"
            onPress={handlePrivacySecurity}
            iconColor="#146070"
          />

          <MenuCard
            icon={<MaterialIcons name="help" size={24} color="#05ae74" />}
            title="Help & support"
            subtitle="Get help and contact support"
            onPress={handleHelpSupport}
          />

          <TouchableOpacity style={[styles.menuCard, styles.logoutCard]} onPress={handleLogout}>
            <View style={styles.menuIconContainer}>
              <View style={[styles.menuIcon, { backgroundColor: '#ff4444' + '20' }]}>
                <MaterialIcons name="logout" size={24} color="#ff4444" />
              </View>
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: '#ff4444' }]}>Logout</Text>
              <Text style={styles.menuSubtitle}>Sign out of your account</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" />
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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  // ADDED: New styles for header with back button
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(20, 96, 112, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#146070',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownerBadge: {
    backgroundColor: '#05ae74',
  },
  spaceBadge: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  badgeTextBlue: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: '500',
  },
  contactInfo: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#146070',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#05ae74',
    textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  menuCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  menuIconContainer: {
    marginRight: 16,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutCard: {
    marginTop: 8,
  },
});

export default ProfileScreen;
