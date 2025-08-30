import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { Pharmacy, MedicationAvailable } from '../../types/Pharmacy';

const PharmacistDashboard = () => {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [medications, setMedications] = useState<MedicationAvailable[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationAvailable | null>(null);
  const [sellQuantity, setSellQuantity] = useState('');
  const [soldTo, setSoldTo] = useState('');
  const [prescription, setPrescription] = useState('');
  const [newMedication, setNewMedication] = useState({
    name: '',
    description: '',
    price: 0,
    quantityStock: 0,
  });
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch pharmacy data
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'pharmacies'), where('email', '==', user.email));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const pharmacyData = { 
          id: snapshot.docs[0].id, 
          ...snapshot.docs[0].data() 
        } as Pharmacy;
        setPharmacy(pharmacyData);
        
        // Fetch medications for this pharmacy
        const medsQuery = query(
          collection(db, 'medications'),
          where('pharmacyId', '==', pharmacyData.id),
          orderBy('createdAt', 'desc')
        );
        
        const medUnsubscribe = onSnapshot(medsQuery, (medSnapshot) => {
          const medsData = medSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          } as MedicationAvailable));
          setMedications(medsData);
        });
        
        return () => medUnsubscribe();
      } else {
        // Create a new pharmacy if one doesn't exist
        createNewPharmacy(user);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-calculation for total price
  useEffect(() => {
    if (selectedMedication && sellQuantity) {
      const quantity = parseInt(sellQuantity);
      // Calculation happens in the render
    }
  }, [sellQuantity, selectedMedication]);

  const createNewPharmacy = async (user: any) => {
    try {
      const newPharmacy = {
        name: `${user.displayName || 'Pharmacist'}'s Pharmacy`,
        address: '',
        phone: '',
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'pharmacies'), newPharmacy);
      setPharmacy({ id: docRef.id, ...newPharmacy });
    } catch (error) {
      console.error('Error creating pharmacy:', error);
      Alert.alert('Error', 'Failed to create pharmacy profile');
    }
  };

  // Fetch recent sales
  useEffect(() => {
    if (!pharmacy?.id) return;

    const salesQuery = query(
      collection(db, 'sales'),
      where('pharmacyId', '==', pharmacy.id),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentSales(salesData);
    });

    return () => unsubscribe();
  }, [pharmacy]);

  const handleSellMedication = async () => {
    if (!selectedMedication || !sellQuantity || !soldTo ) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const quantity = parseInt(sellQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (quantity > selectedMedication.quantityStock) {
      Alert.alert('Error', 'Not enough stock available');
      return;
    }

    setProcessing(true);
    try {
      // Update medication stock
      const updatedQuantity = selectedMedication.quantityStock - quantity;
      await updateDoc(doc(db, 'medications', selectedMedication.id!), {
        quantityStock: updatedQuantity,
        quatintySold: (selectedMedication.quatintySold || 0) + quantity,
        quantityRemaining: updatedQuantity,
        updatedAt: new Date(),
      });

      // Record sale
      await addDoc(collection(db, 'sales'), {
        pharmacyId: pharmacy.id,
        medicationId: selectedMedication.id,
        medicationName: selectedMedication.name,
        quantity,
        prescription,
        price: selectedMedication.price * quantity,
        soldTo,
        soldBy: auth.currentUser?.displayName || 'Pharmacist',
        createdAt: new Date(),
      });

      // Reset form and close modal FIRST
      setSelectedMedication(null);
      setSellQuantity('');
      setSoldTo('');
      setPrescription('');
      setSearchQuery('');
      setShowSellModal(false);
      
      // THEN show success message
      Alert.alert('Success', 'Sale recorded successfully!');
    } catch (error) {
      console.error('Error selling medication:', error);
      Alert.alert('Error', 'Failed to record sale');
    } finally {
      setProcessing(false);
    }
  };

  const handleRestock = async () => {
    if (!pharmacy?.id) {
      Alert.alert('Error', 'Pharmacy information not loaded yet. Please try again.');
      return;
    }

    if (!newMedication.name || newMedication.price <= 0 || newMedication.quantityStock <= 0) {
      Alert.alert('Error', 'Please fill all fields with valid values');
      return;
    }

    setProcessing(true);
    try {
      await addDoc(collection(db, 'medications'), {
        ...newMedication,
        pharmacyId: pharmacy.id,
        quatintySold: 0,
        quantityRemaining: newMedication.quantityStock,
        soldBy: auth.currentUser?.displayName || 'Pharmacist',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Reset form and close modal FIRST
      setNewMedication({
        name: '',
        description: '',
        price: 0,
        quantityStock: 0,
      });
      setShowRestockModal(false);
      
      // THEN show success message
      Alert.alert('Success', 'Medication restocked successfully!');
    } catch (error) {
      console.error('Error restocking medication:', error);
      Alert.alert('Error', 'Failed to restock medication');
    } finally {
      setProcessing(false);
    }
  };

  // Filter medications based on search
  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate dashboard metrics
  const totalStock = medications.reduce((sum, med) => sum + med.quantityStock, 0);
  const totalSold = medications.reduce((sum, med) => sum + (med.quatintySold || 0), 0);
  const totalRevenue = recentSales.reduce((sum, sale) => sum + (sale.price || 0), 0);
  const mostSoldMedication = medications.length > 0 
    ? medications.reduce((prev, current) => 
        (prev.quatintySold || 0) > (current.quatintySold || 0) ? prev : current
      )
    : null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text>Loading pharmacy data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pharmacist Portal</Text>
        <TouchableOpacity 
          style={styles.restockButton} 
          onPress={() => {
            // if (!pharmacy) {
            //   Alert.alert('Error', 'Pharmacy data not loaded yet');
            //   return;
            // }
            setShowRestockModal(true);
          }}
          disabled={processing}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.restockButtonText}>Restock</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Dashboard */}
        <View style={styles.dashboard}>
          <Text style={styles.sectionTitle}>Inventory Overview</Text>
          
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Ionicons name="medical" size={24} color="#E74C3C" />
              <Text style={styles.metricValue}>{totalStock}</Text>
              <Text style={styles.metricLabel}>Total Stock</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Ionicons name="cart" size={24} color="#E74C3C" />
              <Text style={styles.metricValue}>{totalSold}</Text>
              <Text style={styles.metricLabel}>Medications Sold</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Ionicons name="cash" size={24} color="#E74C3C" />
              <Text style={styles.metricValue}>${totalRevenue.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Total Revenue</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Ionicons name="trending-up" size={24} color="#E74C3C" />
              <Text style={[styles.metricValue, {fontSize: 14}]} numberOfLines={1}>
                {mostSoldMedication ? mostSoldMedication.name : 'N/A'}
              </Text>
              <Text style={styles.metricLabel}>Most Sold</Text>
            </View>
          </View>
        </View>

        {/* Recent Sales */}
        <View style={styles.salesSection}>
          <View style={styles.salesHeader}>
            <Text style={styles.sectionTitle}>Recent Sales</Text>
            <View style={styles.timeFilter}>
              <TouchableOpacity 
                style={[styles.filterButton, timeFilter === 'week' && styles.activeFilter]}
                onPress={() => setTimeFilter('week')}
              >
                <Text style={[styles.filterText, timeFilter === 'week' && styles.activeFilterText]}>Week</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, timeFilter === 'month' && styles.activeFilter]}
                onPress={() => setTimeFilter('month')}
              >
                <Text style={[styles.filterText, timeFilter === 'month' && styles.activeFilterText]}>Month</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, timeFilter === 'year' && styles.activeFilter]}
                onPress={() => setTimeFilter('year')}
              >
                <Text style={[styles.filterText, timeFilter === 'year' && styles.activeFilterText]}>Year</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.sellButton, processing && styles.disabledButton]} 
            onPress={() => {
              // if (!pharmacy) {
              //   Alert.alert('Error', 'Pharmacy data not loaded yet');
              //   return;
              // }
              setShowSellModal(true);
            }}
            disabled={processing}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.sellButtonText}>Sell Medication</Text>
          </TouchableOpacity>

          <FlatList
            data={recentSales}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.saleItem}>
                <View style={styles.saleInfo}>
                  <Text style={styles.medicationName}>{item.medicationName}</Text>
                  <Text style={styles.saleDetails}>Quantity: {item.quantity} | ${item.price?.toFixed(2) || '0.00'}</Text>
                  <Text style={styles.saleDetails}>Sold to: {item.soldTo}</Text>
                  {item.prescription && <Text style={styles.prescription}>Prescription: {item.prescription}</Text>}
                </View>
                <View style={styles.saleMeta}>
                  <Text style={styles.soldBy}>By: {item.soldBy}</Text>
                  <Text style={styles.saleDate}>
                    {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Unknown date'}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="receipt" size={48} color="#BDC3C7" />
                <Text style={styles.emptyStateText}>No sales yet</Text>
                <Text style={styles.emptyStateSubtext}>Start selling medications to see records here</Text>
              </View>
            }
          />
        </View>
      </ScrollView>

      {/* Sell Medication Modal */}
      <Modal visible={showSellModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            onPress={() => setShowDropdown(false)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sell Medication</Text>
              
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Search medication..."
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                
                {showDropdown && filteredMedications.length > 0 && (
                  <View style={styles.dropdown}>
                    <FlatList
                      data={filteredMedications}
                      keyExtractor={item => item.id!}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedMedication(item);
                            setSearchQuery(item.name);
                            setShowDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownText}>{item.name}</Text>
                          <Text style={styles.dropdownStock}>Stock: {item.quantityStock}</Text>
                        </TouchableOpacity>
                      )}
                      style={styles.dropdownList}
                    />
                  </View>
                )}
              </View>
              
              {selectedMedication && (
                <View style={styles.selectedMedication}>
                  <Text style={styles.medicationText}>{selectedMedication.name}</Text>
                  <Text style={styles.stockText}>In stock: {selectedMedication.quantityStock}</Text>
                  <Text style={styles.priceText}>Price: ${selectedMedication.price.toFixed(2)} per unit</Text>
                  {sellQuantity && (
                    <Text style={styles.totalPriceText}>
                      Total: ${(selectedMedication.price * (parseInt(sellQuantity) || 0)).toFixed(2)}
                    </Text>
                  )}
                </View>
              )}
              
              <TextInput
                style={styles.input}
                placeholder="Quantity"
                keyboardType="numeric"
                value={sellQuantity}
                onChangeText={setSellQuantity}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Sold to (customer name)"
                value={soldTo}
                onChangeText={setSoldTo}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Prescription details (optional)"
                multiline
                value={prescription}
                onChangeText={setPrescription}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.cancelButton, processing && styles.disabledButton]} 
                  onPress={() => {
                    setShowSellModal(false);
                    setShowDropdown(false);
                    setSearchQuery('');
                  }}
                  disabled={processing}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmButton, processing && styles.disabledButton]} 
                  onPress={handleSellMedication}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirm Sale</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Restock Medication Modal */}
      <Modal visible={showRestockModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Restock Medication</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Medication Name"
              value={newMedication.name}
              onChangeText={(text) => setNewMedication({...newMedication, name: text})}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              multiline
              value={newMedication.description}
              onChangeText={(text) => setNewMedication({...newMedication, description: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Price per unit"
              keyboardType="numeric"
              value={newMedication.price === 0 ? '' : newMedication.price.toString()}
              onChangeText={(text) => setNewMedication({...newMedication, price: parseFloat(text) || 0})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Quantity"
              keyboardType="numeric"
              value={newMedication.quantityStock === 0 ? '' : newMedication.quantityStock.toString()}
              onChangeText={(text) => setNewMedication({...newMedication, quantityStock: parseInt(text) || 0})}
            />
            
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Cost:</Text>
              <Text style={styles.totalValue}>
                ${(newMedication.price * newMedication.quantityStock).toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.cancelButton, processing && styles.disabledButton]} 
                onPress={() => setShowRestockModal(false)}
                disabled={processing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, processing && styles.disabledButton]} 
                onPress={handleRestock}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Add to Inventory</Text>
                )}
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
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E74C3C',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  restockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  restockButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  dashboard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginVertical: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  salesSection: {
    padding: 16,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 400,
  },
  salesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeFilter: {
    flexDirection: 'row',
    backgroundColor: '#ECF0F1',
    borderRadius: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeFilter: {
    backgroundColor: '#E74C3C',
  },
  filterText: {
    color: '#7F8C8D',
    fontSize: 12,
  },
  activeFilterText: {
    color: 'white',
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
    opacity: 0.7,
  },
  sellButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  saleInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  saleDetails: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  prescription: {
    fontSize: 12,
    color: '#3498DB',
    fontStyle: 'italic',
  },
  saleMeta: {
    alignItems: 'flex-end',
  },
  soldBy: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  saleDate: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#BDC3C7',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  dropdownStock: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  selectedMedication: {
    backgroundColor: '#F9E6E6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  medicationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
  },
  stockText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  priceText: {
    fontSize: 14,
    color: '#27AE60',
    marginTop: 4,
  },
  totalPriceText: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: 'bold',
    marginTop: 4,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ECF0F1',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default PharmacistDashboard;