// components/admin/Overview.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BarChart } from 'react-native-chart-kit';
const screenHeight = Dimensions.get('window').height;
const Overview = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    labTechnicians: 0,
    analyzer: 0,
    receptionist: 0,
    totalCashiers: 0,
  });
  
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStats();
    fetchPatients();
  }, []);

  const fetchStats = async () => {
    try {
      const patientsSnapshot = await getDocs(collection(db, 'patients'));
      const totalPatients = patientsSnapshot.size;

      const staffSnapshot = await getDocs(collection(db, 'users'));
      let labTechnicians = 0;
      let totalCashiers = 0;
      let analyzer = 0;
      let receptionist = 0;
      
      staffSnapshot.forEach((doc) => {
        const staffData = doc.data();
        if (staffData.role === 'cashier') totalCashiers++;
        if (staffData.role === 'analyzer') analyzer++;
        if (staffData.role === 'lab') labTechnicians++;
        if (staffData.role === 'receptionist') receptionist++;
      });

      setStats({
        totalPatients,
        analyzer,
        labTechnicians,
        totalCashiers,
        receptionist,
      });
    } catch (error) {
      console.error('Error fetching stats: ', error);
    }
  };


  const fetchPatients = async () => {
    try {
      const patientsSnapshot = await getDocs(collection(db, 'patients'));
      const patientsData = [];
      patientsSnapshot.forEach((doc) => {
        patientsData.push({ id: doc.id, ...doc.data() });
      });
      setPatients(patientsData);
    } catch (error) {
      console.error('Error fetching patients: ', error);
    }
  };

  const filteredPatients = patients.filter(patient => 
    patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const screenWidth = Dimensions.get('window').width;

  // Prepare financial data for the chart (using mock data as placeholder)
  const financialData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [12000, 9500, 14500, 11000, 13900, 17500, 12500],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 128, 128, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#008080',
    },
    barPercentage: 0.5,
    fillShadowGradient: '#008080',
    fillShadowGradientOpacity: 1,
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: '#e3e3e3',
    },
    propsForLabels: {
      fontSize: 12,
      fontFamily: 'Poppins-Regular',
    },
  };


  return (
    <View style={styles.container}>
      <ScrollView style = {{width : screenWidth * 0.7}}>
        {/* Dashboard Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="people" size={24} color="#008080" />
            </View>
            <Text style={styles.statNumber}>{stats.totalPatients}</Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="flask" size={24} color="#008080" />
            </View>
            <Text style={styles.statNumber}>{stats.labTechnicians}</Text>
            <Text style={styles.statLabel}>Lab Technicians</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cash" size={24} color="#008080" />
            </View>
            <Text style={styles.statNumber}>{stats.totalCashiers}</Text>
            <Text style={styles.statLabel}>Cashiers</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="desktop" size={24} color="#008080" />
            </View>
            <Text style={styles.statNumber}>{stats.receptionist}</Text>
            <Text style={styles.statLabel}>Receptionist</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="enter-outline" size={24} color="#008080" />
            </View>
            <Text style={styles.statNumber}>{stats.analyzer}</Text>
            <Text style={styles.statLabel}>Analyzers</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="person" size={24} color="#008080" />
            </View>
            <Text style={styles.statNumber}>{stats.receptionist}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
        </View>
   
        {/* Report Analytics Section */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Report Analytics</Text>
          
          <View style={styles.chartFilterContainer}>
            {['All', 'Week', 'Month', 'Year'].map((item) => (
              <TouchableOpacity key={item} style={styles.filterButton}>
                <Text style={styles.filterButtonText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <BarChart
            data={financialData}
            // width={}
            width={screenWidth * 0.6}
            height={screenHeight * 0.4}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel="$"
            yAxisSuffix=""
            showValuesOnTopOfBars={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            fromZero={true}
          />
        </View>
      </ScrollView>
      
      {/* Patient List Sidebar */}
      <View style={styles.patientSidebar}>
        <Text style={styles.sidebarTitle}>Patient List</Text>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView style={styles.patientList}>
          {filteredPatients.map((patient) => (
            <View key={patient.id} style={styles.patientItem}>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{patient.name|| 'Unknown Patient'}</Text>
         
                <Text style={styles.patientStatus}>{patient.gender|| 'Active'}</Text>
              </View>
              <Text style={styles.patientFee}>${patient.status || 'ACTIVE'}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    height: screenHeight,
  },
  statsContainer: {
     flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  padding: 20,
  width: '70%',
  },
  statCard: {
   width: '32%', // A bit less than 50% to allow for a gap
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 20,
  alignItems: 'center',
  marginBottom: 15, // Creates vertical space between rows
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    // width: '70%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
    marginBottom: 15,
  },
  chartFilterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E0F2F1',
    borderRadius: 16,
    marginRight: 8,
  },
  filterButtonText: {
    color: '#008080',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  chart: {
    borderRadius: 12,
    // width: '70%',
    marginVertical: 8,
  },
  patientSidebar: {
    width: '30%',
    backgroundColor: 'white',
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    padding: 15,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  patientList: {
    flex: 1,
  },
  patientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  patientStatus: {
    fontSize: 12,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
    fontWeight: 600,
  },
  patientFee: {
    fontSize: 14,
    color: '#008080',
    fontFamily: 'Poppins-Medium',
  },
});

export default Overview;