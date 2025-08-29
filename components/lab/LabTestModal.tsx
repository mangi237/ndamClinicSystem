// components/lab/LabTestModal.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LabTestCreateData, LabTestType, LabTestConfig } from '../../types/LabTest';
import { useAuth } from '../../context/authContext';

interface LabTestModalProps {
  visible: boolean;
  onClose: () => void;
  onTestAdded: () => void;
  patientId: string;
  patientName: string;
}

const LabTestModal: React.FC<LabTestModalProps> = ({
  visible,
  onClose,
  onTestAdded,
  patientId,
  patientName,
}) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [selectedTest, setSelectedTest] = useState<LabTestType | null>(null);
  const [formData, setFormData] = useState<Partial<LabTestCreateData>>({
    result: 'pending',
    values: {},
    notes: '',
  });

const handleSubmit = async () => {
  if (!selectedTest) {
    Alert.alert('Error', 'Please select a test type');
    return;
  }

  setLoading(true);
  try {
    const testData = {
      patientId,
      patientName,
      testType: selectedTest,
      result: formData.result || 'pending',
      values: formData.values || {},
      notes: formData.notes || '',
      testImage: formData.testImage || '',
      technicianId: user?.id || 'N/A',
      technicianName: user?.name || 'N/A',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await addDoc(collection(db, 'labTests'), testData);
    onTestAdded();
    onClose();
  } catch (error: any) {
    Alert.alert('Error adding lab test', error.message);
  } finally {
    setLoading(false);
  }
};

  const handleValueChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [fieldName]: value
      }
    }));
  };

  const renderTestFields = () => {
    if (!selectedTest) return null;
    
    const testConfig = LabTestConfig[selectedTest];
    
    return (
      <View style={styles.testFields}>
        <Text style={styles.sectionTitle}>Test Parameters</Text>
        {testConfig.fields.map((field) => (
          <View key={field.name} style={styles.inputGroup}>
            <Text style={styles.label}>
              {field.label} {field.unit && `(${field.unit})`}
              {field.normalRange && ` - Normal: ${field.normalRange}`}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={`Enter ${field.label}`}
              value={formData.values?.[field.name]?.toString() || ''}
              onChangeText={(value) => handleValueChange(field.name, value)}
              keyboardType={field.unit ? 'numeric' : 'default'}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Lab Test for {patientName}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Test Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Test Type *</Text>
              <View style={styles.testTypeGrid}>
                {Object.entries(LabTestConfig).map(([key, config]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.testTypeButton,
                      selectedTest === key && styles.testTypeButtonSelected
                    ]}
                    onPress={() => setSelectedTest(key as LabTestType)}
                  >
                    <Text style={selectedTest === key ? styles.testTypeTextSelected : styles.testTypeText}>
                      {config.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Result Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Result *</Text>
              <View style={styles.resultGroup}>
                {(['positive', 'negative', 'inconclusive', 'pending'] as const).map((result) => (
                  <TouchableOpacity
                    key={result}
                    style={[
                      styles.resultButton,
                      formData.result === result && styles.resultButtonSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, result }))}
                  >
                    <Text style={formData.result === result ? styles.resultTextSelected : styles.resultText}>
                      {result.charAt(0).toUpperCase() + result.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Test-specific fields */}
            {renderTestFields()}

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional notes about the test..."
                value={formData.notes}
                onChangeText={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.saveButtonText}>Adding Test...</Text>
              ) : (
                <Text style={styles.saveButtonText}>Add Lab Test</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '90%',
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 10,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  testTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  testTypeButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ECF0F1',
    minWidth: 120,
    alignItems: 'center',
  },
  testTypeButtonSelected: {
    backgroundColor: '#8E44AD',
  },
  testTypeText: {
    color: '#2C3E50',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  testTypeTextSelected: {
    color: 'white',
  },
  resultGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  resultButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ECF0F1',
    minWidth: 100,
    alignItems: 'center',
  },
  resultButtonSelected: {
    backgroundColor: '#8E44AD',
  },
  resultText: {
    color: '#2C3E50',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  resultTextSelected: {
    color: 'white',
  },
  testFields: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  saveButton: {
    backgroundColor: '#8E44AD',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#7F8C8D',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default LabTestModal;