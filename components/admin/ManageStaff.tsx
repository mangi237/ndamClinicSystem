// components/admin/ManageStaff.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { User } from '../../types/User';

const ManageStaff = () => {
  const [staff, setStaff] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStaff, setFilteredStaff] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'receptionist' as 'admin'| 'lab' | 'pharmacy' | 'cashier' | 'receptionist' | 'analyzer',
    department: '',
    code: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = staff.filter(staffMember => 
        staffMember.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staffMember.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staffMember.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStaff(filtered);
    } else {
      setFilteredStaff(staff);
    }
  }, [searchQuery, staff]);

  const fetchStaff = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const staffData: User[] = [];
      querySnapshot.forEach((doc) => {
        staffData.push({ id: doc.id, ...doc.data() } as User);
      });
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff: ', error);
      Alert.alert('Error', 'Failed to fetch staff data');
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.role) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const staffData = {
        ...formData,
        createdAt: new Date(),
        // In a real app, you'd also create auth credentials
      };

      if (editingStaff) {
        // Update existing staff
        await updateDoc(doc(db, 'users', editingStaff.id), staffData);
        Alert.alert('Success', 'Staff member updated successfully');
      } else {
        // Add new staff
        await addDoc(collection(db, 'users'), staffData);
        Alert.alert('Success', 'Staff member added successfully');
      }

      setModalVisible(false);
      setEditingStaff(null);
      setFormData({ name: '', email: '', role: 'receptionist', department: '', code: '' });
      fetchStaff();
    } catch (error) {
      console.error('Error saving staff: ', error);
      Alert.alert('Error', 'Failed to save staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember: User) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role,
      department: staffMember.department || '',
      code: staffMember.code || ''
    });
    setModalVisible(true);
  };

  const handleDelete = async (staffMember: User) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${staffMember.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', staffMember.id));
              Alert.alert('Success', 'Staff member deleted successfully');
              fetchStaff();
            } catch (error) {
              console.error('Error deleting staff: ', error);
              Alert.alert('Error', 'Failed to delete staff member');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', role: 'receptionist', department: '', code: '' });
    setEditingStaff(null);
  };

  const renderStaffItem = ({ item }: { item: User }) => (
    <View style={styles.staffItem}>
      <View style={styles.staffInfo}>
        <Text style={styles.staffName}>{item.name}</Text>
        <Text style={styles.staffDetails}>Email: {item.email}</Text>
        <Text style={styles.staffDetails}>Role: {item.role}</Text>
        {item.department && <Text style={styles.staffDetails}>Department: {item.department}</Text>}
        {item.code && <Text style={styles.staffDetails}>Access Code: {item.code}</Text>}
      </View>
      <View style={styles.staffActions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
          <Ionicons name="create-outline" size={20} color="#2E86C1" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={20} color="#E74C3C" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff by name, email, or role"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Staff</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredStaff}
        renderItem={renderStaffItem}
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
              <Text style={styles.modalTitle}>
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={formData.name}
                  onChangeText={(value) => setFormData({ ...formData, name: value })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  value={formData.email}
                  onChangeText={(value) => setFormData({ ...formData, email: value })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Role *</Text>
                <View style={styles.roleContainer}>
                  {(['admin', 'receptionist' ,'analyzer','cashier', 'lab', 'pharmacy'] as const).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        formData.role === role && styles.roleButtonSelected
                      ]}
                      onPress={() => setFormData({ ...formData, role })}
                    >
                      <Text style={[
                        styles.roleButtonText,
                        formData.role === role && styles.roleButtonTextSelected
                      ]}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Department</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter department"
                  value={formData.department}
                  onChangeText={(value) => setFormData({ ...formData, department: value })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Access Code</Text>
                <View style={styles.codeContainer}>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="Will be auto-generated"
                    value={formData.code}
                    onChangeText={(value) => setFormData({ ...formData, code: value })}
                  />
                  <TouchableOpacity 
                    style={styles.generateButton}
                    onPress={() => setFormData({ ...formData, code: generateRandomCode() })}
                  >
                    <Text style={styles.generateButtonText}>Generate</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.saveButtonText}>Saving...</Text>
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingStaff ? 'Update Staff' : 'Add Staff'}
                  </Text>
                )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
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
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 5,
  },
  listContainer: {
    paddingBottom: 20,
  },
  staffItem: {
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
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
  },
  staffDetails: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 3,
    fontFamily: 'Poppins-Regular',
  },
  staffActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#ECF0F1',
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
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ECF0F1',
    minWidth: 80,
    alignItems: 'center',
  },
  roleButtonSelected: {
    backgroundColor: '#2E86C1',
  },
  roleButtonText: {
    color: '#2C3E50',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  roleButtonTextSelected: {
    color: 'white',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeInput: {
    flex: 1,
  },
  generateButton: {
    padding: 12,
    backgroundColor: '#3498DB',
    borderRadius: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  saveButton: {
    backgroundColor: '#27AE60',
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

export default ManageStaff;