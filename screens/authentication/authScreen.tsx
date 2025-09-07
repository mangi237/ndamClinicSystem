import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Image,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import * as Animatable from 'react-native-animatable';

const LoginScreen = ({ navigation }) => {
  const [code, setCode] = useState('');
  const { login, loading } = useAuth();
  const handleLogin = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter your access code');
      return;
    }

    const result = await login(code);
    
    if (result.success) {
      console.log('Login Results', result)
      // Use the role from the login result, which is more reliable than route.params
      switch (result.role) {
        case 'admin':
          navigation.navigate('AdminDashboard');
          break;
       case 'receptionist':
          navigation.navigate('ReceptionistDashboard');
          break;
        case 'lab':
          navigation.navigate('LabDashboard');
          break;
        case 'pharmacy':
          navigation.navigate('PharmacistDashboard');
          break;
        case 'cashier':
          navigation.navigate('CashierDashboard');
          break;
        case 'analyzer':
          navigation.navigate('AnalyzerDashboard');
          break;
        default:
          Alert.alert('Error', 'Invalid role');
      }
    } else {
      Alert.alert('Login Failed', result.error || 'Invalid access code');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          {/* Left Section with Logo */}
          <View style={styles.logoContainer}>
            <Animatable.View 
              animation="fadeIn" 
              duration={1500}
              style={styles.logoBackground}
            >
              <Image 
                source={require('../../assets/images/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </Animatable.View>
            <Animatable.Text 
              animation="fadeInUp" 
              duration={1000}
              delay={300}
              style={styles.tagline}
            >
          PILEM LABS
            </Animatable.Text>
            <Animatable.Text 
              animation="fadeInUp" 
              duration={1000}
              delay={500}
              style={styles.description}
            >
With Our Advanced Management Technology, We Have Eradicated Papers, Your All in One Solution
            </Animatable.Text>
          </View>

          {/* Right Section with Login Form */}
          <Animatable.View 
            animation="fadeInRight" 
            duration={1000}
            style={styles.formContainer}
          >
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#008080" style={styles.inputIcon} />
        <TextInput
            style={styles.input}
            placeholder="Enter your access code"
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
            
         
           
              <Text style={styles.checkboxLabel}>Cant Recall Code ? Contact Admin</Text>
    
            
            {/* Login Button */}
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>LOGIN</Text>
            </TouchableOpacity>
            
            {/* Divider */}
         
            {/* Footer Links */}
          
          </Animatable.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    flexDirection: width > 768 ? 'row' : 'column',
  },
  logoContainer: {
    flex: 1,
    backgroundColor: '#008080',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...(width > 768 ? { 
      width: '50%',
      height: '100%'
    } : {
      height: isSmallScreen ? 200 : 250,
      width: '100%',
    }),
  },
  logoBackground: {
    backgroundColor: 'white',
    borderRadius: 100,
    padding: 20,
    marginBottom: 20,
    ...(width > 768 ? {
      width: 250,
      height: 250,
      justifyContent: 'center',
      alignItems: 'center',
    } : {
      width: 120,
      height: 120,
    }),
  },
  logo: {
    ...(width > 768 ? {
      width: 200,
      height: 200,
    } : {
      width: 80,
      height: 80,
    }),
  },
  tagline: {
    color: 'white',
    fontSize: width > 768 ? 24 : 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins-Bold',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: width > 768 ? 16 : 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'Poppins-Regular',
  },
  formContainer: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    ...(width > 768 ? {
      width: '50%',
    } : {}),
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#008080',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#008080',
  },
  checkboxLabel: {
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
  },
  loginButton: {
    backgroundColor: '#008080',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  googleButtonText: {
    marginLeft: 10,
    color: '#2C3E50',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkText: {
    color: '#008080',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
});

export default LoginScreen;