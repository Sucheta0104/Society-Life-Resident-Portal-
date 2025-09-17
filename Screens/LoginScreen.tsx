// App.js - Main App Component
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


interface LoginScreenProps {
  onLoginSuccess: (userInfo: any) => void;
}


const SplashScreen = () => {
  return (
    <LinearGradient
      colors={['#146070', '#05ae74']}
      style={styles.splashContainer}
    >
      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />
      
      {/* Logo and Title */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/Images/logo.png')}
          style={styles.customLogo}
          resizeMode="contain"
        />
        <Text style={styles.portalText}>Occupant Portal</Text>
      </View>
    </LinearGradient>
  );
};


const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [userInput, setUserInput] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const validateForm = () => {
    if (!userInput.trim()) {
      Alert.alert('Validation Error', 'Please enter User ID or Phone Number');
      return false;
    }
    
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter Password');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long');
      return false;
    }
    
    // Phone number validation (if it looks like a phone number)
    if (/^\d+$/.test(userInput) && userInput.length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return false;
    }
    
    return true;
  };


  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    // Simulate API call - Replace this with your actual login logic
    try {
      // Your login API call would go here
      // const response = await loginAPI(userInput, password);
      
      // Simulate delay
      setTimeout(() => {
        setIsLoading(false);
        // On successful login, call the callback to navigate to dashboard
        onLoginSuccess({
          userId: userInput,
          // Add any other user data you need to pass to dashboard
        });
      }, 2000);
      
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
    }
  };


  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset link will be sent to your registered email/phone number.');
  };


  return (
    <View style={styles.loginContainer}>
      {/* Header Section */}
      <View style={styles.loginHeader}>
        <LinearGradient
          colors={['#146070', '#05ae74']}
          style={styles.loginHeaderGradient}
        >
          {/* Logo */}
          <View style={styles.loginLogoContainer}>
            <Image 
              source={require('../assets/Images/logo.png')}
              style={styles.loginCustomLogo}
              resizeMode="contain"
            />
          </View>
          
          {/* Portal Title */}
          <Text style={styles.loginPortalTitle}>Resident Portal</Text>
        </LinearGradient>
      </View>
      
      {/* Form Section */}
      <View style={styles.loginFormSection}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.loginFormContainer}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.loginForm}>
              {/* User ID Input */}
              <View style={styles.loginInputGroup}>
                <Text style={styles.loginLabel}>User ID or Phone Number</Text>
                <TextInput
                  style={styles.loginInput}
                  placeholder="Enter User ID or Phone Number"
                  placeholderTextColor="#bbb"
                  value={userInput}
                  onChangeText={setUserInput}
                  autoCapitalize="none"
                  keyboardType="default"
                />
              </View>
              
              {/* Password Input */}
              <View style={styles.loginInputGroup}>
                <Text style={styles.loginLabel}>Password</Text>
                <TextInput
                  style={styles.loginInput}
                  placeholder="Enter Password"
                  placeholderTextColor="#bbb"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              
              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginSubmitButton, isLoading && styles.loginSubmitButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#a0a0a0', '#a0a0a0'] : ['#146070', '#03C174']}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.loginSubmitButtonText}>Login</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              {/* Forgot Password */}
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
                <Text style={styles.loginForgotPasswordText}>Forgot Password</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};


// Export components separately
export { SplashScreen, LoginScreen };
export default LoginScreen;


const styles = StyleSheet.create({
  // Splash Screen Styles
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circle1: {
    position: 'absolute',
    top: 50,
    left: 50,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle2: {
    position: 'absolute',
    top: 250,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle3: {
    position: 'absolute',
    bottom: 100,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoContainer: {
    alignItems: 'center',
  },
  customLogo: {
    width: 200,
    height: 120,
    marginBottom: 20,
  },
  portalText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '500',
  },
  
  // Login Screen Styles
  loginContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loginHeader: {
    height: '37%',
    width: '100%',
  },
  loginHeaderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loginLogoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loginCustomLogo: {
    width: 165,
    height: 90,
  },
  loginPortalTitle: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loginFormSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -25,
    paddingTop: 30,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  loginFormContainer: {
    flex: 1,
  },
  loginForm: {
    flex: 1,
  },
  loginInputGroup: {
    marginBottom: 15,
  },
  loginLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  loginInput: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12, 
    
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2c3e50',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    height: 50, 
  },
  loginSubmitButton: {
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 20,
    overflow: 'hidden', 
    shadowColor: '#146070',
    shadowOffset: {
      width: 0,
      height: 3, 
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  loginButtonGradient: {
    paddingVertical: 14, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginSubmitButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  loginSubmitButtonText: {
    color: '#fff',
    fontSize: 17, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  loginForgotPasswordText: {
    color: '#03c174',
    fontSize: 18,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  
  // Placeholder Dashboard Styles (remove when using your dashboard)
  dashboardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  dashboardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  userInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#03c174',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
