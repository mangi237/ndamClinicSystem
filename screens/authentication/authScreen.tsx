// screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../context/authContext';

const LoginScreen = ({ navigation, route }) => {
  const [code, setCode] = useState('');
  const { login, loading } = useAuth();
  const { role } = route.params;

  const handleLogin = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter your access code');
      return;
    }

    const result = await login(code);
    
    if (result.success) {
      console.log('Login Results', result)
      switch (result.role) {
        case 'admin':
          navigation.navigate('AdminDashboard');
          break;
        case 'doctor':
          navigation.navigate('DoctorDashboard');
          break;
        case 'nurse':
          navigation.navigate('NurseDashboard');
          break;
        case 'lab':
          navigation.navigate('LabTechDashboard');
          break;
        case 'pharmacy':
          navigation.navigate('PharmacistDashboard');
          break;
        default:
          Alert.alert('Error', 'Invalid role');
      }
    } else {
      Alert.alert('Login Failed', result.error || 'Invalid access code');
    }
  };

  return (
    <View style={styles.container}>
      <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
        <Text style={styles.headerText}>NDAM Clinic</Text>
        <Text style={styles.subHeaderText}>Enter Your Access Code</Text>
      </Animatable.View>
      
      <Animatable.View animation="fadeInUp" duration={1000} style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="key" size={20} color="#7F8C8D" />
          <TextInput
            style={styles.input}
            placeholder="Enter your access code"
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.loginButtonText}>Loading...</Text>
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.noteText}>
          Your access code is provided by the administrator{'\n'}
          Example code for admin: ADM001
        </Text>
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
  },
  subHeaderText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 5,
    fontFamily: 'Poppins-Regular',
  },
  formContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  loginButton: {
    backgroundColor: '#27AE60',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#7F8C8D',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  noteText: {
    textAlign: 'center',
    color: '#7F8C8D',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
});

export default LoginScreen;