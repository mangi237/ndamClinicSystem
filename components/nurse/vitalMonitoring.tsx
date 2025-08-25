// components/nurse/VitalsMonitoring.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import DateTimePicker from '@react-native-community/datetimepicker';

const VitalsMonitoring = () => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [vitals, setVitals] = useState({
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    height: '',
    weight: '',
    bmi: '',
    notes: ''
  });
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.includes(searchQuery)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'patients'));
      const patientsData = [];
      querySnapshot.forEach((doc) => {
        patientsData.push({ id: doc.id, ...doc.data() });
      });
      setPatients(patientsData);
    } catch (error) {
      console.error('Error fetching patients: ', error);
    }
  };

  const calculateBMI = (height, weight) => {
    if (height && weight) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return '';
  };

  const handleVitalChange = (field, value) => {
    const newVitals = { ...vitals, [field]: value };
    
    // Auto-calculate BMI if height or weight changes
    if (field === 'height' || field === 'weight') {
      const height = field === 'height' ? value : vitals.height;
      const weight = field === 'weight' ? value : vitals.weight;
      newVitals.bmi = calculateBMI(height, weight);
    }
    
    setVitals(newVitals);
  };

  const handleAddVitals = async () => {
    if (!selectedPatient) return;

    try {
      await addDoc(collection(db, 'vitals'), {
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        ...vitals,
        date: date.toISOString(),
        recordedBy: 'Nurse', // This would be the actual nurse's name from auth
        timestamp: new Date()
      });

      // Update patient record with latest vitals
      const patientRef = doc(db, 'patients', selectedPatient.id);
      await updateDoc(patientRef, {
        lastVitals: {
          ...vitals,
          date: date.toISOString()
        },
        lastUpdated: new Date()
      });

      // Reset form
      setVitals({
        temperature: '',
        bloodPressure: '',
        heartRate: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        height: '',
        weight: '',
        bmi: '',
        notes: ''
      });
      setModalVisible(false);
      alert('Vitals recorded successfully!');
    } catch (error) {
      console.error('Error adding vitals: ', error);
      alert('Failed to record vitals. Please try again.');
    }
  };

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.patientItem}
      onPress={() => {
        setSelectedPatient(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientDetails}>ID: {item.id} | Age: {item.age} | Gender: {item.gender}</Text>
        <Text style={styles.patientStatus}>Status: {item.status}</Text>
        {item.lastVitals && (
          <View style={styles.vitalsSummary}>
            <Text style={styles.vitalsText}>
              Last Vitals: BP: {item.lastVitals.bloodPressure || 'N/A'} | 
              Temp: {item.lastVitals.temperature || 'N/A'}°C | 
              HR: {item.lastVitals.heartRate || 'N/A'}
            </Text>
          </View>
        )}
      </View>
      <Ionicons name="add-circle" size={24} color="#2E86C1" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients by name or ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <FlatList
        data={filteredPatients}
        renderItem={renderPatientItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Vitals for {selectedPatient?.name}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#2E86C1" />
                <Text style={styles.dateText}>
                  {date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                />
              )}

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Temperature (°C)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="36.5"
                    value={vitals.temperature}
                    onChangeText={(value) => handleVitalChange('temperature', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Blood Pressure</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="120/80"
                    value={vitals.bloodPressure}
                    onChangeText={(value) => handleVitalChange('bloodPressure', value)}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Heart Rate (bpm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="72"
                    value={vitals.heartRate}
                    onChangeText={(value) => handleVitalChange('heartRate', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Respiratory Rate</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="16"
                    value={vitals.respiratoryRate}
                    onChangeText={(value) => handleVitalChange('respiratoryRate', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>O2 Saturation (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="98"
                    value={vitals.oxygenSaturation}
                    onChangeText={(value) => handleVitalChange('oxygenSaturation', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Height (cm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="170"
                    value={vitals.height}
                    onChangeText={(value) => handleVitalChange('height', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="68"
                    value={vitals.weight}
                    onChangeText={(value) => handleVitalChange('weight', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>BMI</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: '#f0f0f0' }]}
                    value={vitals.bmi}
                    editable={false}
                    placeholder="Auto-calculated"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Additional notes..."
                  value={vitals.notes}
                  onChangeText={(value) => handleVitalChange('notes', value)}
                  multiline
                />
              </View>

              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddVitals}
              >
                <Text style={styles.saveButtonText}>Save Vitals</Text>
              </TouchableOpacity>
            </ScrollView>
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
    padding: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  listContainer: {
    paddingBottom: 20,
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
  },
  patientDetails: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
    fontFamily: 'Poppins-Regular',
  },
  patientStatus: {
    fontSize: 14,
    color: '#27AE60',
    fontFamily: 'Poppins-Regular',
    marginBottom: 5,
  },
  vitalsSummary: {
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  vitalsText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
  },
  formContainer: {
    flex: 1,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECF0F1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2C3E50',
    fontFamily: 'Poppins-Regular',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 5,
    fontFamily: 'Poppins-Medium',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  saveButton: {
    backgroundColor: '#27AE60',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default VitalsMonitoring;