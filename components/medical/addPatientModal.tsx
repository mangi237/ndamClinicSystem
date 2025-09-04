import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { PatientCreateData, LabTest } from '../../types/Patient';

interface AddPatientModalProps {
  visible: boolean;
  onClose: () => void;
  onPatientAdded: () => void;
}

// Mock data for lab tests
const MOCK_LAB_TESTS: LabTest[] = [
  { name: 'Complete Blood Count (CBC)', description: 'Count of blood cells.', category: 'Hematology', samples: ['Blood'], price: 2500 },
  { name: 'Urinalysis', description: 'Checks urine.', category: 'Urinalysis', samples: ['Urine'], price: 1800 },
  { name: 'Glucose Test', description: 'Measures blood sugar.', category: 'Chemistry', samples: ['Blood'], price: 1500 },
  { name: 'Liver Function Test (LFT)', description: 'Liver enzymes.', category: 'Serology', samples: ['Blood'], price: 3500 },
];

const AddPatientModal: React.FC<AddPatientModalProps> = ({ visible, onClose, onPatientAdded }) => {
  const [loading, setLoading] = useState(false);
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [formData, setFormData] = useState<PatientCreateData>({
    patientId: '',
    name: '',
    age: 0,
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    guardianName: '',
    bloodType: null,
    allergies: [],
    medicalConditions: [],
    currentMedications: [],
    insuranceProvider: '',
    insuranceId: '',
    labTests: [],
    resultUrl: '',
    accessCode: '',
  });

  const generatePatientId = (): string => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    return `PAT-${timestamp}-${randomNum}`;
  };

  const handleArrayInput = (field: 'allergies' | 'medicalConditions' | 'currentMedications', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [field]: items }));
  };

  const handleTestSelection = (test: LabTest) => {
    const isSelected = selectedTests.some(selected => selected.name === test.name);
    if (isSelected) {
      setSelectedTests(selectedTests.filter(selected => selected.name !== test.name));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.address || !formData.accessCode || selectedTests.length === 0) {
      Alert.alert('Error', 'Please fill in: Name, Phone, Address, Access Code, and select at least one lab test.');
      return;
    }

    setLoading(true);
    try {
      const patientId = generatePatientId();

      const patientData = {
        ...formData,
        patientId,
        labTests: selectedTests,
        status: 'registered',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
;
      const docRef = await addDoc(collection(db, 'patients'), patientData);
      console.log('Patient saved with ID:', docRef.id);

      Alert.alert('Success', `Patient ${formData.name} added!\nAccess Code: ${formData.accessCode}\nPatient ID: ${patientId}`);

      // Reset form
      setFormData({
        patientId: '',
        name: '',
        age: 0,
        gender: 'male',
        phone: '',
        email: '',
        address: '',
        emergencyContact: '',
        guardianName: '',
        bloodType: null,
        allergies: [],
        medicalConditions: [],
        currentMedications: [],
        insuranceProvider: '',
        insuranceId: '',
        labTests: [],
        resultUrl: '',
        accessCode: '',
      });
      setSelectedTests([]);

      onPatientAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding patient:', error);
      Alert.alert('Error', `Failed to add patient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Patient</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={formData.name}
                onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
              />
            </View>

            {/* Age & Gender */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  keyboardType="numeric"
                  value={formData.age.toString()}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, age: parseInt(value) || 0 }))}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.radioGroup}>
                  {(['male', 'female', 'other'] as const).map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={styles.radioButton}
                      onPress={() => setFormData(prev => ({ ...prev, gender }))}
                    >
                      <View style={styles.radioCircle}>
                        {formData.gender === gender && <View style={styles.radioSelected} />}
                      </View>
                      <Text style={styles.radioLabel}>{gender}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(value) => setFormData(prev => ({ ...prev, phone: value }))}
              />
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Full address"
                multiline
                value={formData.address}
                onChangeText={(value) => setFormData(prev => ({ ...prev, address: value }))}
              />
            </View>

            {/* Access Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Access Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter access code"
                value={formData.accessCode}
                onChangeText={(value) => setFormData(prev => ({ ...prev, accessCode: value }))}
              />
            </View>

            {/* Lab Test Selection */}
            <Text style={styles.sectionTitle}>Lab Test Selection</Text>
            <View style={styles.testSelectionContainer}>
              {MOCK_LAB_TESTS.map((test, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.testCard,
                    selectedTests.some(selected => selected.name === test.name) && styles.selectedTestCard,
                  ]}
                  onPress={() => handleTestSelection(test)}
                >
                  <Text style={styles.testName}>{test.name}</Text>
                  <Text style={styles.testPrice}>{test.price} FCFA</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Add Patient</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, width: '90%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
  formContainer: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2C3E50', marginVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ECF0F1', paddingBottom: 5 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: '#2C3E50', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#D5D8DC', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  radioGroup: { flexDirection: 'row', marginTop: 5 },
  radioButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#2E86C1', alignItems: 'center', justifyContent: 'center', marginRight: 5 },
  radioSelected: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E86C1' },
  radioLabel: { fontSize: 14, color: '#2C3E50' },
  saveButton: { backgroundColor: '#27AE60', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 20, marginBottom: 10 },
  saveButtonDisabled: { backgroundColor: '#7F8C8D' },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  testSelectionContainer: { marginBottom: 20 },
  testCard: { backgroundColor: '#ECF0F1', borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedTestCard: { borderColor: '#2E86C1', borderWidth: 2, backgroundColor: '#D6EAF8' },
  testName: { color: '#2C3E50', fontSize: 16 },
  testPrice: { color: '#27AE60', fontWeight: 'bold' },
});

export default AddPatientModal;
