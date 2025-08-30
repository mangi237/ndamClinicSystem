// components/nurse/VitalsMonitoring.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const VitalsMonitoring = ({ patientId }: { patientId: string }) => {
  const [vitalsList, setVitalsList] = useState<any[]>([]);
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
    // Listen for vitals for this patient only
    const q = query(
      collection(db, 'vitals'),
      where('patientId', '==', patientId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVitalsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [patientId]);

  const calculateBMI = (height, weight) => {
    if (height && weight) {
      const heightInMeters = Number(height) / 100;
      return (Number(weight) / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return '';
  };

  const handleVitalChange = (field, value) => {
    const newVitals = { ...vitals, [field]: value };
    if (field === 'height' || field === 'weight') {
      const height = field === 'height' ? value : vitals.height;
      const weight = field === 'weight' ? value : vitals.weight;
      newVitals.bmi = calculateBMI(height, weight);
    }
    setVitals(newVitals);
  };

  const handleAddVitals = async () => {
    try {
      await addDoc(collection(db, 'vitals'), {
        patientId,
        ...vitals,
        date: date.toISOString(),
        recordedBy: 'Nurse', // Replace with actual nurse name if available
        timestamp: new Date()
      });
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

  const renderVitalItem = ({ item }) => (
    <View style={styles.vitalItem}>
      <Text style={styles.vitalDate}>{new Date(item.date).toLocaleDateString()}</Text>
      <Text>Temp: {item.temperature}°C | BP: {item.bloodPressure} | HR: {item.heartRate} | RR: {item.respiratoryRate}</Text>
      <Text>O2: {item.oxygenSaturation}% | Height: {item.height}cm | Weight: {item.weight}kg | BMI: {item.bmi}</Text>
      <Text>Notes: {item.notes}</Text>
      <Text style={styles.vitalRecorded}>Recorded by: {item.recordedBy}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add-circle" size={24} color="#27AE60" />
        <Text style={styles.addButtonText}>Add Vitals</Text>
      </TouchableOpacity>

      <FlatList
        data={vitalsList}
        renderItem={renderVitalItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No vitals recorded yet.</Text>}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.modalTitle}>Add Vitals</Text>
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
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 15 },
  addButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  addButtonText: { marginLeft: 8, color: '#27AE60', fontSize: 16, fontWeight: 'bold' },
  listContainer: { paddingBottom: 20 },
  vitalItem: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 10, elevation: 2 },
  vitalDate: { fontWeight: 'bold', marginBottom: 5 },
  vitalRecorded: { fontSize: 12, color: '#7F8C8D', marginTop: 5 },
  emptyText: { textAlign: 'center', color: '#7F8C8D', marginTop: 30 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, width: '90%', maxHeight: '80%' },
  formContainer: { flex: 1 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: '#2C3E50', marginBottom: 5 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#D5D8DC', borderRadius: 8, padding: 12, fontSize: 16 },
  saveButton: { backgroundColor: '#27AE60', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelButton: { backgroundColor: '#ECF0F1', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 10 },
  cancelButtonText: { color: '#2C3E50', fontSize: 16, fontWeight: '600' },
});

export default VitalsMonitoring;