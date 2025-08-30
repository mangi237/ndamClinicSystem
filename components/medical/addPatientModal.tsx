// components/medical/AddPatientModal.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../services/firebase';
import { PatientCreateData } from '../../types/Patient';

interface AddPatientModalProps {
  visible: boolean;
  onClose: () => void;
  onPatientAdded: () => void;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({
  visible,
  onClose,
  onPatientAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
    bloodType: undefined,
    allergies: [],
    medicalConditions: [],
    currentMedications: [],
    insuranceProvider: '',
    insuranceId: '',
    profileImage: '',
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const filename = `patients/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      setUploading(false);
      return downloadURL;
    } catch (error) {
      setUploading(false);
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const generatePatientId = async (): Promise<string> => {
    try {
      const patientsRef = collection(db, 'patients');
      const q = query(patientsRef);
      const snapshot = await getDocs(q);
      const count = snapshot.size + 1;
      return `PAT-${count.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating patient ID:', error);
      return `PAT-${Math.floor(100 + Math.random() * 900)}`;
    }
  };

  const handleArrayInput = (field: 'allergies' | 'medicalConditions' | 'currentMedications', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [field]: items }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.address) {
        console.log('Please fill in required fields: Name, Phone, and Address');
      Alert.alert('Error', 'Please fill in required fields: Name, Phone, and Address');
      return;
    }

    setLoading(true);
    try {
      let profileImageUrl = '';
      
      // Upload image if selected
    //   if (image) {
    //     profileImageUrl = await uploadImage(image);
    //   }

      // Generate patient ID if not provided
      const patientId = formData.patientId || await generatePatientId();

      const patientData = {
        ...formData,
        patientId,
        profileImage: profileImageUrl,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'patients'), patientData);
      
      Alert.alert('Success', `Patient ${formData.name} added successfully!`);
      onPatientAdded();
      onClose();
      
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
        bloodType: undefined,
        allergies: [],
        medicalConditions: [],
        currentMedications: [],
        insuranceProvider: '',
        insuranceId: '',
        profileImage: '',
      });
      setImage(null);
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
            {/* Basic Information */}
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={formData.name}
                onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
              />
            </View>

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
                      <Text style={styles.radioLabel}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(value) => setFormData(prev => ({ ...prev, email: value }))}
              />
            </View>

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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Emergency Contact</Text>
              <TextInput
                style={styles.input}
                placeholder="Emergency contact number"
                value={formData.emergencyContact}
                onChangeText={(value) => setFormData(prev => ({ ...prev, emergencyContact: value }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Guardian Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Guardian's full name"
                value={formData.guardianName}
                onChangeText={(value) => setFormData(prev => ({ ...prev, guardianName: value }))}
              />
            </View>

            {/* Profile Image */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profile Image</Text>
              <TouchableOpacity style={styles.imageUploadButton} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={24} color="#7F8C8D" />
                    <Text style={styles.imagePlaceholderText}>Select Image</Text>
                  </View>
                )}
              </TouchableOpacity>
              {uploading && <Text style={styles.uploadingText}>Uploading image...</Text>}
            </View>

            {/* Medical Information */}
            <Text style={styles.sectionTitle}>Medical Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Type</Text>
              <View style={styles.bloodTypeGrid}>
                {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.bloodTypeButton, formData.bloodType === type && styles.bloodTypeSelected]}
                    onPress={() => setFormData(prev => ({ ...prev, bloodType: type }))}
                  >
                    <Text style={formData.bloodType === type ? styles.bloodTypeTextSelected : styles.bloodTypeText}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Allergies (comma-separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Penicillin, Peanuts, Shellfish"
                value={formData.allergies?.join(', ')}
                onChangeText={(value) => handleArrayInput('allergies', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medical Conditions</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Diabetes, Hypertension, Asthma"
                value={formData.medicalConditions?.join(', ')}
                onChangeText={(value) => handleArrayInput('medicalConditions', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Medications</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Metformin, Lisinopril, Ventolin"
                value={formData.currentMedications?.join(', ')}
                onChangeText={(value) => handleArrayInput('currentMedications', value)}
              />
            </View>

            {/* Insurance Information */}
            <Text style={styles.sectionTitle}>Insurance Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Insurance Provider</Text>
              <TextInput
                style={styles.input}
                placeholder="Insurance company name"
                value={formData.insuranceProvider}
                onChangeText={(value) => setFormData(prev => ({ ...prev, insuranceProvider: value }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Insurance ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Insurance policy number"
                value={formData.insuranceId}
                onChangeText={(value) => setFormData(prev => ({ ...prev, insuranceId: value }))}
              />
            </View>
            

            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.saveButtonText}>Adding Patient...</Text>
              ) : (
                <Text style={styles.saveButtonText}>Add Patient</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginVertical: 15,
    fontFamily: 'Poppins-SemiBold',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
    paddingBottom: 5,
  },
  inputGroup: {
    marginBottom: 15,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: 5,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2E86C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E86C1',
  },
  radioLabel: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'Poppins-Regular',
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  bloodTypeButton: {
    padding: 8,
    margin: 2,
    borderRadius: 5,
    backgroundColor: '#ECF0F1',
    minWidth: 40,
    alignItems: 'center',
  },
  bloodTypeSelected: {
    backgroundColor: '#2E86C1',
  },
  bloodTypeText: {
    color: '#2C3E50',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  bloodTypeTextSelected: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  imageUploadButton: {
    height: 100,
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 5,
    color: '#7F8C8D',
    fontSize: 14,
  },
  uploadingText: {
    marginTop: 5,
    color: '#2E86C1',
    fontSize: 12,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#27AE60',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
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

export default AddPatientModal;