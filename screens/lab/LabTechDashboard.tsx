// components/lab/LabDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Alert, ActivityIndicator, Modal, ScrollView, Animated 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import * as DocumentPicker from 'expo-document-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { Patient, LabTest } from '../../types/Patient';
import { useAuth } from '../../context/authContext';
import AnimatedHeader from '../../components/common/AnimateHeader';
import { supabase } from '../../services/supabase'
const LabDashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { user } = useAuth();
  const scrollY = new Animated.Value(0);

  // Statistics
  const [stats, setStats] = useState({
    totalPatients: 0,
    waitingPatients: 0,
    completedPatients: 0,
    collectedSamples: 0,
    totalSamples: 0,
  });

  useEffect(() => {
    if (!user) return;

    const patientsQuery = query(
      collection(db, 'patients'),
      where('status', 'in', ['waiting', 'completed'])
    );

    const unsubscribe = onSnapshot(patientsQuery, (snapshot) => {
      const patientData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      
      setPatients(patientData);
      
      // Calculate statistics
      const waitingPatients = patientData.filter(p => p.status === 'waiting').length;
      const completedPatients = patientData.filter(p => p.status === 'completed').length;
      
      let collectedSamples = 0;
      let totalSamples = 0;
      
      patientData.forEach(patient => {
        if (patient.labTests) {
          patient.labTests.forEach(test => {
            totalSamples += test.samples?.length || 0;
            collectedSamples += test.samples?.length || 0; // Assuming all samples are collected
          });
        }
      });
      
      setStats({
        totalPatients: patientData.length,
        waitingPatients,
        completedPatients,
        collectedSamples,
        totalSamples,
      });
    });

    return () => unsubscribe();
  }, [user]);

  const pickDocument = async () => {
    if (!selectedPatient) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await uploadResult(file.uri, file.name || 'result.pdf');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadResult = async (fileUri: string, fileName: string) => {
  if (!selectedPatient || !user) return;

  setUploading(true);
  try {
    // Convert file URI to blob
    const response = await fetch(fileUri);
    const fileBlob = await response.blob();
    
    // Create a unique file path
    const filePath = `patient-results/${selectedPatient.id}/${Date.now()}_${fileName}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('lab-results') // Your bucket name
      .upload(filePath, fileBlob);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from('lab-results')
      .getPublicUrl(filePath);

    const downloadURL = urlData.publicUrl;

    // Update Firestore with the real file URL
    const existingResults = selectedPatient.resultUrls || [];
    
    await updateDoc(doc(db, 'patients', selectedPatient.id!), {
      resultUrls: [...existingResults, {
        url: downloadURL,
        fileName: fileName,
        uploadedAt: new Date(),
        uploadedBy: user.name,
      }],
      status: 'completed',
      updatedAt: new Date(),
      completedBy: user.name,
      completedAt: new Date(),
    });

    Alert.alert('Success', 'Lab results uploaded successfully!');
    setShowUploadModal(false);
    setSelectedPatient(null);
  } catch (error) {
    console.error('Error uploading results:', error);
    Alert.alert('Error', `Failed to upload results: ${error.message}`);
  } finally {
    setUploading(false);
  }
};

  const getRequiredSamples = (patient: Patient): string[] => {
    if (!patient.labTests) return [];
    return patient.labTests.flatMap(test => test.samples || []);
  };

  const getCollectedSamples = (patient: Patient): string[] => {
    return patient.labTests.flatMap(test => test.samples) || [];
  };

  const renderStatsCard = (title: string, value: number, subtitle: string, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
    </View>
  );

  const renderPatientItem = ({ item }: { item: Patient }) => {
    const requiredSamples = getRequiredSamples(item);
    const collectedSamples = getCollectedSamples(item);
    const allSamplesCollected = requiredSamples.every(sample => 
      collectedSamples.includes(sample)
    );

    return (
      <View style={styles.patientCard}>
        <View style={styles.patientHeader}>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{item.name}</Text>
            <Text style={styles.patientId}>ID: {item.patientId}</Text>
            <View style={[styles.statusBadge, 
              { backgroundColor: item.status === 'completed' ? '#4CAF50' : '#FF9800' }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          
          {item.status === 'waiting' && allSamplesCollected && (
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => {
                setSelectedPatient(item);
                setShowUploadModal(true);
              }}
            >
              <Ionicons name="cloud-upload" size={20} color="white" />
              <Text style={styles.uploadButtonText}>Upload Results</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.testsSection}>
          <Text style={styles.sectionTitle}>Tests Requested:</Text>
          {item.labTests?.map((test, index) => (
            <View key={index} style={styles.testItem}>
              <Ionicons name="flask" size={16} color="#666" />
              <Text style={styles.testName}>{test.name}</Text>
              <Text style={styles.testPrice}>${test.price}</Text>
            </View>
          ))}
        </View>

        <View style={styles.samplesSection}>
          <Text style={styles.sectionTitle}>Samples:</Text>
          <View style={styles.samplesContainer}>
            {requiredSamples.map((sample, index) => (
              <View 
                key={index} 
                style={[
                  styles.sampleChip,
                  collectedSamples.includes(sample) && styles.sampleCollected
                ]}
              >
                <Text style={styles.sampleText}>{sample}</Text>
                {collectedSamples.includes(sample) && (
                  <Ionicons name="checkmark" size={16} color="#27AE60" />
                )}
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AnimatedHeader scrollY={scrollY} />
      
      <ScrollView 
        style={styles.content}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            {renderStatsCard('Total Patients', stats.totalPatients, 'In lab', 'people', '#2196F3')}
            {renderStatsCard('Waiting', stats.waitingPatients, 'For results', 'time', '#FF9800')}
          </View>
          <View style={styles.statsRow}>
            {renderStatsCard('Completed', stats.completedPatients, 'Tests done', 'checkmark-circle', '#4CAF50')}
            {renderStatsCard('Samples', stats.collectedSamples, `of ${stats.totalSamples} collected`, 'water', '#9C27B0')}
          </View>
        </View>

        <Text style={styles.sectionHeader}>Patients</Text>
        
        <FlatList
          data={patients}
          renderItem={renderPatientItem}
          keyExtractor={item => item.id!}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="flask-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No patients requiring lab work</Text>
            </View>
          }
        />
      </ScrollView>

      <Modal visible={showUploadModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Upload Results for {selectedPatient?.name}
            </Text>
            
            <Text style={styles.modalSubtitle}>
              Patient ID: {selectedPatient?.patientId}
            </Text>

            <View style={styles.testsList}>
              <Text style={styles.sectionTitle}>Tests Completed:</Text>
              {selectedPatient?.labTests?.map((test, index) => (
                <View key={index} style={styles.testItem}>
                  <Ionicons name="flask" size={16} color="#666" />
                  <Text style={styles.testName}>{test.name}</Text>
                </View>
              ))}
            </View>

            <View style={styles.samplesList}>
              <Text style={styles.sectionTitle}>Collected Samples:</Text>
              {selectedPatient && getCollectedSamples(selectedPatient).map((sample, index) => (
                <View key={index} style={styles.sampleItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
                  <Text style={styles.sampleText}>{sample}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
              onPress={pickDocument}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="document" size={20} color="white" />
                  <Text style={styles.uploadBtnText}>Select PDF File</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => {
                  setShowUploadModal(false);
                  setSelectedPatient(null);
                }}
                disabled={uploading}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginBottom: 10,
    color: '#333',
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  patientId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '600',
  },
  testsSection: {
    marginBottom: 10,
  },
  samplesSection: {
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  testName: {
    flex: 1,
    marginLeft: 8,
    color: '#333',
  },
  testPrice: {
    color: '#2196F3',
    fontWeight: '600',
  },
  samplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  sampleCollected: {
    backgroundColor: '#E8F5E9',
  },
  sampleText: {
    marginRight: 4,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  testsList: {
    marginBottom: 15,
  },
  samplesList: {
    marginBottom: 20,
  },
  sampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  uploadBtn: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  uploadBtnDisabled: {
    backgroundColor: '#90CAF9',
  },
  uploadBtnText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: '600',
  },
});

export default LabDashboard;