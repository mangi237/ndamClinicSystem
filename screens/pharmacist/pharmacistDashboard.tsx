// components/pharmacy/PharmacyDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput, 
  ScrollView,
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/authContext';
import { User } from '../../types/User';
import AnimatedHeader from '../../components/common/AnimateHeader';

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
  const [showRestockPreModal, setShowRestockPreModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showNewReagentModal, setShowNewReagentModal] = useState(false);
  const [selectedReagent, setSelectedReagent] = useState<Reagent | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<User | null>(null);
  const [distributionQty, setDistributionQty] = useState('');
  const [userCode, setUserCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredReagents, setFilteredReagents] = useState<Reagent[]>([]);
  const [newReagent, setNewReagent] = useState({
    name: '',
    description: '',
    quantity: 0,
    maxCapacity: 100,
    measurementUnit: 'ml' as 'ml' | 'pieces' | 'cups',
  });
  const [restockQty, setRestockQty] = useState('');
  const { user } = useAuth();

  const fadeAnim = useState(new Animated.Value(0))[0];

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
      setFilteredReagents(reagentData);
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

  useEffect(() => {
    // Filter reagents based on search query
    if (searchQuery.trim() === '') {
      setFilteredReagents(reagents);
    } else {
      const filtered = reagents.filter(reagent =>
        reagent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reagent.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReagents(filtered);
    }
  }, [searchQuery, reagents]);

  const calculatePercentage = (quantity: number, maxCapacity: number): number => {
    return Math.round((quantity / maxCapacity) * 100);
  };

  const getPercentageColor = (percentage: number): string => {
    if (percentage >= 70) return '#27AE60'; // Green - Good
    if (percentage >= 30) return '#F39C12'; // Yellow - Warning
    return '#E74C3C'; // Red - Critical
  };

  const getPercentageStatus = (percentage: number): string => {
    if (percentage >= 70) return 'Good';
    if (percentage >= 30) return 'Moderate';
    return 'Low';
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
      return date.toDate().toLocaleDateString();
    } else if (date instanceof Date) {
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

  const restockReagent = async () => {
    if (!selectedReagent || !restockQty) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const quantity = parseFloat(restockQty);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    const isValidCode = await verifyCode();
    if (!isValidCode) {
      Alert.alert('Error', 'Invalid security code');
      return;
    }

    try {
      // Restock existing reagent
      const newQuantity = selectedReagent.quantity + quantity;
      await updateDoc(doc(db, 'reagents', selectedReagent.id!), {
        quantity: newQuantity,
        percentage: calculatePercentage(newQuantity, selectedReagent.maxCapacity),
        updatedAt: new Date(),
      });

      Alert.alert('Success', 'Reagent restocked successfully!');
      setShowRestockModal(false);
      resetRestockForm();
    } catch (error) {
      console.error('Error restocking reagent:', error);
      Alert.alert('Error', 'Failed to restock reagent');
    }
  };

  const addNewReagent = async () => {
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
      // Add new reagent
      await addDoc(collection(db, 'reagents'), {
        ...newReagent,
        percentage: calculatePercentage(newReagent.quantity, newReagent.maxCapacity),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      Alert.alert('Success', 'Reagent added successfully!');
      setShowNewReagentModal(false);
      resetNewReagentForm();
    } catch (error) {
      console.error('Error adding reagent:', error);
      Alert.alert('Error', 'Failed to add reagent');
    }
  };

  const resetDistributionForm = () => {
    setSelectedReagent(null);
    setSelectedTechnician(null);
    setDistributionQty('');
    setUserCode('');
  };

  const resetRestockForm = () => {
    setSelectedReagent(null);
    setRestockQty('');
    setUserCode('');
    setSearchQuery('');
  };

  const resetNewReagentForm = () => {
    setNewReagent({
      name: '',
      description: '',
      quantity: 0,
      maxCapacity: 100,
      measurementUnit: 'ml',
    });
    setUserCode('');
  };

  const renderReagentItem = ({ item }: { item: Reagent }) => {
    const percentageColor = getPercentageColor(item.percentage);
    const status = getPercentageStatus(item.percentage);
    
    return (
      <View style={styles.reagentCard}>
        <View style={styles.reagentHeader}>
          <View style={styles.reagentTitleContainer}>
            <Text style={styles.reagentName}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: percentageColor }]}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>
          <Text style={styles.reagentDescription}>{item.description}</Text>
        </View>

        <View style={styles.stockInfo}>
          <View style={styles.quantityInfo}>
            <Text style={styles.quantityText}>
              {item.quantity} {item.measurementUnit}
            </Text>
            <Text style={styles.capacityText}>
              of {item.maxCapacity} {item.measurementUnit}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${item.percentage}%`,
                    backgroundColor: percentageColor
                  }
                ]} 
              />
            </View>
            <Text style={[styles.percentageText, { color: percentageColor }]}>
              {item.percentage}%
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.distributeButton, { backgroundColor: percentageColor }]}
          onPress={() => {
            setSelectedReagent(item);
            setShowDistributionModal(true);
          }}
        >
          <Ionicons name="send" size={16} color="white" />
          <Text style={styles.distributeButtonText}>Distribute</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDistributionItem = ({ item }: { item: Distribution }) => (
    <View style={styles.distributionItem}>
      <View style={styles.distributionIcon}>
        <Ionicons name="flask" size={20} color="#1E96A9" />
      </View>
      <View style={styles.distributionInfo}>
        <Text style={styles.distributionText}>{item.reagentName}</Text>
        <Text style={styles.distributionDetails}>
          {item.quantity} units to {item.technicianName}
        </Text>
        <Text style={styles.distributionDate}>
          {formatDate(item.distributedAt)} by {item.distributedBy}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AnimatedHeader />
      
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Pharmacy Dashboard</Text>
        <TouchableOpacity 
          style={styles.restockButton}
          onPress={() => setShowRestockPreModal(true)}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.restockButtonText}>Manage Stock</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reagent Inventory</Text>
          <FlatList
            data={filteredReagents}
            renderItem={renderReagentItem}
            keyExtractor={item => item.id!}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="flask-outline" size={48} color="#BDC3C7" />
                <Text style={styles.emptyText}>No reagents found</Text>
              </View>
            }
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Distributions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={distributions.slice(0, 5)}
            renderItem={renderDistributionItem}
            keyExtractor={item => item.id!}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={32} color="#BDC3C7" />
                <Text style={styles.emptyText}>No distributions yet</Text>
              </View>
            }
          />
        </View>
      </ScrollView>

      {/* Restock Pre-Modal */}
      <Modal visible={showRestockPreModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manage Reagent Stock</Text>
            <Text style={styles.modalSubtitle}>What would you like to do?</Text>
            
            <View style={styles.preModalButtons}>
              <TouchableOpacity 
                style={[styles.preModalButton, styles.restockButton]}
                onPress={() => {
                  setShowRestockPreModal(false);
                  setShowRestockModal(true);
                }}
              >
                <Ionicons name="refresh" size={24} color="white" />
                <Text style={styles.preModalButtonText}>Restock Existing</Text>
                <Text style={styles.preModalButtonSubtext}>Add quantity to existing reagent</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.preModalButton, styles.newReagentButton]}
                onPress={() => {
                  setShowRestockPreModal(false);
                  setShowNewReagentModal(true);
                }}
              >
                <Ionicons name="add-circle" size={24} color="white" />
                <Text style={styles.preModalButtonText}>Add New Reagent</Text>
                <Text style={styles.preModalButtonSubtext}>Create a new reagent entry</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowRestockPreModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Restock Existing Reagent Modal */}
      <Modal visible={showRestockModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Restock Reagent</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Search reagents..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView style={styles.reagentList}>
              {filteredReagents.map(reagent => (
                <TouchableOpacity
                  key={reagent.id}
                  style={[
                    styles.reagentListItem,
                    selectedReagent?.id === reagent.id && styles.selectedReagent
                  ]}
                  onPress={() => setSelectedReagent(reagent)}
                >
                  <Text style={styles.reagentListItemName}>{reagent.name}</Text>
                  <Text style={styles.reagentListItemDetails}>
                    {reagent.quantity} {reagent.measurementUnit} • {reagent.percentage}%
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedReagent && (
              <View style={styles.selectedReagentInfo}>
                <Text style={styles.selectedReagentName}>{selectedReagent.name}</Text>
                <Text style={styles.selectedReagentStock}>
                  Current: {selectedReagent.quantity} {selectedReagent.measurementUnit}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Quantity to add"
                  keyboardType="numeric"
                  value={restockQty}
                  onChangeText={setRestockQty}
                />
              </View>
            )}

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
                onPress={restockReagent}
                disabled={!selectedReagent || !restockQty}
              >
                <Text style={styles.confirmButtonText}>Restock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add New Reagent Modal */}
      <Modal visible={showNewReagentModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Reagent</Text>
            
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
              placeholder="Initial quantity"
              keyboardType="numeric"
              value={newReagent.quantity.toString()}
              onChangeText={(text) => setNewReagent({...newReagent, quantity: parseFloat(text) || 0})}
            />

            <TextInput
              style={styles.input}
              placeholder="Maximum capacity"
              keyboardType="numeric"
              value={newReagent.maxCapacity.toString()}
              onChangeText={(text) => setNewReagent({...newReagent, maxCapacity: parseFloat(text) || 100})}
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
                  setShowNewReagentModal(false);
                  resetNewReagentForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={addNewReagent}
              >
                <Text style={styles.confirmButtonText}>Add Reagent</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Distribution Modal (unchanged from your original) */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  restockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    padding: 12,
    borderRadius: 10,
    elevation: 2,
  },
  newReagentButton:{
        flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'green',
    padding: 12,
    borderRadius: 10,
    elevation: 2,
  },
  restockButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  viewAllText: {
    color: '#1E96A9',
    fontWeight: '600',
  },
  reagentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E8F5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reagentHeader: {
    marginBottom: 12,
  },
  reagentTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reagentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  reagentDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  stockInfo: {
    marginBottom: 16,
  },
  quantityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  capacityText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  progressContainer: {
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
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 30,
  },
  distributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  distributeButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  distributionIcon: {
    marginRight: 12,
  },
  distributionInfo: {
    flex: 1,
  },
  distributionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  distributionDetails: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  distributionDate: {
    fontSize: 12,
    color: '#BDC3C7',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#BDC3C7',
    marginTop: 8,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2C3E50',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 24,
    textAlign: 'center',
  },
  preModalButtons: {
    marginBottom: 20,
  },
  preModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  preModalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  preModalButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginLeft: 12,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  reagentList: {
    maxHeight: 150,
    marginBottom: 16,
  },
  reagentListItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  selectedReagent: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
  },
  reagentListItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  reagentListItemDetails: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  selectedReagentInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedReagentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  selectedReagentStock: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  unitButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  unitButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 8,
    marginRight: 8,
    flex: 1,
    alignItems: 'center',
  },
  selectedUnit: {
    backgroundColor: '#1E96A9',
    borderColor: '#1E96A9',
  },
  unitText: {
    color: '#2C3E50',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ECF0F1',
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#27AE60',
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  selectedItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
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
  technicianList: {
    maxHeight: 150,
    marginBottom: 16,
  },
  technicianItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  selectedTechnician: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
  },
  technicianName: {
    fontSize: 16,
    color: '#2C3E50',
  },
  technicianEmail: {
    fontSize: 14,
    color: '#7F8C8D',
  },
});

export default PharmacyDashboard;