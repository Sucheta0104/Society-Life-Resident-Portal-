import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type HeaderProps = {
  onLogout: () => void;
};

const HEADER_HEIGHT = 75;         // total visual height of the header strip
const ROW_HEIGHT = 48;            // row that holds logo + icon
const ANDROID_NUDGE_Y = -2;       // small upward tweak for Android optics

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <LinearGradient
        colors={['#146070', '#03C174']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}
      >
        <View style={styles.contentRow}>
          <Image
            source={require('../assets/Images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <TouchableOpacity
            onPress={onLogout}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="logout" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    height: HEADER_HEIGHT,              // no StatusBar padding here; SafeAreaView handles top inset
    justifyContent: 'center',
  },
  contentRow: {
    height: ROW_HEIGHT,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',               // vertical centering of logo and icon
    justifyContent: 'space-between',
    transform: [{ translateY: Platform.OS === 'android' ? ANDROID_NUDGE_Y : 0 }],
  },
  logo: {
    height: 40,
    width: 130,                         // adjust if the logo looks too wide/narrow
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Header;
