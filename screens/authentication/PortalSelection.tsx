// screens/authentication/PortalSelection.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Animatable from 'react-native-animatable';

type RootStackParamList = {
  PortalSelection: undefined;
  CategorySelection: undefined;
  PatientLogin: undefined;
};

type PortalSelectionNavigationProp = StackNavigationProp<RootStackParamList, 'PortalSelection'>;

const PortalSelection = () => {
  const navigation = useNavigation<PortalSelectionNavigationProp>();
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [showAdminButton, setShowAdminButton] = useState(false);

  const handleStaffSelect = () => {
    navigation.navigate('CategorySelection');
  };

  const handlePatientSelect = () => {
    navigation.navigate('PatientLogin');
  };

  const handleSecretAdminTap = () => {
  const newCount = adminTapCount + 1;
  setAdminTapCount(newCount);

  if (newCount === 5) {
    console.log('admin created');
    setShowAdminButton(true); // Show button
    setAdminTapCount(0); // reset counter
  }
};
  return (
    <View style={styles.container}>
      <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.headerText}>PILEM LABS</Text>
        <Text style={styles.subHeaderText}>Your Healthcare Portal</Text>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={1000} delay={300} style={styles.content}>
        <TouchableOpacity
          style={[styles.portalButton, styles.patientButton]}
          onPress={handlePatientSelect}
        >
          <Ionicons name="person-circle-outline" size={40} color="#fff" />
          <Text style={styles.buttonText}>Continue as Patient</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>━ or ━</Text>

        {/* Hidden admin access - disguised as decorative element */}
        <TouchableOpacity
          style={styles.hiddenAdminButton}
          onPress={handleSecretAdminTap}
          activeOpacity={0.8}
        >
          <View style={styles.hiddenButtonContent}>
            <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.3)" />
            <Text style={styles.hiddenButtonText}>Privacy Policy</Text>
          </View>
        </TouchableOpacity>
      </Animatable.View>
{showAdminButton && (
    <View style ={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 20, backgroundColor: 'transparent', }}>
         <TouchableOpacity  
    onPress={() => navigation.navigate('CategorySelection')} 
    style={{ 
      height: 40, 
      width: 200, 
      backgroundColor: 'black', 
      justifyContent: 'center', 
      alignItems: 'center', 
      borderRadius: 10,
      marginTop: 20
    , borderWidth : 1,
    
    
      borderColor: '#013220',
    }}
  >
    <Text style={{color: 'white', fontWeight: 'bold'}}>Continue as Admin</Text>
  </TouchableOpacity>
        </View>
 
)}
      {/* Decorative footer that's actually the secret admin button */}
      <TouchableOpacity
        style={styles.footer}
        onPress={handleSecretAdminTap}
        activeOpacity={1}
      >
        <Text style={styles.footerText}>© 2024 PILEM LABS. All rights reserved.</Text>
        {adminTapCount > 0 && (
          <Text style={styles.tapCounter}>{5 - adminTapCount} more taps for admin</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#013220', // Dark green background
  },
  header: {
    backgroundColor: '#013220',
    padding: 25,
    paddingTop: 80,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  subHeaderText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  portalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    paddingVertical: 25,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    transform: [{ scale: 1 }],
  },
  patientButton: {
    backgroundColor: '#1E96A9',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 15,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  orText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginVertical: 10,
    fontStyle: 'italic',
  },
  hiddenAdminButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  hiddenButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hiddenButtonText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    marginLeft: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 15,
  },
  footerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  tapCounter: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 5,
    fontStyle: 'italic',
  },
});

export default PortalSelection;