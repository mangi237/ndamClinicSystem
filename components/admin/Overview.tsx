// components/admin/Overview.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LineChart, BarChart } from 'react-native-chart-kit';
import AppointmentList from '../medical/AppointmentList';
import AnimatedHeader from '../common/AnimateHeader';

const Overview = () => {
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalNurses: 0,
totalAppointments: 0,
    revenue: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch patients count
      const patientsSnapshot = await getDocs(collection(db, 'patients'));
      const totalPatients = patientsSnapshot.size;

      // Fetch staff counts
      const staffSnapshot = await getDocs(collection(db, 'users'));
      let totalDoctors = 0;
      let totalNurses = 0;
      
      const appointmentSnapshot = await getDocs(collection(db, 'appointments'));
      let totalAppointments = 0;
    appointmentSnapshot.forEach((doc) => {
      const appointmentData = doc.data();
      totalAppointments++;
    });
      staffSnapshot.forEach((doc) => {
        const staffData = doc.data();
        if (staffData.role === 'doctor') totalDoctors++;
        if (staffData.role === 'nurse') totalNurses++;
      });

      // For demo purposes, setting some sample data
      setStats({
        totalPatients,
        totalDoctors,
        totalNurses,
        totalAppointments,
        revenue: 12500,
      });
    } catch (error) {
      console.error('Error fetching stats: ', error);
    }
  };

  const screenWidth = Dimensions.get('window').width;

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [8000, 9500, 10200, 11000, 11900, 12500],
      },
    ],
  };

  const patientData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#27AE60',
    },
    barPercentage: 0.5,
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
    <ScrollView style={styles.container}>
      <AnimatedHeader />
      <Text style={styles.title}>Dashboard Overview</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={30} color="#2E86C1" />
          <Text style={styles.statNumber}>{stats.totalPatients}</Text>
          <Text style={styles.statLabel}>Total Patients</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="medical" size={30} color="#27AE60" />
          <Text style={styles.statNumber}>{stats.totalDoctors}</Text>
          <Text style={styles.statLabel}>Doctors</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="fitness" size={30} color="#8E44AD" />
          <Text style={styles.statNumber}>{stats.totalNurses}</Text>
          <Text style={styles.statLabel}>Nurses</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={30} color="#E67E22" />
          <Text style={styles.statNumber}>{stats.totalAppointments}</Text>
          <Text style={styles.statLabel}>Total Appointments</Text>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Revenue Trend</Text>
        <LineChart
          data={revenueData}
          width={screenWidth - 30}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withVerticalLines={true}
          withHorizontalLines={true}
          withInnerLines={true}
          withOuterLines={true}
          fromZero={true}
        />
      </View>
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Patient Visits This Week</Text>
        <BarChart
          data={patientData}
          width={screenWidth - 30}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=""
          showValuesOnTopOfBars={true}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          fromZero={true}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    fontFamily: 'Poppins-Bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#2C3E50',
    fontFamily: 'Poppins-SemiBold',
  },
  chart: {
    borderRadius: 10,
  },
});

export default Overview;