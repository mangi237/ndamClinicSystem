import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import * as Animatable from 'react-native-animatable';
import { db } from '../../services/firebase'; // Adjust this path as needed

const PatientLogin = ({ navigation }) => {
    const [accessCode, setAccessCode] = useState('');
    const [loading, setLoading] = useState(false);

 const handlePatientLogin = async () => {
  if (!accessCode) {
    Alert.alert('Error', 'Please enter your access code.');
    return;
  }

  setLoading(true);

  try {
    const patientsRef = collection(db, 'patients');
    const q = query(patientsRef, where('accessCode', '==', accessCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      Alert.alert('Login Failed', 'Invalid access code. Please try again.');
    } else {
      const patientDoc = querySnapshot.docs[0];
      const patientData = { 
        id: patientDoc.id, 
        ...patientDoc.data(),
        name: patientDoc.data().name,
        status: patientDoc.data().status,
        
      };
      
      // Navigate based on status
      if (patientData.status === 'completed') {
        navigation.navigate('PatientDashboard', { patientData });
      } else {
        navigation.navigate('PatientDashboard', { patientData });
      }
    }
  } catch (error) {
    console.error('Error logging in patient:', error);
    Alert.alert('Error', 'Failed to log in. Please check your network connection.');
  } finally {
    setLoading(false);
  }
};
    return (
        <View style={styles.container}>
            <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
                <Image
                    source={require('../../assets/images/logo.png')} // Update this path to your clinic's logo
                    style={styles.logo}
                />
                <Text style={styles.headerText}>NDAM Clinic</Text>
                <Text style={styles.subHeaderText}>Patient Portal</Text>
            </Animatable.View>
            
            <Animatable.View animation="fadeInUp" duration={1000} style={styles.formContainer}>
                <Text style={styles.promptText}>Enter Your Access Code</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="key" size={20} color="#7F8C8D" />
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., 123456"
                        value={accessCode}
                        onChangeText={setAccessCode}
                        keyboardType="numeric"
                        maxLength={6}
                        editable={!loading}
                    />
                </View>
                
                <TouchableOpacity 
                    style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                    onPress={handlePatientLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.loginButtonText}>Login</Text>
                    )}
                </TouchableOpacity>
                
                <Text style={styles.noteText}>
                    Your access code was provided by the receptionist upon registration.
                </Text>
            </Animatable.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F8F7',
    },
    header: {
        backgroundColor: '#1E96A9',
        padding: 25,
        paddingTop: 60,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10,
    },
    headerText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    subHeaderText: {
        fontSize: 16,
        color: '#E0F7FA',
        marginTop: 5,
    },
    formContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    promptText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
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
    },
    loginButton: {
        backgroundColor: '#1B9A84',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 3,
    },
    loginButtonDisabled: {
        backgroundColor: '#7F8C8D',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    noteText: {
        textAlign: 'center',
        color: '#7F8C8D',
        fontSize: 14,
    },
});

export default PatientLogin;
