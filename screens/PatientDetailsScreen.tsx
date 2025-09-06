import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Linking, 
  Image, 
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/authContext';

const PatientDetailsScreen = ({ route }) => {
  const { patient: initialPatient } = route.params;
  const [patient, setPatient] = useState(initialPatient);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [collectedSamples, setCollectedSamples] = useState(patient.samplesCollected || []);
  const [accessCode, setAccessCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
    const [loadingResult, setLoadingResult] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    patient.paymentDetails?.paymentMethod || 'credit card'
  );
  const [payerName, setPayerName] = useState(
    patient.paymentDetails?.payerName || patient.name || ''
  );
  
  const { user: currentUser } = useAuth();

  if (!patient) {
    return (
      <View style={styles.container}>
        <Text>Error: No patient data received</Text>
      </View>
    );
  }

  const downloadResult = async (fileUrl) => {
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('Error', 'Cannot open this file type.');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const toggleSampleCollection = (sample) => {
    if (collectedSamples.includes(sample)) {
      setCollectedSamples(collectedSamples.filter(s => s !== sample));
    } else {
      setCollectedSamples([...collectedSamples, sample]);
    }
  };

  const confirmSampleCollection = async () => {
    try {
      // Update patient status to "waiting" and add collected samples
      await updateDoc(doc(db, 'patients', patient.id), {
        samplesCollected: collectedSamples,
        status: 'waiting',
        updatedAt: new Date(),
      });
      
      // Update local state
      setPatient({
        ...patient,
        samplesCollected: collectedSamples,
        status: 'waiting'
      });
      
      Alert.alert('Success', 'Samples collected successfully!');
      setShowSampleModal(false);
    } catch (error) {
      console.error('Error updating samples:', error);
      Alert.alert('Error', 'Failed to update sample collection');
    }
  };

  const validatePayment = async () => {
    if (!accessCode) {
      Alert.alert('Error', 'Please enter access code');
      return;
    }
    
    if (accessCode !== currentUser.code) {
      Alert.alert('Error', 'Invalid access code');
      return;
    }
    
    setIsValidating(true);
    
    try {
      const totalPrice = patient.labTests.reduce((sum, test) => sum + test.price, 0);
      
      const paymentData = {
        payerName,
        price: totalPrice,
        paymentStatus: 'paid',
        paymentMethod: selectedPaymentMethod,
        date: new Date(),
        insuranceName: patient.insuranceProvider || 'No Insurance',
        insuranceId: patient.insuranceId || 'N/A'
      };
      
      // Update payment details and change status to "waiting"
      await updateDoc(doc(db, 'patients', patient.id), {
        paymentDetails: paymentData,
        status: 'waiting',
        updatedAt: new Date(),
      });
      
      // Update local state
      setPatient({
        ...patient,
        paymentDetails: paymentData,
        status: 'waiting'
      });
      
      Alert.alert('Success', 'Payment validated successfully! Patient status changed to waiting.');
      setShowPaymentModal(false);
      setAccessCode('');
    } catch (error) {
      console.error('Error validating payment:', error);
      Alert.alert('Error', 'Failed to validate payment');
    } finally {
      setIsValidating(false);
    }
  };

  const getAllRequiredSamples = () => {
    if (!patient.labTests) return [];
    return patient.labTests.flatMap(test => test.samples || []);
  };

  const isSampleCollected = (sample) => collectedSamples.includes(sample);
const hasLabResults = () => {
    return patient.resultFile || (patient.resultUrls && patient.resultUrls.length > 0);
  };
  const areAllSamplesCollected = () => {
    const requiredSamples = getAllRequiredSamples();
    return requiredSamples.every(sample => collectedSamples.includes(sample));
  };
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
  const paymentMethods = [
    'credit card', 
    'debit card', 
    'paypal', 
    'cash', 
    'Mobile Money'
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Patient Info */}
        <View style={styles.detailCard}>
          <View style={styles.headerRow}>
            {patient.profileImage ? (
              <Image source={{ uri: patient.profileImage }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person-circle" size={100} color="#1E96A9" />
            )}
            <View style={styles.infoColumn}>
              <Text style={styles.detailTitle}>{patient.name}</Text>
              <Text style={styles.detailText}>ID: {patient.patientId}</Text>
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
              {patient.bloodType && <Text style={styles.detailText}>Blood Type: {patient.bloodType}</Text>}
            </View>
          </View>

          {/* Billing Information - Updated after validation */}
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

          {/* Collected Samples Information */}
          {patient.samplesCollected && patient.samplesCollected.length > 0 && (
            <View style={styles.samplesInfoCard}>
              <Text style={styles.samplesInfoTitle}>Collected Samples</Text>
              <View style={styles.samplesContainer}>
                {patient.samplesCollected.map((sample, index) => (
                  <View key={index} style={[styles.sampleChip, styles.sampleCollected]}>
                    <Text style={styles.sampleText}>{sample}</Text>
                    <Ionicons name="checkmark" size={16} color="#27AE60" style={styles.checkIcon} />
                  </View>
                ))}
              </View>
              <Text style={styles.samplesInfoText}>
                Collected on: {new Date(patient.updatedAt || patient.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Lab Tests */}
        {patient.labTests && patient.labTests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lab Tests & Samples</Text>
            {patient.labTests.map((test, index) => (
              <View key={index} style={styles.testItem}>
                <Text style={styles.testName}>{test.name}</Text>
                <Text style={styles.testDescription}>{test.description}</Text>
                <Text style={styles.testPrice}>Price: ${test.price}</Text>
                <View style={styles.samplesContainer}>
                  <Text style={styles.samplesTitle}>Required Samples:</Text>
                  {test.samples.map((sample, i) => (
                    <View
                      key={i}
                      style={[
                        styles.sampleChip,
                        (patient.samplesCollected || []).includes(sample) && styles.sampleCollected
                      ]}
                    >
                      <Text style={styles.sampleText}>{sample}</Text>
                      {(patient.samplesCollected || []).includes(sample) && (
                        <Ionicons name="checkmark" size={16} color="#27AE60" style={styles.checkIcon} />
                      )}
                    </View>
                  ))}
                </View>
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
      </ScrollView>

      {/* Action Buttons - Validate Payment button hidden after successful validation */}
      <View style={styles.actionButtonsContainer}>
        {/* Only show Collect Samples button for analyzer if samples are not already collected */}
        {currentUser?.role === 'analyzer' && 
          (!patient.samplesCollected || patient.samplesCollected.length === 0) && (
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowSampleModal(true)}>
            <Ionicons name="flask" size={20} color="white" />
            <Text style={styles.actionButtonText}>Collect Samples</Text>
          </TouchableOpacity>
        )}

        {/* Show samples collected message if samples are already collected */}
        {currentUser?.role === 'analyzer' && 
          patient.samplesCollected && patient.samplesCollected.length > 0 && (
          <View style={[styles.actionButton, styles.completedButton]}>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.actionButtonText}>Samples Collected</Text>
          </View>
        )}
        
        {/* Only show Validate Payment button for cashier/receptionist if payment is not already paid */}
        {(currentUser?.role === 'cashier' || currentUser?.role === 'receptionist') && 
          patient.paymentDetails?.paymentStatus !== 'paid' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.validateButton]} 
            onPress={() => setShowPaymentModal(true)}
          >
            <Ionicons name="card" size={20} color="white" />
            <Text style={styles.actionButtonText}>Validate Payment</Text>
          </TouchableOpacity>
        )}

        {/* Show payment validated message if payment is already paid */}
        {(currentUser?.role === 'cashier' || currentUser?.role === 'receptionist') && 
          patient.paymentDetails?.paymentStatus === 'paid' && (
          <View style={[styles.actionButton, styles.paidButton]}>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.actionButtonText}>Payment Validated</Text>
          </View>
        )}
      </View>

      {/* Sample Collection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSampleModal}
        onRequestClose={() => setShowSampleModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sample Collection</Text>
            <Text style={styles.modalSubtitle}>Select collected samples:</Text>
            
            {getAllRequiredSamples().map((sample, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalOption,
                  isSampleCollected(sample) && styles.modalOptionSelected
                ]}
                onPress={() => toggleSampleCollection(sample)}
              >
                <Text style={styles.modalOptionText}>{sample}</Text>
                {isSampleCollected(sample) && (
                  <Ionicons name="checkmark" size={20} color="#27AE60" />
                )}
              </TouchableOpacity>
            ))}
            
            <View style={styles.collectionStatus}>
              <Text style={styles.collectionStatusText}>
                {areAllSamplesCollected() 
                  ? 'All samples collected' 
                  : `${collectedSamples.length} of ${getAllRequiredSamples().length} samples collected`
                }
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowSampleModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmSampleCollection}
                disabled={!areAllSamplesCollected()}
              >
                <Text style={styles.modalButtonText}>Confirm Collection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Validation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentModal}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Validate Payment</Text>
            
            <Text style={styles.inputLabel}>Payer Name</Text>
            <TextInput
              style={styles.input}
              value={payerName}
              onChangeText={setPayerName}
              placeholder="Enter payer name"
            />
            
            <Text style={styles.inputLabel}>Tests & Pricing</Text>
            {patient.labTests.map((test, index) => (
              <View key={index} style={styles.testPriceRow}>
                <Text style={styles.testName}>{test.name}</Text>
                <Text style={styles.testPrice}>${test.price}</Text>
              </View>
            ))}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>
                ${patient.labTests.reduce((sum, test) => sum + test.price, 0)}
              </Text>
            </View>
            
            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              {paymentMethods.map(method => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethod,
                    selectedPaymentMethod === method && styles.paymentMethodSelected
                  ]}
                  onPress={() => setSelectedPaymentMethod(method)}
                >
                  <Text style={styles.paymentMethodText}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.inputLabel}>Access Code</Text>
            <TextInput
              style={styles.input}
              value={accessCode}
              onChangeText={setAccessCode}
              placeholder="Enter access code"
              secureTextEntry
            />
            
            <TouchableOpacity 
              style={[styles.validatePaymentButton, isValidating && styles.disabledButton]} 
              onPress={validatePayment}
              disabled={isValidating}
            >
              {isValidating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.validatePaymentText}>Validate Payment</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA'
  },
  content: { 
    paddingBottom: 100 
  },
  detailCard: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 12, 
    margin: 16, 
    elevation: 3 
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    marginBottom: 16
  },
  profileImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    marginRight: 16 
  },
  infoColumn: { 
    flex: 1 
  },
  detailTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: '#2C3E50'
  },
  detailText: { 
    fontSize: 16, 
    marginBottom: 4,
    color: '#34495E'
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
  samplesInfoCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginTop: 16
  },
  samplesInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1976D2'
  },
  samplesInfoText: {
    fontSize: 14,
    color: '#546E7A',
    marginTop: 8,
    fontStyle: 'italic'
  },
  paymentTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
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
    marginBottom: 16,
    color: '#2C3E50',
    borderBottomWidth: 1, 
    borderBottomColor: '#ECF0F1', 
    paddingBottom: 8 
  },
  testItem: { 
    backgroundColor: '#F8F9FA', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 12 
  },
  testName: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 4,
    color: '#2C3E50'
  },
  testDescription: { 
    fontSize: 14, 
    color: '#7F8C8D', 
    marginBottom: 4 
  },
  testPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 8
  },
  testPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 8
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    paddingHorizontal: 8
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50'
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60'
  },
  samplesContainer: { 
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  samplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495E',
    width: '100%'
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
  sampleText: { 
    fontSize: 12, 
    color: '#1976D2',
    marginRight: 4
  },
  sampleCollected: { 
    backgroundColor: '#DFF2DF' 
  },
  checkIcon: {
    marginLeft: 4
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
    marginBottom: 4,
    color: '#2C3E50'
  },
  resultDate: { 
    fontSize: 12, 
    color: '#7F8C8D' 
  },
  downloadBtn: { 
    padding: 8, 
    backgroundColor: '#E3F2FD', 
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  downloadText: { 
    fontSize: 12, 
    color: '#2196F3', 
    marginLeft: 4, 
    fontWeight: '500' 
  },
  noResults: { 
    textAlign: 'center', 
    color: '#95A5A6', 
    fontStyle: 'italic', 
    marginTop: 8 
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#1E96A9', 
    padding: 15, 
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 8
  },
  validateButton: {
    backgroundColor: '#27AE60'
  },
  paidButton: {
    backgroundColor: '#95A5A6'
  },
  completedButton: {
    backgroundColor: '#27AE60'
  },
  actionButtonText: { 
    color: 'white', 
    marginLeft: 10, 
    fontWeight: '600', 
    fontSize: 16 
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2C3E50',
    textAlign: 'center'
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#34495E'
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginBottom: 8
  },
  modalOptionSelected: {
    backgroundColor: '#E8F5E9'
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2C3E50'
  },
  collectionStatus: {
    padding: 12,
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    marginVertical: 12
  },
  collectionStatusText: {
    textAlign: 'center',
    color: '#33691E',
    fontWeight: '600'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#E0E0E0'
  },
  confirmButton: {
    backgroundColor: '#1E96A9'
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#2C3E50'
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16
  },
  paymentMethod: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ECF0F1'
  },
  paymentMethodSelected: {
    backgroundColor: '#1E96A9',
    borderColor: '#1E96A9'
  },
  paymentMethodText: {
    color: '#2C3E50',
    fontSize: 14
  },
  validatePaymentButton: {
    backgroundColor: '#27AE60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8
  },
  disabledButton: {
    backgroundColor: '#95A5A6'
  },
  validatePaymentText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default PatientDetailsScreen;