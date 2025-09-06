// components/lab/LabDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/authContext";
import AnimatedHeader from "../../components/common/AnimateHeader";
import { Patient } from "../../types/Patient";

// Always use Vercel URL - no local server needed
const getApiUrl = () => {
  // Always use your Vercel deployment for all environments
  return 'https://ndamclinic-hcahg05zx-mangi-lerine-laslie-jrs-projects.vercel.app/api/upload';
};

// Improved upload function with better error handling
async function uploadFileToBackend(file: File | Blob): Promise<string | null> {
  try {
    const API_URL = getApiUrl();
    console.log('Uploading to:', API_URL);
    console.log('File type:', file.type);
    console.log('File size:', file.size);
    console.log('Environment:', __DEV__ ? 'development' : 'production');

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch("https://ndamclinic.vercel.app/api/upload", {
      method: "POST",
      body: formData,
    });

    console.log('Response status:', res.status);
    console.log('Response OK:', res.ok);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Upload failed:', res.status, res.statusText);
      console.error('Error response:', errorText.substring(0, 500));
      
      // Handle specific errors
      if (res.status === 413) {
        throw new Error('File too large for upload');
      } else if (res.status === 404) {
        throw new Error('API endpoint not found. Check your Vercel deployment.');
      } else if (res.status === 500) {
        throw new Error('Server error during upload');
      }
      
      throw new Error(`Upload failed: ${res.status} - ${errorText}`);
    }

    // Verify response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const responseText = await res.text();
      console.error('Expected JSON but got:', contentType);
      console.error('Response body:', responseText.substring(0, 200));
      throw new Error(`Server returned ${contentType} instead of JSON`);
    }

    const data = await res.json();
    console.log('Upload successful:', data);
    return data.fileUrl;
  } catch (error) {
    console.error('Backend upload error:', error);
    return null;
  }
}

