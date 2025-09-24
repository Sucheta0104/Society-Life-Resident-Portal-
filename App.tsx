import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import LoginScreen, { SplashScreen } from './Screens/LoginScreen';
import Dashboard from './Components/TabNavigation/Dashboard';
import Manage from './Components/TabNavigation/Manage';
import HelpDesk from './Components/TabNavigation/HelpDesk';
import Visitor from './Components/TabNavigation/Visitor';
import Profile from './Components/TabNavigation/Profile';
import SpaceManagement from './Screens/ManagementScreen/UnitManagement';
// import VisitorManagement from './Screens/ManagementScreen/VisitorManagement';
import OwnerManagement from './Screens/ManagementScreen/OwnerManagement';
import OccupantList from './Screens/ManagementScreen/OccupantList';
import AddOccupant from './Screens/AddButton/AddOccupant';
// import AddOwner from './Screens/AddButton/AddOwner';
import AddTenant from './Screens/AddButton/AddTenant';
import AddVisitor from './Screens/AddButton/AddVisitor';
import CreateTicket from './Screens/AddButton/CreateTicket';
import Header from './Components/Header';
import TenantManagement from './Screens/ManagementScreen/TenantManagement';
import FlashMessage from 'react-native-flash-message';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/* -------------------
   Stack Navigators
------------------- */
function DashboardStack({ onLogout }: { onLogout: () => void }) {
  return (
    <Stack.Navigator
      screenOptions={{
        header: () => <Header onLogout={onLogout} />,
      }}
    >
      <Stack.Screen name="DashboardMain" component={Dashboard} />
      {/* <Stack.Screen name="AddOwner" component={AddOwner} /> */}
      <Stack.Screen name="AddTenant" component={AddTenant} />
      <Stack.Screen name="AddOccupant" component={AddOccupant} />
      <Stack.Screen name="SpaceManagement" component={SpaceManagement} />
      <Stack.Screen name="OwnerManagement" component={OwnerManagement} />
      <Stack.Screen name="OccupantList" component={OccupantList} />
      <Stack.Screen name="CreateTicket" component={CreateTicket} />
    </Stack.Navigator>
  );
}

function VisitorStack({ onLogout }: { onLogout: () => void }) {
  return (
    <Stack.Navigator
      screenOptions={{
        header: () => <Header onLogout={onLogout} />,
      }}
    >
      <Stack.Screen name="VisitorMain" component={Visitor} />
      <Stack.Screen name="AddVisitor" component={AddVisitor} />
      {/* <Stack.Screen name="VisitorManagement" component={VisitorManagement} /> */}
    </Stack.Navigator>
  );
}

function ManageStack({ onLogout }: { onLogout: () => void }) {
  return (
    <Stack.Navigator
      screenOptions={{
        header: () => <Header onLogout={onLogout} />,
      }}
    >
      <Stack.Screen name="ManageMain" component={Manage} />
      <Stack.Screen name ="UnitManagement" component={SpaceManagement} />
      <Stack.Screen name="SpaceManagement" component={SpaceManagement} />
      <Stack.Screen name="OwnerManagement" component={OwnerManagement} />
      <Stack.Screen name="OccupantList" component={OccupantList} />
      <Stack.Screen name="AddOccupant" component={AddOccupant} />
      <Stack.Screen name="TenantManagement" component={TenantManagement} />
      <Stack.Screen name="AddTenant" component={AddTenant} />
      {/* <Stack.Screen name="AddOwner" component={AddOwner} /> */}
    </Stack.Navigator>
  );
}

function ProfileStack({ onLogout }: { onLogout: () => void }) {
  return (
    <Stack.Navigator
      screenOptions={{
        header: () => <Header onLogout={onLogout} />,
      }}
    >
      <Stack.Screen name="ProfileMain" component={Profile} />
    </Stack.Navigator>
  );
}

function HelpDeskStack({ onLogout }: { onLogout: () => void }) {
  return (
   <Stack.Navigator
      screenOptions={{
        header: () => <Header onLogout={onLogout} />,
      }}
    >
      <Stack.Screen name="HelpDeskMain" component={HelpDesk} />
      <Stack.Screen name="CreateTicket" component={CreateTicket} />
    </Stack.Navigator>
  );
}

/* -------------------
   Tab Navigator
------------------- */
function TabNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Manage') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'HelpDesk') {
            iconName = focused ? 'help-circle' : 'help-circle-outline';
          } else if (route.name === 'Visitor') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'home';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#03c174',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" children={() => <DashboardStack onLogout={onLogout} />} />
      <Tab.Screen name="Manage" children={() => <ManageStack onLogout={onLogout} />} />
      <Tab.Screen name="HelpDesk" children={() => <HelpDeskStack onLogout={onLogout} />} />
      <Tab.Screen name="Visitor" children={() => <VisitorStack onLogout={onLogout} />} />
      <Tab.Screen name="Profile" children={() => <ProfileStack onLogout={onLogout} />} />
    </Tab.Navigator>
  );
}

/* -------------------
   App Entry
------------------- */
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('splash'); // 'splash', 'login', 'main'
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScreen('login');
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleLoginSuccess = (userInfo: any) => {
    setUserData(userInfo);
    setCurrentScreen('main');
  };

  const handleLogout = () => {
    setUserData(null);
    setCurrentScreen('login');
  };

  if (currentScreen === 'splash') return <SplashScreen />;
  if (currentScreen === 'login') return <LoginScreen onLoginSuccess={handleLoginSuccess} />;

  if (currentScreen === 'main') {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <TabNavigator onLogout={handleLogout} />
        </NavigationContainer>
        <FlashMessage position="top" floating />
      </SafeAreaProvider>
    );
  }
}
