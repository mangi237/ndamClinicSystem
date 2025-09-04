// components/pharmacy/PharmacyDashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/authContext';
import { User } from '../../types/User';

interface Reagent {
  id?: string;
  name: string;
  description: string;
  quantity: number;
  maxCapacity: number;
  measurementUnit: 'ml' | 'pieces' | 'cups';
  percentage: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Distribution {
  id?: string;
  reagentId: string;
  reagentName: string;
  quantity: number;
  technicianId: string;
  technicianName: string;
  distributedBy: string;
  distributedAt: Date;
}

const PharmacyDashboard = () => {
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedReagent, setSelectedReagent] = useState<Reagent | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<User | null>(null);
  const [distributionQty, setDistributionQty] = useState('');
  const [userCode, setUserCode] = useState('');
  const [newReagent, setNewReagent] = useState({
    name: '',
    description: '',
    quantity: 0,
    maxCapacity: 100,
    measurementUnit: 'ml' as 'ml' | 'pieces' | 'cups',
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Fetch reagents
    const reagentsQuery = query(collection(db, 'reagents'));
    const reagentsUnsubscribe = onSnapshot(reagentsQuery, (snapshot) => {
      const reagentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        percentage: calculatePercentage(doc.data().quantity, doc.data().maxCapacity)
      })) as Reagent[];
      setReagents(reagentData);
    });

    // Fetch lab technicians
    const techniciansQuery = query(
      collection(db, 'users'),
      where('role', '==', 'lab')
    );
    const techniciansUnsubscribe = onSnapshot(techniciansQuery, (snapshot) => {
      const technicianData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setTechnicians(technicianData);
    });

    // Fetch distributions
    const distributionsQuery = query(collection(db, 'distributions'));
    const distributionsUnsubscribe = onSnapshot(distributionsQuery, (snapshot) => {
      const distributionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Distribution[];
      setDistributions(distributionData);
    });

    return () => {
      reagentsUnsubscribe();
      techniciansUnsubscribe();
      distributionsUnsubscribe();
    };
  }, [user]);

  const calculatePercentage = (quantity: number, maxCapacity: number): number => {
    return Math.round((quantity / maxCapacity) * 100);
  };

  const verifyCode = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('email', '==', user.email)
      ));
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        return userData.code === userCode;
      }
      return false;
    } catch (error) {
      console.error('Error verifying code:', error);
      return false;
    }
  };
  const formatDate = (date: any): string => {
  if (date && typeof date.toDate === 'function') {
    // It's a Firestore Timestamp
    return date.toDate().toLocaleDateString();
  } else if (date instanceof Date) {
    // It's already a Date object
    return date.toLocaleDateString();
  }
  return 'Unknown date';
};


  const distributeReagent = async () => {
    if (!selectedReagent || !selectedTechnician || !distributionQty) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const quantity = parseFloat(distributionQty);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (quantity > selectedReagent.quantity) {
      Alert.alert('Error', 'Not enough stock available');
      return;
    }

    const isValidCode = await verifyCode();
    if (!isValidCode) {
      Alert.alert('Error', 'Invalid security code');
      return;
    }

    try {
      // Update reagent quantity
      const newQuantity = selectedReagent.quantity - quantity;
      await updateDoc(doc(db, 'reagents', selectedReagent.id!), {
        quantity: newQuantity,
        percentage: calculatePercentage(newQuantity, selectedReagent.maxCapacity),
        updatedAt: new Date(),
      });

      // Record distribution
      await addDoc(collection(db, 'distributions'), {
        reagentId: selectedReagent.id,
        reagentName: selectedReagent.name,
        quantity: quantity,
        technicianId: selectedTechnician.id,
        technicianName: selectedTechnician.name,
        distributedBy: user?.name,
        distributedAt: new Date(),
      });

      Alert.alert('Success', 'Reagent distributed successfully!');
      setShowDistributionModal(false);
      resetDistributionForm();
    } catch (error) {
      console.error('Error distributing reagent:', error);
      Alert.alert('Error', 'Failed to distribute reagent');
    }
  };

  const restockReagent = async (isNew: boolean) => {
    if (!newReagent.name || newReagent.quantity <= 0) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const isValidCode = await verifyCode();
    if (!isValidCode) {
      Alert.alert('Error', 'Invalid security code');
      return;
    }

    try {
      if (isNew) {
        // Add new reagent
        await addDoc(collection(db, 'reagents'), {
          ...newReagent,
          percentage: calculatePercentage(newReagent.quantity, newReagent.maxCapacity),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else if (selectedReagent) {
        // Restock existing reagent
        await updateDoc(doc(db, 'reagents', selectedReagent.id!), {
          quantity: selectedReagent.quantity + newReagent.quantity,
          percentage: calculatePercentage(selectedReagent.quantity + newReagent.quantity, selectedReagent.maxCapacity),
          updatedAt: new Date(),
        });
      }

      Alert.alert('Success', isNew ? 'Reagent added successfully!' : 'Reagent restocked successfully!');
      setShowRestockModal(false);
      resetRestockForm();
    } catch (error) {
      console.error('Error restocking reagent:', error);
      Alert.alert('Error', 'Failed to restock reagent');
    }
  };

  const resetDistributionForm = () => {
    setSelectedReagent(null);
    setSelectedTechnician(null);
    setDistributionQty('');
    setUserCode('');
  };

  const resetRestockForm = () => {
    setNewReagent({
      name: '',
      description: '',
      quantity: 0,
      maxCapacity: 100,
      measurementUnit: 'ml',
    });
    setUserCode('');
  };

  const renderReagentItem = ({ item }: { item: Reagent }) => (
    <View style={styles.reagentItem}>
      <View style={styles.reagentInfo}>
        <Text style={styles.reagentName}>{item.name}</Text>
        <Text style={styles.reagentDescription}>{item.description}</Text>
        <View style={styles.stockInfo}>
          <Text style={styles.stockText}>
            {item.quantity} {item.measurementUnit}
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${item.percentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.percentageText}>{item.percentage}%</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.distributeButton}
        onPress={() => {
          setSelectedReagent(item);
          setShowDistributionModal(true);
        }}
      >
        <Ionicons name="send" size={20} color="white" />
        <Text style={styles.distributeButtonText}>Distribute</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDistributionItem = ({ item }: { item: Distribution }) => (
    <View style={styles.distributionItem}>
      <Text style={styles.distributionText}>{item.reagentName}</Text>
      <Text style={styles.distributionDetails}>
        {item.quantity} units to {item.technicianName}
      </Text>
      <Text style={styles.distributionDate}>
{formatDate(item.distributedAt)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stock Manager</Text>
        <TouchableOpacity 
          style={styles.restockButton}
          onPress={() => setShowRestockModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.restockButtonText}>Restock</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reagent Stock</Text>
          <FlatList
            data={reagents}
            renderItem={renderReagentItem}
            keyExtractor={item => item.id!}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Distributions</Text>
          <FlatList
            data={distributions.slice(0, 5)}
            renderItem={renderDistributionItem}
            keyExtractor={item => item.id!}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No distributions yet</Text>
            }
          />
        </View>
      </ScrollView>

      {/* Distribution Modal */}
      <Modal visible={showDistributionModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Distribute Reagent</Text>
            
            {selectedReagent && (
              <View style={styles.selectedItem}>
                <Text style={styles.selectedName}>{selectedReagent.name}</Text>
                <Text style={styles.selectedStock}>
                  Available: {selectedReagent.quantity} {selectedReagent.measurementUnit}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Quantity to distribute"
              keyboardType="numeric"
              value={distributionQty}
              onChangeText={setDistributionQty}
            />

            <Text style={styles.label}>Select Lab Technician:</Text>
            <ScrollView style={styles.technicianList}>
              {technicians.map(tech => (
                <TouchableOpacity
                  key={tech.id}
                  style={[
                    styles.technicianItem,
                    selectedTechnician?.id === tech.id && styles.selectedTechnician
                  ]}
                  onPress={() => setSelectedTechnician(tech)}
                >
                  <Text style={styles.technicianName}>{tech.name}</Text>
                  <Text style={styles.technicianEmail}>{tech.email}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder="Your security code"
              value={userCode}
              onChangeText={setUserCode}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowDistributionModal(false);
                  resetDistributionForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={distributeReagent}
              >
                <Text style={styles.confirmButtonText}>Distribute</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Restock Modal */}
      <Modal visible={showRestockModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Restock Reagent</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Reagent name"
              value={newReagent.name}
              onChangeText={(text) => setNewReagent({...newReagent, name: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newReagent.description}
              onChangeText={(text) => setNewReagent({...newReagent, description: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Quantity"
              keyboardType="numeric"
              value={newReagent.quantity.toString()}
              onChangeText={(text) => setNewReagent({...newReagent, quantity: parseFloat(text) || 0})}
            />

            <Text style={styles.label}>Measurement Unit:</Text>
            <View style={styles.unitButtons}>
              {(['ml', 'pieces', 'cups'] as const).map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitButton,
                    newReagent.measurementUnit === unit && styles.selectedUnit
                  ]}
                  onPress={() => setNewReagent({...newReagent, measurementUnit: unit})}
                >
                  <Text style={styles.unitText}>{unit}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Your security code"
              value={userCode}
              onChangeText={setUserCode}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowRestockModal(false);
                  resetRestockForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => restockReagent(true)}
              >
                <Text style={styles.confirmButtonText}>Add Reagent</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  restockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    padding: 10,
    borderRadius: 8,
  },
  restockButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  reagentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  reagentInfo: {
    flex: 1,
  },
  reagentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  reagentDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 10,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 14,
    color: '#2C3E50',
    marginRight: 10,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#ECF0F1',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27AE60',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    color: '#7F8C8D',
    minWidth: 30,
  },
  distributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E96A9',
    padding: 8,
    borderRadius: 6,
  },
  distributeButtonText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 12,
  },
  distributionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  distributionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  distributionDetails: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  distributionDate: {
    fontSize: 12,
    color: '#BDC3C7',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#7F8C8D',
    padding: 20,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2C3E50',
    textAlign: 'center',
  },
  selectedItem: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  selectedStock: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
  },
  technicianList: {
    maxHeight: 150,
    marginBottom: 15,
  },
  technicianItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  selectedTechnician: {
    backgroundColor: '#E8F5E8',
  },
  technicianName: {
    fontSize: 16,
    color: '#2C3E50',
  },
  technicianEmail: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  unitButtons: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  unitButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 8,
    marginRight: 10,
  },
  selectedUnit: {
    backgroundColor: '#1E96A9',
    borderColor: '#1E96A9',
  },
  unitText: {
    color: '#2C3E50',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ECF0F1',
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#27AE60',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default PharmacyDashboard;