// ---------------- LabDashboard Component ----------------
const LabDashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { user } = useAuth();
  const scrollY = new Animated.Value(0);

  const [stats, setStats] = useState({
    totalPatients: 0,
    waitingPatients: 0,
    completedPatients: 0,
    collectedSamples: 0,
    totalSamples: 0,
  });

  useEffect(() => {
    if (!user) return;

    const patientsQuery = query(
      collection(db, "patients"),
      where("status", "in", ["waiting", "completed"])
    );

    const unsubscribe = onSnapshot(patientsQuery, (snapshot) => {
      const patientData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Patient[];

      setPatients(patientData);

      // calculate stats
      const waitingPatients = patientData.filter((p) => p.status === "waiting").length;
      const completedPatients = patientData.filter((p) => p.status === "completed").length;

      let collectedSamples = 0;
      let totalSamples = 0;

      patientData.forEach((patient) => {
        if (patient.labTests) {
          patient.labTests.forEach((test) => {
            totalSamples += test.samples?.length || 0;
            collectedSamples += test.samples?.length || 0; // assuming all samples collected
          });
        }
      });

      setStats({
        totalPatients: patientData.length,
        waitingPatients,
        completedPatients,
        collectedSamples,
        totalSamples,
      });
    });

    return () => unsubscribe();
  }, [user]);

  const pickDocument = async () => {
    if (!selectedPatient || !user) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || (result as any).type === 'cancel') {
        console.log('Document picking cancelled');
        return;
      }

      let fileUri: string;
      let fileName: string;

      if ('assets' in result && result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];
        fileUri = pickedFile.uri;
        fileName = pickedFile.name;
      } else if ('uri' in result && 'name' in result) {
        fileUri = (result as any).uri;
        fileName = (result as any).name;
      } else {
        console.log('Document picking cancelled or invalid result');
        return;
      }

      console.log('Picked file:', fileName, fileUri);

      let file: File | Blob;

      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        file = new File([blob], fileName, { type: 'application/pdf' });
      } else {
        const response = await fetch(fileUri);
        file = await response.blob();
      }

      setUploading(true);
      const fileUrl = await uploadFileToBackend(file);

      if (fileUrl) {
        await addDoc(collection(db, 'labResults'), {
          patientId: selectedPatient.id,
          patientName: selectedPatient.name,
          fileName,
          fileUrl,
          uploadedBy: user.name,
          uploadedAt: new Date(),
        });

        // ✅ Update patient status + resultFile
        await updateDoc(doc(db, "patients", selectedPatient.id), {
          status: "completed",
          resultFile: {
            fileName,
            fileUrl,
            uploadedAt: new Date(),
          },
        });

        setShowUploadModal(false);
        setShowSuccessModal(true);
        setSelectedPatient(null);
      } else {
        Alert.alert('Error', 'Failed to upload file to server.');
      }
    } catch (error) {
      console.error('Error picking/uploading document:', error);
      Alert.alert('Error', 'Failed to pick or upload document.');
    } finally {
      setUploading(false);
    }
  };

  const getRequiredSamples = (patient: Patient): string[] => {
    if (!patient.labTests) return [];
    return patient.labTests.flatMap((test) => test.samples || []);
  };

  const getCollectedSamples = (patient: Patient): string[] => {
    return patient.labTests?.flatMap((test) => test.samples) || [];
  };

  const renderStatsCard = (
    title: string,
    value: number,
    subtitle: string,
    icon: string,
    color: string
  ) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
    </View>
  );

  const renderPatientItem = ({ item }: { item: Patient }) => {
    const requiredSamples = getRequiredSamples(item);
    const collectedSamples = getCollectedSamples(item);
    const allSamplesCollected = requiredSamples.every((s) => collectedSamples.includes(s));

    return (
      <View style={styles.patientCard}>
        <View style={styles.patientHeader}>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{item.name}</Text>
            <Text style={styles.patientId}>ID: {item.patientId}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: item.status === "completed" ? "#4CAF50" : "#FF9800" },
              ]}
            >
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>

          {item.status === "waiting" && allSamplesCollected && (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => {
                setSelectedPatient(item);
                setShowUploadModal(true);
              }}
            >
              <Ionicons name="cloud-upload" size={20} color="white" />
              <Text style={styles.uploadButtonText}>Upload Results</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.testsSection}>
          <Text style={styles.sectionTitle}>Tests Requested:</Text>
          {item.labTests?.map((test, index) => (
            <View key={index} style={styles.testItem}>
              <Ionicons name="flask" size={16} color="#666" />
              <Text style={styles.testName}>{test.name}</Text>
              <Text style={styles.testPrice}>${test.price}</Text>
            </View>
          ))}
        </View>

        <View style={styles.samplesSection}>
          <Text style={styles.sectionTitle}>Samples:</Text>
          <View style={styles.samplesContainer}>
            {requiredSamples.map((sample, index) => (
              <View
                key={index}
                style={[
                  styles.sampleChip,
                  collectedSamples.includes(sample) && styles.sampleCollected,
                ]}
              >
                <Text style={styles.sampleText}>{sample}</Text>
                {collectedSamples.includes(sample) && (
                  <Ionicons name="checkmark" size={16} color="#27AE60" />
                )}
              </View>
            ))}
          </View>
        </View>

       {item.resultUrls && item.resultUrls.length > 0 && (
  <View style={{ marginTop: 10 }}>
    {item.resultUrls.map((result, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => {
          Alert.alert("View PDF", "Open lab result in browser?", [
            { text: "Cancel", style: "cancel" },
            { text: "Open", onPress: () => window.open(result.url, "_blank") },
          ]);
        }}
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}
      >
        <Ionicons name="document-text" size={18} color="#2196F3" />
        <Text style={{ marginLeft: 5, color: "#2196F3", fontWeight: "600" }}>
          {result.fileName || "View Lab Result"}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
)}

      </View>
    );
  };

  return (
    <ScrollView scrollEnabled={true} {...scrollY}> 
      <View style={styles.container}>
        <AnimatedHeader scrollY={scrollY} />

        <ScrollView
          style={styles.content}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={16}
        >
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              {renderStatsCard("Total Patients", stats.totalPatients, "In lab", "people", "#2196F3")}
              {renderStatsCard("Waiting", stats.waitingPatients, "For results", "time", "#FF9800")}
            </View>
            <View style={styles.statsRow}>
              {renderStatsCard(
                "Completed",
                stats.completedPatients,
                "Tests done",
                "checkmark-circle",
                "#4CAF50"
              )}
              {renderStatsCard(
                "Samples",
                stats.collectedSamples,
                `of ${stats.totalSamples} collected`,
                "water",
                "#9C27B0"
              )}
            </View>
          </View>

          <Text style={styles.sectionHeader}>Patients</Text>

          <FlatList
            data={patients}
            renderItem={renderPatientItem}
            keyExtractor={(item) => item.id!}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="flask-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No patients requiring lab work</Text>
              </View>
            }
          />
        </ScrollView>

        <Modal visible={showUploadModal} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Upload Results for {selectedPatient?.name}</Text>
              <Text style={styles.modalSubtitle}>Patient ID: {selectedPatient?.patientId}</Text>

              <TouchableOpacity
                style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
                onPress={pickDocument}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="document" size={20} color="white" />
                    <Text style={styles.uploadBtnText}>Select PDF File</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowUploadModal(false);
                    setSelectedPatient(null);
                  }}
                  disabled={uploading}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showSuccessModal} animationType="fade" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Ionicons
                name="checkmark-circle"
                size={50}
                color="#4CAF50"
                style={{ alignSelf: "center" }}
              />
              <Text style={styles.modalTitle}>Upload Successful!</Text>
              <Text style={styles.modalSubtitle}>
                Lab results have been saved and patient status updated.
              </Text>
              <TouchableOpacity
                style={[styles.uploadBtn, { marginTop: 15 }]}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={styles.uploadBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { flex: 1 },
  statsContainer: { padding: 15 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statContent: { flex: 1 },
  statValue: { fontSize: 24, fontWeight: "bold", color: "#333" },
  statTitle: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 2 },
  statSubtitle: { fontSize: 12, color: "#666", marginTop: 2 },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  sectionHeader: { fontSize: 18, fontWeight: "bold", marginHorizontal: 15, marginBottom: 10, color: "#333" },
  patientCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  patientId: { fontSize: 14, color: "#666", marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start", marginTop: 5 },
  statusText: { color: "white", fontSize: 12, fontWeight: "600" },
  uploadButton: { backgroundColor: "#2196F3", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  uploadButtonText: { color: "white", marginLeft: 5, fontWeight: "600" },
  testsSection: { marginBottom: 10 },
  samplesSection: { marginBottom: 5 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#333" },
  testItem: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  testName: { marginLeft: 5, fontSize: 14, color: "#333" },
  testPrice: { marginLeft: "auto", fontSize: 14, fontWeight: "600", color: "#666" },
  samplesContainer: { flexDirection: "row", flexWrap: "wrap" },
  sampleChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#eee", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 5, marginBottom: 5 },
  sampleCollected: { backgroundColor: "#C8E6C9" },
  sampleText: { fontSize: 12, color: "#333", marginRight: 4 },
  modalContainer: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "white", margin: 20, borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center", color: "#333" },
  modalSubtitle: { fontSize: 14, color: "#666", marginBottom: 20, textAlign: "center" },
  uploadBtn: { backgroundColor: "#2196F3", paddingVertical: 12, borderRadius: 8, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  uploadBtnText: { color: "white", fontWeight: "600", marginLeft: 5 },
  uploadBtnDisabled: { opacity: 0.6 },
  cancelBtn: { marginTop: 10, backgroundColor: "#ccc", paddingVertical: 12, borderRadius: 8 },
  cancelBtnText: { color: "#333", textAlign: "center", fontWeight: "600" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  emptyState: { justifyContent: "center", alignItems: "center", padding: 20 },
  emptyText: { color: "#ccc", fontSize: 16, marginTop: 10 },
});

export default LabDashboard;
