// screens/PatientDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Patient } from '../types/Patient';
import NotesList from '../components/medical/NotesList';
import AddNoteModal from '../components/medical/AddNoteModal';
import LabTestsList from '../components/medical/LabTestList';
import LabTestModal from '../components/lab/LabTestModal';
import { useAuth } from '../context/authContext';
import { PatientDetailsScreenProps } from '../types/Navigation';

const PatientDetailsScreen = ({ route, navigation }: PatientDetailsScreenProps) => {
  const { patient } = route.params;
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [labTestModalVisible, setLabTestModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'lab'>('details');
  const { user } = useAuth();
  
  // Use the context user role instead of relying on route params
  const currentUserRole = user?.role;
  const canAddLabTests = currentUserRole === 'lab';
  
  // Debug logging
  useEffect(() => {
    console.log('PatientDetailsScreen - Patient:', patient);
    console.log('PatientDetailsScreen - Current user role:', currentUserRole);
    console.log('PatientDetailsScreen - Can add lab tests:', canAddLabTests);
  }, [currentUserRole]);

  const handleNoteAdded = () => {
    setNotesModalVisible(false);
  };

  const handleLabTestAdded = () => {
    setLabTestModalVisible(false);
    // Refresh lab tests list if needed
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <View style={styles.container}>
      {/* Patient Header */}
      <View style={styles.header}>
        {patient.profileImage ? (
          <Image source={{ uri: patient.profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Ionicons name="person" size={40} color="#7F8C8D" />
          </View>
        )}
        
        <View style={styles.headerInfo}>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientId}>ID: {patient.patientId}</Text>
          <Text style={styles.patientStatus}>Status: {patient.status}</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'details' && styles.tabActive]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
            Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>
            Notes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'lab' && styles.tabActive]}
          onPress={() => setActiveTab('lab')}
        >
          <Text style={[styles.tabText, activeTab === 'lab' && styles.tabTextActive]}>
            Lab Tests
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'details' ? (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{patient.phone || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Emergency Contact</Text>
                  <Text style={styles.infoValue}>{patient.emergencyContact || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>{patient.gender || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Date of Birth</Text>
                  <Text style={styles.infoValue}>{formatDate(patient.dateOfBirth)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{patient.address || 'N/A'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medical Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Blood Type</Text>
                  <Text style={styles.infoValue}>{patient.bloodType || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Allergies</Text>
                  <Text style={styles.infoValue}>{patient.allergies || 'None reported'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Medical Conditions</Text>
                  <Text style={styles.infoValue}>{patient.conditions || 'None reported'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Medications</Text>
                  <Text style={styles.infoValue}>{patient.medications || 'None reported'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Date Added</Text>
                  <Text style={styles.infoValue}>{formatDate(patient.createdAt)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Last Updated</Text>
                  <Text style={styles.infoValue}>{formatDate(patient.updatedAt)}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : activeTab === 'notes' ? (
          <NotesList 
            patientId={patient.id!} 
            onAddNote={() => setNotesModalVisible(true)} 
          />
        ) : (
          <View style={styles.tabContent}>
            <LabTestsList 
              patientId={patient.id!} 
              onAddTest={() => setLabTestModalVisible(true)} // Always pass this
              userRole={user?.role}
            />
          </View>
        )}
      </View>

      <AddNoteModal
        visible={notesModalVisible}
        onClose={() => setNotesModalVisible(false)}
        onNoteAdded={handleNoteAdded}
        patientId={patient.id!}
      />

      <LabTestModal
        visible={labTestModalVisible}
        onClose={() => setLabTestModalVisible(false)}
        onTestAdded={handleLabTestAdded}
        patientId={patient.id!}
        patientName={patient.name}
      />


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
    fontFamily: 'Poppins-Bold',
  },
  patientId: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 3,
    fontFamily: 'Poppins-Regular',
  },
  patientStatus: {
    fontSize: 16,
    color: '#27AE60',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2E86C1',
  },
  tabText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Medium',
  },
  tabTextActive: {
    color: '#2E86C1',
    fontFamily: 'Poppins-SemiBold',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  tabContent: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 10,
    padding: 20,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
    fontFamily: 'Poppins-Bold',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
    fontFamily: 'Poppins-Medium',
  },
  infoValue: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
  },
});

export default PatientDetailsScreen;