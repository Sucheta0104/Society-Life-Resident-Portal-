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
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
type ErrorModalProps = {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
};
type SuccessModalProps = {
  isVisible: boolean;
  userName: string;
  onClose: () => void;
};
type LoginUserData = {
  userId: string;
  userData: {
    userName?: string;
    UserName?: string;
    Name?: string;
    // add more fields if API returns them
  };
  sessionId: string;
};

interface LoginScreenProps {
  onLoginSuccess: (userInfo: any) => void;
}

// Custom Success Modal Component
const SuccessModal : React.FC<SuccessModalProps> = ({ isVisible, userName, onClose }) => {
  const [scaleValue] = useState(new Animated.Value(0));
  const [checkmarkScale] = useState(new Animated.Value(0));
  const [fadeValue] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (isVisible) {
      // Start animations sequence
      Animated.sequence([
        // Fade in background
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Scale up modal
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        // Animate checkmark after modal appears
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 80,
          friction: 4,
          useNativeDriver: true,
          delay: 300,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleValue.setValue(0);
      checkmarkScale.setValue(0);
      fadeValue.setValue(0);
    }
  }, [isVisible]);

  const handleClose = () => {
    Animated.timing(fadeValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.successOverlay,
          {
            opacity: fadeValue,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.successModal,
            {
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <LinearGradient
            colors={['#146070', '#03C174']}
            style={styles.successModalGradient}
          >
            {/* Decorative circles */}
            <View style={styles.successCircle1} />
            <View style={styles.successCircle2} />
            
            {/* Animated Checkmark */}
            <Animated.View
              style={[
                styles.checkmarkContainer,
                {
                  transform: [{ scale: checkmarkScale }],
                },
              ]}
            >
              <View style={styles.checkmarkCircle}>
                <Ionicons 
                  name="checkmark" 
                  size={50} 
                  color="#fff" 
                  style={styles.checkmarkIcon}
                />
              </View>
            </Animated.View>

            
            {/* Success Text */}
            <Text style={styles.successTitle}>Login Successful!</Text>
            <Text style={styles.successMessage}>
              Welcome {userName || 'back'}!
            </Text>
            

            {/* Continue Button */}
           <TouchableOpacity onPress={handleClose} activeOpacity={0.8}>
           <Ionicons name="arrow-forward" size={26} color="#fff" />
          </TouchableOpacity>

          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Custom Error Modal Component
const ErrorModal: React.FC<ErrorModalProps> = ({ isVisible, title, message, onClose }) => {
  const [scaleValue] = useState(new Animated.Value(0));
  const [crossScale] = useState(new Animated.Value(0));
  const [fadeValue] = useState(new Animated.Value(0));
  const [shakeValue] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (isVisible) {
      Animated.sequence([
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(scaleValue, {
            toValue: 1,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(shakeValue, {
              toValue: 10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeValue, {
              toValue: -10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeValue, {
              toValue: 0,
              duration: 50,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.spring(crossScale, {
          toValue: 1,
          tension: 80,
          friction: 4,
          useNativeDriver: true,
          delay: 200,
        }),
      ]).start();
    } else {
      scaleValue.setValue(0);
      crossScale.setValue(0);
      fadeValue.setValue(0);
      shakeValue.setValue(0);
    }
  }, [isVisible]);


  const handleClose = () => {
    Animated.timing(fadeValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.errorOverlay,
          {
            opacity: fadeValue,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.errorModal,
            {
              transform: [
                { scale: scaleValue },
                { translateX: shakeValue }
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#e74c3c', '#c0392b']}
            style={styles.errorModalGradient}
          >
            {/* Decorative circles */}
            <View style={styles.errorCircle1} />
            <View style={styles.errorCircle2} />
            
            {/* Animated Cross Icon */}
            <Animated.View
              style={[
                styles.crossContainer,
                {
                  transform: [{ scale: crossScale }],
                },
              ]}
            >
              <View style={styles.crossCircle}>
                <Ionicons 
                  name="close" 
                  size={50} 
                  color="#fff" 
                  style={styles.crossIcon}
                />
              </View>
            </Animated.View>

            {/* Error Text */}
            <Text style={styles.errorTitle}>{title || 'Login Failed'}</Text>
            <Text style={styles.errorMessage}>
              {message || 'Authentication failed'}
            </Text>
             {/* Simple Refresh Icon Only */}
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              style={styles.simpleRefreshContainer}
            >
              <Ionicons 
                name="refresh" 
                size={35} 
                color="#fff" 
                style={styles.simpleRefreshIcon}
              />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorData, setErrorData] = useState({ title: '', message: '' });
  const [loginUserData, setLoginUserData] = useState<LoginUserData | null>(null);
  // API Configuration
  const API_BASE_URL = 'https://api.ua.societylife.dev2stage.in/api/UserAuthenticationApi';

  // Step 1: Generate session and hashed password
  const generateSessionPassword = async (email: string, password: string) => {
    try {
      
      const response = await fetch(`${API_BASE_URL}/generate-session-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          Email: email.trim(),
          Password: password.trim()
        }),
      });

      const responseText = await response.text();
      console.log("Generate session response:", responseText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      
      if (result && result.SessionId && result.FinalHashedPassword) {
        return {
          sessionId: result.SessionId,
          hashedPassword: result.FinalHashedPassword,
          success: true
        };
      } else {
        throw new Error('Missing session data from response');
      }
    } catch (error: any) {
      console.error('Generate session error:', error);
      throw new Error(error.message || 'Failed to generate session');
    }
  };

  // Function to store user data using AsyncStorage.multiSet
  const storeUserData = async (loginData: any, sessionId: string, email: string) => {
    try {
      // Prepare all data to store in a single operation
      const userData = [
        ['userToken', 'authenticated'],
        ['userId', String(loginData.userId || loginData.UserId || '')],
        ['userName', String(loginData.userName || loginData.UserName || loginData.Name || '')],
        ['societyId', String(loginData.societyId || loginData.SocietyId || '')],
        ['societyName', String(loginData.societyName || loginData.SocietyName || '')],
        ['userType', String(loginData.userType || loginData.UserType || '')],
        ['subscription', String(loginData.subscription || loginData.Subscription || '')],
        ['societyLogo', String(loginData.societyLogo || loginData.SocietyLogo || '')],
        ['userEmail', email],
        ['sessionId', sessionId],
        ['loginTimestamp', new Date().toISOString()],
      ];

      // Store all data at once using multiSet (most efficient way)
      await AsyncStorage.multiSet(userData as [string, string][]);
      
      console.log('✅ User data stored successfully:');
      console.log('- User ID:', loginData.userId || loginData.UserId);
      console.log('- User Name:', loginData.userName || loginData.UserName || loginData.Name);
      console.log('- Society ID:', loginData.societyId || loginData.SocietyId);
      console.log('- Society Name:', loginData.societyName || loginData.SocietyName);
      console.log('- User Type:', loginData.userType || loginData.UserType);
      
    } catch (error) {
      console.error(' Error storing user data:', error);
      throw new Error('Failed to store user data');
    }
  };

  // Step 2: Login with session ID and hashed password
  const loginWithSession = async (email: string, sessionId: string, hashedPassword: string) => {
    try {
      console.log("Step 2: Logging in with session ID and hashed password");
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          EmailId: email.trim(),
          Password: hashedPassword,
          SessionId: sessionId
        }),
      });

      const responseText = await response.text();
      console.log("Login response:", responseText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      
      // Check if login was successful
      if (result.success !== false && result.error === undefined) {
        // Store all user data using multiSet (Best Practice)
        await storeUserData(result, sessionId, email);
        return { success: true, userData: result };
      } else {
        throw new Error(result.message || result.error || 'Invalid credentials');
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const validateForm = () => {
    if (!userInput.trim()) {
      setErrorData({
        title: 'Validation Error',
        message: 'Please enter Email or User ID'
      });
      setShowErrorModal(true);
      return false;
    }
    
    if (!password.trim()) {
      setErrorData({
        title: 'Validation Error',
        message: 'Please enter Password'
      });
      setShowErrorModal(true);
      return false;
    }
    
    if (password.length < 6) {
      setErrorData({
        title: 'Validation Error',
        message: 'Password must be at least 6 characters long'
      });
      setShowErrorModal(true);
      return false;
    }
    
    // Email validation if it contains @
    if (userInput.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userInput)) {
        setErrorData({
          title: 'Validation Error',
          message: 'Please enter a valid email address'
        });
        setShowErrorModal(true);
        return false;
      }
    }
    
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      console.log("🚀 Starting two-step authentication process");
      
      // Step 1: Generate session and hashed password
      const sessionData = await generateSessionPassword(userInput, password);
      
      if (!sessionData.success || !sessionData.sessionId || !sessionData.hashedPassword) {
        throw new Error('Failed to generate session data');
      }
      
      // Step 2: Login with session data
      const loginResult = await loginWithSession(userInput, sessionData.sessionId, sessionData.hashedPassword);
      
      if (loginResult.success) {
        // Store user data for success modal
        setLoginUserData({
          userId: userInput,
          userData: loginResult.userData,
          sessionId: sessionData.sessionId
        });
        
        // Show success modal instead of alert
        setShowSuccessModal(true);
      }
      
    } catch (error: any) {
      console.error('💥 Authentication error:', error);
      
      // Show custom error modal instead of alert
     setErrorData({
  title: 'Login Failed',
  message: 'Please enter valid email id and password'
});

      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    if (loginUserData) {
      onLoginSuccess(loginUserData);
    }
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
  };

  const handleForgotPassword = async () => {
    if (!userInput.trim()) {
      setErrorData({
        title: 'Email Required',
        message: 'Please enter your email address first'
      });
      setShowErrorModal(true);
      return;
    }

    if (!userInput.includes('@')) {
      setErrorData({
        title: 'Invalid Email',
        message: 'Please enter a valid email address'
      });
      setShowErrorModal(true);
      return;
    }

    try {
      console.log('🔄 Sending forgot password request for:', userInput);
      
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          Email: userInput.trim()
        }),
      });

      const responseText = await response.text();
      console.log('📧 Forgot password response:', responseText);

      if (response.ok) {
        Alert.alert(
          'Password Reset Email Sent',
          'Please check your email for password reset instructions.',
          [{ text: 'OK' }]
        );
      } else {
        setErrorData({
          title: 'Request Failed',
          message: 'Unable to send password reset email. Please try again.'
        });
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);
      setErrorData({
        title: 'Request Failed',
        message: 'Unable to send password reset email. Please check your internet connection.'
      });
      setShowErrorModal(true);
    }
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
                <Text style={styles.loginLabel}>Email or User ID</Text>
                <TextInput
                  style={styles.loginInput}
                  placeholder="Enter Email or User ID"
                  placeholderTextColor="#bbb"
                  value={userInput}
                  onChangeText={setUserInput}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
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
                  editable={!isLoading}
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
              <TouchableOpacity 
                onPress={handleForgotPassword} 
                style={styles.forgotPasswordContainer}
                disabled={isLoading}
              >
                <Text style={styles.loginForgotPasswordText}>Forgot Password</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Success Modal */}
          <SuccessModal
            isVisible={showSuccessModal}
             userName={
             loginUserData?.userData?.userName ||
             loginUserData?.userData?.UserName ||
             loginUserData?.userData?.Name ||
            ''
           }
  onClose={handleSuccessModalClose}
/>

      {/* Error Modal */}
      <ErrorModal
        isVisible={showErrorModal}
        title={errorData.title}
        message={errorData.message}
        onClose={handleErrorModalClose}
      />
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

  // Success Modal Styles
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successModal: {
    width: '90%',
    maxWidth: 350,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  successModalGradient: {
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    position: 'relative',
  },
  successCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  successCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  checkmarkContainer: {
    marginBottom: 20,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  checkmarkIcon: {
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  successSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  // Error Modal Styles
  errorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorModal: {
    width: '90%',
    maxWidth: 350,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  errorModalGradient: {
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    position: 'relative',
  },
  errorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  crossContainer: {
    marginBottom: 20,
  },
  crossCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  crossIcon: {
    fontWeight: 'bold',
  },
  errorTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  // Simple Refresh Icon Styles - No Button Background
  simpleRefreshContainer: {
    padding: 10, // Minimal padding for touch area
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleRefreshIcon: {
    fontWeight: '900', 
    textShadowColor: 'rgba(0, 0, 0, 0.3)', 
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
 
});
