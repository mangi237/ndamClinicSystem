import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Patient, LabTest } from '../types/Patient';

import { useAuth } from '../context/authContext';

const PatientDetailsScreen = ({ route }) => {
  const { patient } = route.params;
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [collectedSamples, setCollectedSamples] = useState<string[]>(patient.samplesCollected || []);
  const { user } = useAuth();

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

  const toggleSampleCollection = (sample: string) => {
    if (collectedSamples.includes(sample)) {
      setCollectedSamples(collectedSamples.filter(s => s !== sample));
    } else {
      setCollectedSamples([...collectedSamples, sample]);
    }
  };

  const confirmSampleCollection = async () => {
    try {
      await updateDoc(doc(db, 'patients', patient.id!), {
        samplesCollected: collectedSamples,
        updatedAt: new Date(),
      });

      const allRequiredSamples = getAllRequiredSamples(patient);
      const allCollected = allRequiredSamples.every(sample => 
        collectedSamples.includes(sample)
      );

      if (allCollected) {
        await updateDoc(doc(db, 'patients', patient.id!), {
          status: 'validated',
          updatedAt: new Date(),
        });
      }

      Alert.alert('Success', 'Samples collected successfully!');
      setShowSampleModal(false);
    } catch (error) {
      console.error('Error updating samples:', error);
      Alert.alert('Error', 'Failed to update sample collection');
    }
  };

  const getAllRequiredSamples = (patient: Patient): string[] => {
    if (!patient.labTests) return [];
    return patient.labTests.flatMap(test => test.samples || []);
  };

  const isSampleCollected = (sample: string): boolean => {
    return collectedSamples.includes(sample);
  };

  const areAllSamplesCollected = (): boolean => {
    const requiredSamples = getAllRequiredSamples(patient);
    return requiredSamples.every(sample => collectedSamples.includes(sample));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Patient Info */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Patient Info</Text>
          <Text style={styles.detailText}>Name: {patient.name}</Text>
          <Text style={styles.detailText}>ID: {patient.patientId}</Text>
          <Text style={styles.detailText}>Age: {patient.age}</Text>
          <Text style={styles.detailText}>Gender: {patient.gender}</Text>
          <Text style={styles.detailText}>Phone: {patient.phone}</Text>
          <Text style={styles.detailText}>Status: {patient.status}</Text>
          {patient.bloodType && <Text style={styles.detailText}>Blood Type: {patient.bloodType}</Text>}
          {patient.address && <Text style={styles.detailText}>Address: {patient.address}</Text>}
        </View>

        {/* Lab Tests */}
        {patient.labTests && patient.labTests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lab Tests</Text>
            {patient.labTests.map((test, index) => (
              <View key={index} style={styles.testItem}>
                <Text style={styles.testName}>{test.name}</Text>
                <Text style={styles.testDescription}>{test.description}</Text>
                <View style={styles.samplesContainer}>
                  {test.samples.map((sample, sampleIndex) => (
                    <View key={sampleIndex} style={styles.sampleChip}>
                      <Text style={styles.sampleText}>{sample}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Lab Results */}
        {patient.resultUrls && patient.resultUrls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lab Results</Text>
            {patient.resultUrls.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Ionicons name="document-text" size={24} color="#2196F3" />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{result.fileName}</Text>
                  <Text style={styles.resultDate}>
                    Uploaded by {result.uploadedBy} on {result.uploadedAt.toDate().toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => downloadResult(result.url, result.fileName)}
                  style={styles.downloadBtn}
                >
                  <Ionicons name="download" size={20} color="#2196F3" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sample Collection Button (for analyzer role) */}
      {user?.role === 'analyzer' && patient.status !== 'completed' && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowSampleModal(true)}
        >
          <Ionicons name="flask" size={20} color="white" />
          <Text style={styles.actionButtonText}>Collect Samples</Text>
        </TouchableOpacity>
      )}

      {/* Sample Collection Modal */}
      <Modal visible={showSampleModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Collect Samples for {patient.name}</Text>
            
            <ScrollView style={styles.testsContainer}>
              {patient.labTests && patient.labTests.map((test: LabTest, testIndex: number) => (
                <View key={testIndex} style={styles.testCard}>
                  <Text style={styles.testName}>{test.name}</Text>
                  <Text style={styles.testDescription}>{test.description}</Text>
                  
                  <View style={styles.samplesList}>
                    <Text style={styles.samplesTitle}>Required Samples:</Text>
                    {test.samples && test.samples.map((sample: string, sampleIndex: number) => (
                      <TouchableOpacity
                        key={sampleIndex}
                        style={[
                          styles.sampleItem,
                          isSampleCollected(sample) && styles.sampleItemCollected
                        ]}
                        onPress={() => toggleSampleCollection(sample)}
                      >
                        <Ionicons 
                          name={isSampleCollected(sample) ? "checkbox" : "square-outline"} 
                          size={24} 
                          color={isSampleCollected(sample) ? "#27AE60" : "#7F8C8D"} 
                        />
                        <Text style={styles.sampleText}>{sample}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.progressText}>
                {collectedSamples.length} of {getAllRequiredSamples(patient).length} samples collected
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowSampleModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.confirmButton, !areAllSamplesCollected() && styles.confirmButtonDisabled]}
                  onPress={confirmSampleCollection}
                  disabled={!areAllSamplesCollected()}
                >
                  <Text style={styles.confirmButtonText}>
                    {areAllSamplesCollected() ? 'Validate All Samples' : 'Complete All Samples First'}
                  </Text>
                </TouchableOpacity>
              </View>
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
    marginBottom: 8,
  },
  samplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  sampleChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  sampleText: {
    fontSize: 12,
    color: '#1976D2',
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
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E96A9',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 10,
    fontWeight: '600',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2C3E50',
    textAlign: 'center',
  },
  testsContainer: {
    maxHeight: 400,
  },
  testCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  samplesList: {
    marginTop: 10,
  },
  samplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
  },
  sampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  sampleItemCollected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#27AE60',
  },
  modalFooter: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    paddingTop: 15,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 15,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ECF0F1',
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    padding: 12,
    backgroundColor: '#27AE60',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PatientDetailsScreen;