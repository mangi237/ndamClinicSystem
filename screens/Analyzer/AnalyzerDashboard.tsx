import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Patient } from '../../types/Patient';
import { useAuth } from '../../context/authContext';
import AnimatedHeader from '../../components/common/AnimateHeader';

const AnalyzerDashboard = ({ navigation }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const patientsQuery = query(
      collection(db, 'patients'),
      where('status', 'in', ['registered', 'waiting'])
    );

    const unsubscribe = onSnapshot(patientsQuery, (snapshot) => {
      const patientData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      setPatients(patientData);
    });

    return () => unsubscribe();
  }, [user]);

  const navigateToPatientDetails = (patient: Patient) => {
    navigation.navigate('PatientDetails', { patient });
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity 
      style={styles.patientItem}
      onPress={() => navigateToPatientDetails(item)}
    >
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientId}>ID: {item.patientId}</Text>
        <Text style={styles.testCount}>Tests: {item.labTests.length}</Text>
        <View style={styles.samplesList}>
          {item.labTests.flatMap(test => test.samples).map((sample, index) => (
            <Text key={index} style={styles.sampleTag}>{sample}</Text>
          ))}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#7F8C8D" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
        <AnimatedHeader />
      <Text style={styles.title}>Sample Collection</Text>
      
      <FlatList
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={item => item.id!}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No patients requiring sample collection</Text>
          </View>
        }
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2C3E50',
  },
  listContainer: {
    paddingBottom: 20,
  },
  patientItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  patientId: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 5,
  },
  testCount: {
    fontSize: 14,
    color: '#2C3E50',
    marginTop: 5,
  },
  samplesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  sampleTag: {
    backgroundColor: '#E8F5E8',
    color: '#27AE60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 5,
    marginTop: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
});

export default AnalyzerDashboard;