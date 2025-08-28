// screens/PatientDetailsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Patient } from '../types/Patient';
import NotesList from '../components/medical/NotesList';
import AddNoteModal from '../components/medical/AddNoteModal';
import LabTestsList from '../components/medical/LabTestList';
import LabTestModal from '../components/lab/LabTestModal';
import { useAuth } from '../context/authContext';

const PatientDetailsScreen = ({ route, navigation }) => {
  const { patient } = route.params as { patient: Patient };
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [labTestModalVisible, setLabTestModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'lab'>('details');
  const { user } = useAuth();

  const handleNoteAdded = () => {
    setNotesModalVisible(false);
  };

  const handleLabTestAdded = () => {
    setLabTestModalVisible(false);
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

  const canAddLabTests = user?.role === 'lab';

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
      {activeTab === 'details' ? (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{patient.age} years</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{patient.gender}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{patient.phone}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{patient.email || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{patient.address}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Emergency Contact</Text>
              <Text style={styles.infoValue}>{patient.emergencyContact}</Text>
            </View>
            {patient.guardianName && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Guardian</Text>
                <Text style={styles.infoValue}>{patient.guardianName}</Text>
              </View>
            )}
          </View>

          {/* Medical Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            {patient.bloodType && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Blood Type</Text>
                <Text style={styles.infoValue}>{patient.bloodType}</Text>
              </View>
            )}
            
            {patient.allergies && patient.allergies.length > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Allergies</Text>
                <Text style={styles.infoValue}>{patient.allergies.join(', ')}</Text>
              </View>
            )}
            
            {patient.medicalConditions && patient.medicalConditions.length > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Medical Conditions</Text>
                <Text style={styles.infoValue}>{patient.medicalConditions.join(', ')}</Text>
              </View>
            )}
            
            {patient.currentMedications && patient.currentMedications.length > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Current Medications</Text>
                <Text style={styles.infoValue}>{patient.currentMedications.join(', ')}</Text>
              </View>
            )}
          </View>

          {/* Insurance Information */}
          {(patient.insuranceProvider || patient.insuranceId) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Insurance Information</Text>
              {patient.insuranceProvider && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Provider</Text>
                  <Text style={styles.infoValue}>{patient.insuranceProvider}</Text>
                </View>
              )}
              {patient.insuranceId && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Policy Number</Text>
                  <Text style={styles.infoValue}>{patient.insuranceId}</Text>
                </View>
              )}
            </View>
          )}

          {/* Timestamps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Record Information</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{formatDate(patient.createdAt)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>{formatDate(patient.updatedAt)}</Text>
            </View>
          </View>
        </ScrollView>
      ) : activeTab === 'notes' ? (
        <NotesList 
          patientId={patient.id!} 
          onAddNote={() => setNotesModalVisible(true)} 
        />
      ) : (
        <LabTestsList 
          patientId={patient.id!} 
          onAddTest={canAddLabTests ? () => setLabTestModalVisible(true) : undefined}
        />
      )}

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
};

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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40, // Extra padding for better scrolling
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 10,
    padding: 20,
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
    width: '100%',
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