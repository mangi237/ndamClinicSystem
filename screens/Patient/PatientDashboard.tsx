import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Patient } from '../../types/Patient';
import AnimatedHeader from '../../components/common/AnimateHeader';

const PatientDetailsViewScreen = ({ route }) => {
  const { patient } = route.params;

  if (!patient) {
    return (
      <View style={styles.container}>
        <Text>Error: No patient data received</Text>
      </View>
    );
  }

  const downloadResult = async (fileUrl: string, fileName: string) => {
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('Error', 'Cannot open this file type. Please download manually.');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  return (
    <View style={styles.container}>
<View>

</View>
      <ScrollView contentContainerStyle={styles.content}>
           <View style={styles.headerContent}>
                  <View style={styles.userInfo}>
                    <Text style={styles.greeting}>Hello  {patient?.name} </Text>
                
                    <Text style={styles.tagline}>Have the Best Experience with us</Text>
                  </View>
                  
                  <View style={styles.logoContainer}>
                    <Image
                      source={require('../../assets/images/logo.png')} // Replace with your logo
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                </View>
        {/* Patient Info */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Patient Information</Text>
          <Text style={styles.detailText}>Name: {patient.name}</Text>
          <Text style={styles.detailText}>Patient ID: {patient.patientId}</Text>
          <Text style={styles.detailText}>Age: {patient.age}</Text>
          <Text style={styles.detailText}>Gender: {patient.gender}</Text>
          <Text style={styles.detailText}>Phone: {patient.phone}</Text>
          <Text style={styles.detailText}>Status: {patient.status}</Text>
          {patient.bloodType && <Text style={styles.detailText}>Blood Type: {patient.bloodType}</Text>}
        </View>

        {/* Lab Tests */}
        {patient.labTests && patient.labTests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requested Lab Tests</Text>
            {patient.labTests.map((test, index) => (
              <View key={index} style={styles.testItem}>
                <Text style={styles.testName}>{test.name}</Text>
                <Text style={styles.testDescription}>{test.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Lab Results */}
        {patient.resultUrls && patient.resultUrls.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Lab Results</Text>
            {patient.resultUrls.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Ionicons name="document-text" size={24} color="#2196F3" />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{result.fileName}</Text>
                  <Text style={styles.resultDate}>
                    Uploaded on {result.uploadedAt.toDate().toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => downloadResult(result.url, result.fileName)}
                  style={styles.downloadBtn}
                >
                  <Ionicons name="download" size={20} color="#2196F3" />
                  <Text style={styles.downloadText}>Download</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lab Results</Text>
            <Text style={styles.noResults}>No results available yet. Please check back later.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 16,
  },
  detailCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2C3E50',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 6,
    color: '#34495E',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  testItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 12,
    color: '#666',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 8,
  },
  downloadText: {
    color: '#2196F3',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
   headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  userInfo: {
        fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  greeting: {
    color: 'white',
    fontSize: 16,
        fontFamily: 'Poppins-Regular',
    fontWeight: '500',
    
  },
  userName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  logoContainer: {
    marginLeft: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
});

export default PatientDetailsViewScreen;