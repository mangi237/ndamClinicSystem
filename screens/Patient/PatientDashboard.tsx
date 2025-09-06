import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Linking, 
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const PatientDetailsViewScreen = ({ route }) => {
  const { patient: initialPatient } = route.params;
  const [patient, setPatient] = useState(initialPatient);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingResult, setLoadingResult] = useState<string | null>(null);

  if (!patient) {
    return (
      <View style={styles.container}>
        <Text>Error: No patient data received</Text>
      </View>
    );
  }

  // Function to fetch updated patient data
  const fetchPatientData = async () => {
    if (!patient.id) return;
    
    try {
      setRefreshing(true);
      const docRef = doc(db, 'patients', patient.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setPatient({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      Alert.alert('Error', 'Failed to refresh patient data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch updated data when screen loads
    fetchPatientData();
  }, []);

  const openLabResult = async (fileUrl: string, fileName: string) => {
    try {
      setLoadingResult(fileName);
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('Error', 'Cannot open the file URL');
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      Alert.alert('Error', 'Failed to open the file. Please try again later.');
    } finally {
      setLoadingResult(null);
    }
  };

  // Check if patient has lab results
  const hasLabResults = () => {
    return patient.resultFile || (patient.resultUrls && patient.resultUrls.length > 0);
  };

  // Get all result files in a consistent format
  const getAllResultFiles = () => {
    const results = [];
    
    // Check for single resultFile (new format)
    if (patient.resultFile) {
      results.push({
        fileName: patient.resultFile.fileName,
        url: patient.resultFile.fileUrl,
        uploadedAt: patient.resultFile.uploadedAt,
        uploadedBy: patient.resultFile.uploadedBy || 'Lab Technician'
      });
    }
    
    // Check for resultUrls array (old format)
    if (patient.resultUrls && patient.resultUrls.length > 0) {
      patient.resultUrls.forEach(result => {
        results.push({
          fileName: result.fileName,
          url: result.url,
          uploadedAt: result.uploadedAt,
          uploadedBy: result.uploadedBy
        });
      });
    }
    
    return results;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchPatientData} />
        }
      >
        <LinearGradient
          colors={['#1B5E20', '#2E7D32', '#388E3C']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              {patient.profileImage ? (
                <Image source={{ uri: patient.profileImage }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person-circle" size={100} color="white" />
              )}
              <Text style={styles.greeting}>Hello, {patient.name}</Text>
              <Text style={styles.tagline}>Have the Best Experience with us</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Patient Info */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Patient Information</Text>
          <Text style={styles.detailText}>Name: {patient.name}</Text>
          <Text style={styles.detailText}>Patient ID: {patient.patientId}</Text>
          <Text style={styles.detailText}>Age: {patient.age}</Text>
          <Text style={styles.detailText}>Gender: {patient.gender}</Text>
          <Text style={styles.detailText}>Phone: {patient.phone}</Text>
          <Text style={styles.detailText}>Address: {patient.address}</Text>
          <Text style={[
            styles.detailText,
            patient.status === 'completed' ? styles.completedStatus : 
            patient.status === 'waiting' ? styles.waitingStatus : styles.registeredStatus
          ]}>
            Status: {patient.status.toUpperCase()}
          </Text>
        
          {/* Billing Information */}
          {patient.paymentDetails ? (
            <View style={styles.paymentCard}>
              <Text style={styles.paymentTitle}>Billing Information</Text>
              <Text style={styles.detailText}>Payer: {patient.paymentDetails.payerName}</Text>
              <Text style={styles.detailText}>Price: ${patient.paymentDetails.price}</Text>
              <Text style={[
                styles.detailText,
                patient.paymentDetails.paymentStatus === 'paid' ? styles.paidStatus : 
                patient.paymentDetails.paymentStatus === 'pending' ? styles.pendingStatus : styles.refundedStatus
              ]}>
                Payment Status: {patient.paymentDetails.paymentStatus.toUpperCase()}
              </Text>
              <Text style={styles.detailText}>Method: {patient.paymentDetails.paymentMethod}</Text>
              <Text style={styles.detailText}>
                Insurance: {patient.paymentDetails.insuranceName} ({patient.paymentDetails.insuranceId})
              </Text>
              <Text style={styles.detailText}>Date: {new Date(patient.paymentDetails.date).toLocaleDateString()}</Text>
            </View>
          ) : (
            <View style={styles.paymentCard}>
              <Text style={styles.paymentTitle}>Billing Information</Text>
              <Text style={styles.detailText}>No payment information available</Text>
            </View>
          )}
        </View>

        {/* Lab Tests */}
        {patient.labTests && patient.labTests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requested Lab Tests</Text>
            {patient.labTests.map((test, index) => (
              <View key={index} style={styles.testItem}>
                <Text style={styles.testName}>{test.name}</Text>
                <Text style={styles.testDescription}>{test.description}</Text>
                <Text style={styles.testDetail}>Category: {test.category}</Text>
                <Text style={styles.testDetail}>Samples: {test.samples.join(', ')}</Text>
                <Text style={styles.testDetail}>Price: ${test.price}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Lab Results */}
        {hasLabResults() ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lab Results</Text>
            {getAllResultFiles().map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Ionicons name="document-text" size={24} color="#2196F3" />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{result.fileName}</Text>
                  <Text style={styles.resultDate}>
                    Uploaded: {new Date(result.uploadedAt).toLocaleDateString()} by {result.uploadedBy}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => openLabResult(result.url, result.fileName)}
                  style={styles.downloadBtn}
                  disabled={loadingResult === result.fileName}
                >
                  {loadingResult === result.fileName ? (
                    <ActivityIndicator size="small" color="#2196F3" />
                  ) : (
                    <>
                      <Ionicons name="download" size={20} color="#2196F3" />
                      <Text style={styles.downloadText}>Open</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lab Results</Text>
            <Text style={styles.noResults}>
              No results available yet. Please check back later.
            </Text>
          </View>
        )}

        {/* Collected Samples */}
        {patient.samplesCollected && patient.samplesCollected.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collected Samples</Text>
            <View style={styles.samplesContainer}>
              {patient.samplesCollected.map((sample, index) => (
                <View key={index} style={[styles.sampleChip, styles.sampleCollected]}>
                  <Text style={styles.sampleText}>{sample}</Text>
                  <Ionicons name="checkmark" size={16} color="#27AE60" style={styles.checkIcon} />
                </View>
              ))}
            </View>
            <Text style={styles.sampleDate}>
              Collected on: {new Date(patient.updatedAt || patient.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA'
  },
  content: { 
    paddingBottom: 20 
  },
  gradient: { 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20 
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  userInfo: { 
    alignItems: 'center' 
  },
  profileImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    marginBottom: 10 
  },
  greeting: { 
    color: 'white', 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 5 
  },
  tagline: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 14 
  },
  detailCard: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 12, 
    margin: 16, 
    elevation: 3 
  },
  detailTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    color: '#2E7D32' 
  },
  detailText: { 
    fontSize: 16, 
    marginBottom: 8 
  },
  completedStatus: {
    color: '#27AE60',
    fontWeight: 'bold'
  },
  waitingStatus: {
    color: '#E67E22',
    fontWeight: 'bold'
  },
  registeredStatus: {
    color: '#3498DB',
    fontWeight: 'bold'
  },
  paymentCard: { 
    backgroundColor: '#E8F5E9', 
    padding: 16, 
    borderRadius: 8, 
    marginTop: 16 
  },
  paymentTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 12,
    color: '#2E7D32'
  },
  paidStatus: {
    color: '#27AE60',
    fontWeight: 'bold'
  },
  pendingStatus: {
    color: '#E67E22',
    fontWeight: 'bold'
  },
  refundedStatus: {
    color: '#E74C3C',
    fontWeight: 'bold'
  },
  section: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    marginHorizontal: 16, 
    marginBottom: 16 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    color: '#2C3E50',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
    paddingBottom: 8
  },
  testItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333'
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  testDetail: {
    fontSize: 14,
    color: '#666'
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  resultDate: {
    fontSize: 12,
    color: '#666'
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 8
  },
  downloadText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 4,
    fontWeight: '500'
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8
  },
  samplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  sampleChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  sampleCollected: {
    backgroundColor: '#DFF2DF'
  },
  sampleText: {
    fontSize: 12,
    color: '#1976D2',
    marginRight: 4
  },
  sampleDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic'
  },
  checkIcon: {
    marginLeft: 4
  }
});

export default PatientDetailsViewScreen;