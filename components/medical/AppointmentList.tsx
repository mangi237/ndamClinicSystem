import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const AppointmentList = ({ patientId }: { patientId: string }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [tab, setTab] = useState<'pending' | 'ongoing' | 'completed'>('pending');
  const [form, setForm] = useState({
    title: '',
    doctorId: '',
    doctorName: '',
    date: '',
    explanation: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'appointments'), where('patientId', '==', patientId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [patientId]);

  const handleAddAppointment = async () => {
    await addDoc(collection(db, 'appointments'), {
      patientId,
      ...form,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setForm({ title: '', doctorId: '', doctorName: '', date: '', explanation: '' });
    setModalVisible(false);
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'ongoing' | 'completed') => {
    await updateDoc(doc(db, 'appointments', id), { status, updatedAt: new Date() });
  };

  const filtered = appointments.filter(a => a.status === tab);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabRow}>
        {['pending', 'ongoing', 'completed'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t as any)}>
            <Text style={tab === t ? styles.tabTextActive : styles.tabText}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>Add Appointment</Text>
      </TouchableOpacity>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handleStatusChange(item.id, item.status === 'pending' ? 'ongoing' : item.status === 'ongoing' ? 'completed' : 'completed')}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>{item.date} with Dr. {item.doctorName}</Text>
            <Text>{item.explanation}</Text>
            <Text>Status: {item.status}</Text>
            <Text style={styles.statusBtn}>Change Status</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>No appointments</Text>}
      />
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Appointment</Text>
            <TextInput style={styles.input} placeholder="Title" value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} />
            <TextInput style={styles.input} placeholder="Doctor Name" value={form.doctorName} onChangeText={v => setForm(f => ({ ...f, doctorName: v }))} />
            <TextInput style={styles.input} placeholder="Doctor ID" value={form.doctorId} onChangeText={v => setForm(f => ({ ...f, doctorId: v }))} />
            <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={form.date} onChangeText={v => setForm(f => ({ ...f, date: v }))} />
            <TextInput style={styles.input} placeholder="Explanation" value={form.explanation} onChangeText={v => setForm(f => ({ ...f, explanation: v }))} multiline />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddAppointment}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  tab: { padding: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#27AE60' },
  tabText: { color: '#7F8C8D' },
  tabTextActive: { color: '#27AE60', fontWeight: 'bold' },
  addButton: { backgroundColor: '#27AE60', padding: 12, borderRadius: 8, margin: 10, alignItems: 'center' },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  item: { backgroundColor: 'white', padding: 15, margin: 10, borderRadius: 10, elevation: 2 },
  title: { fontWeight: 'bold', fontSize: 16 },
  statusBtn: { color: '#2980B9', marginTop: 8 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#D5D8DC', borderRadius: 8, padding: 12, marginBottom: 10 },
  saveButton: { backgroundColor: '#27AE60', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: 'white', fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#ECF0F1', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 10 },
  cancelButtonText: { color: '#2C3E50', fontWeight: 'bold' },
});

export default AppointmentList;