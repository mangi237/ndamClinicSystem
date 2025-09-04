// components/cashier/CashierDashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PatientList from '../../components/medical/PatientList';
import AnimatedHeader from '../../components/common/AnimateHeader';
const CashierDashboard = () => {
  const [stats, setStats] = useState({
    todayPayments: 0,
    totalPayments: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchPaymentStats();
  }, []);

 const fetchPaymentStats = async () => {
  try {
    const paymentsRef = collection(db, 'patients');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Remove the where clauses that might cause permission issues
    const todayQuery = query(paymentsRef); // Simplified query
    const allQuery = query(paymentsRef); // Simplified query
    
    const [todaySnapshot, allSnapshot] = await Promise.all([
      getDocs(todayQuery),
      getDocs(allQuery)
    ]);
    
    // Manual filtering instead of using where clauses
    const todayTotal = todaySnapshot.docs.filter(doc => {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
      return data.status === 'completed' && updatedAt >= today;
    }).length;
    
    const allTotal = allSnapshot.docs.filter(doc => 
      doc.data().status === 'completed'
    ).length;
    
    // Calculate revenue
    let revenue = 0;
    allSnapshot.forEach(doc => {
      const patientData = doc.data();
      if (patientData.status === 'completed' && patientData.labTests) {
        patientData.labTests.forEach((test: any) => {
          revenue += test.price || 0;
        });
      }
    });
    
    setStats({
      todayPayments: todayTotal,
      totalPayments: allTotal,
      totalRevenue: revenue,
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    // Set default values instead of crashing
    setStats({
      todayPayments: 0,
      totalPayments: 0,
      totalRevenue: 0,
    });
  }
};

  return (
    <View style={styles.container}>
        <AnimatedHeader />
      {/* Stats Overview */}
      <ScrollView>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="today" size={30} color="#27AE60" />
            <Text style={styles.statNumber}>{stats.todayPayments}</Text>
            <Text style={styles.statLabel}>Today's Payments</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={30} color="#2E86C1" />
            <Text style={styles.statNumber}>{stats.totalPayments}</Text>
            <Text style={styles.statLabel}>Total Payments</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="cash" size={30} color="#E67E22" />
            <Text style={styles.statNumber}>${stats.totalRevenue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
        </View>
        
        {/* Patient List */}
        <View style={styles.patientListSection}>
          <Text style={styles.sectionTitle}>Patient Management</Text>
          <PatientList />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#F8F9FA',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  patientListSection: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
});

export default CashierDashboard;