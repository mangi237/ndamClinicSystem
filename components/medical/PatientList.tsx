import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Patient } from '../../types/Patient';
import AddPatientModal from './addPatientModal';
import { useAuth } from '../../context/authContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/Navigation';

type PatientListNavigationProp = StackNavigationProp<RootStackParamList, 'PatientDetails'>;

const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation<PatientListNavigationProp>();

  useEffect(() => {
    const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.patientId.includes(searchQuery) ||
        patient.phone.includes(searchQuery)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  const handlePatientAdded = () => {
    console.log('Patient added successfully');
  };

  const handlePatientPress = (patient: Patient) => {
    navigation.navigate('PatientDetails', { 
      patient: patient,
      // userRole: user?.role 
    });
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity 
      style={styles.patientItem}
      onPress={() => handlePatientPress(item)}
    >
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.patientImage} />
      ) : (
        <View style={styles.patientImagePlaceholder}>
          <Ionicons name="person" size={24} color="#7F8C8D" />
        </View>
      )}
      
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientDetails}>ID: {item.patientId} | Age: {item.age}</Text>
        <Text style={styles.patientDetails}>Phone: {item.phone}</Text>
        <Text style={styles.patientStatus}>Status: {item.status}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#7F8C8D" />
    </TouchableOpacity>
  );

  const onAddPatient = () => {
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddPatient}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Patient</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <AddPatientModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onPatientAdded={handlePatientAdded}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
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
  patientImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  patientImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ECF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
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
    marginBottom: 3,
    fontFamily: 'Poppins-Regular',
  },
  patientStatus: {
    fontSize: 14,
    color: '#27AE60',
    fontFamily: 'Poppins-Regular',
  },
});

export default PatientList;