// components/admin/Analytics.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Patient,  } from '../../types/Patient';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    revenue: 0,
    averageWaitTime: 0,
    staffCount: 0,
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch patients count
      const patientsSnapshot = await getDocs(collection(db, 'patients'));
      const totalPatients = patientsSnapshot.size;

      // Fetch staff count
      const staffSnapshot = await getDocs(collection(db, 'users'));
      const staffCount = staffSnapshot.size;

      // Fetch appointments
      const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
      const totalAppointments = appointmentsSnapshot.size;
      const completedAppointments = appointmentsSnapshot.docs.filter(
        doc => doc.data().status === 'completed'
      ).length;

      // For demo purposes - in a real app, you'd calculate these from actual data
      const revenue = 12500 + (Math.random() * 5000);
      const averageWaitTime = 15 + (Math.random() * 30);

      setStats({
        totalPatients,
        totalAppointments,
        completedAppointments,
        revenue,
        averageWaitTime,
        staffCount,
      });
    } catch (error) {
      console.error('Error fetching analytics data: ', error);
    }
  };

  const screenWidth = Dimensions.get('window').width;

  // Sample data for charts
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

  const appointmentData = {
    labels: ['Scheduled', 'Completed', 'Cancelled'],
    datasets: [
      {
        data: [35, 28, 7],
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

  const pieChartConfig = {
    color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <View style={styles.timeRangeSelector}>
          <TouchableOpacity 
            style={[styles.timeRangeButton, timeRange === 'week' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('week')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'week' && styles.timeRangeTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeRangeButton, timeRange === 'month' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('month')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'month' && styles.timeRangeTextActive]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeRangeButton, timeRange === 'year' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('year')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'year' && styles.timeRangeTextActive]}>Year</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Ionicons name="people" size={24} color="#2E86C1" />
          <Text style={styles.metricValue}>{stats.totalPatients}</Text>
          <Text style={styles.metricLabel}>Total Patients</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="calendar" size={24} color="#27AE60" />
          <Text style={styles.metricValue}>{stats.totalAppointments}</Text>
          <Text style={styles.metricLabel}>Appointments</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="cash" size={24} color="#E67E22" />
          <Text style={styles.metricValue}>${stats.revenue.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Revenue</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="time" size={24} color="#8E44AD" />
          <Text style={styles.metricValue}>{Math.round(stats.averageWaitTime)}m</Text>
          <Text style={styles.metricLabel}>Avg Wait Time</Text>
        </View>
      </View>

      {/* Appointment Success Rate */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Appointment Status</Text>
        <View style={styles.successRateContainer}>
          <View style={styles.successRate}>
            <Text style={styles.successRateValue}>
              {calculatePercentage(stats.completedAppointments, stats.totalAppointments)}%
            </Text>
            <Text style={styles.successRateLabel}>Completion Rate</Text>
          </View>
          <View style={styles.successRateDetails}>
            <View style={styles.successRateItem}>
              <View style={[styles.statusIndicator, styles.scheduled]} />
              <Text style={styles.successRateText}>
                Scheduled: {stats.totalAppointments - stats.completedAppointments}
              </Text>
            </View>
            <View style={styles.successRateItem}>
              <View style={[styles.statusIndicator, styles.completed]} />
              <Text style={styles.successRateText}>
                Completed: {stats.completedAppointments}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Revenue Chart */}
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
          yAxisLabel="$"
          yAxisSuffix=""
        />
      </View>

      {/* Patient Visits Chart */}
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

      {/* Staff Distribution */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Staff Distribution</Text>
        <View style={styles.staffStats}>
          <View style={styles.staffStatItem}>
            <Ionicons name="medical" size={20} color="#27AE60" />
            <Text style={styles.staffStatText}>Doctors: {Math.round(stats.staffCount * 0.4)}</Text>
          </View>
          <View style={styles.staffStatItem}>
            <Ionicons name="fitness" size={20} color="#8E44AD" />
            <Text style={styles.staffStatText}>Nurses: {Math.round(stats.staffCount * 0.3)}</Text>
          </View>
          <View style={styles.staffStatItem}>
            <Ionicons name="flask" size={20} color="#2E86C1" />
            <Text style={styles.staffStatText}>Lab Techs: {Math.round(stats.staffCount * 0.1)}</Text>
          </View>
          <View style={styles.staffStatItem}>
            <Ionicons name="bag" size={20} color="#E67E22" />
            <Text style={styles.staffStatText}>Pharmacists: {Math.round(stats.staffCount * 0.1)}</Text>
          </View>
          <View style={styles.staffStatItem}>
            <Ionicons name="person" size={20} color="#7F8C8D" />
            <Text style={styles.staffStatText}>Admins: {Math.round(stats.staffCount * 0.1)}</Text>
          </View>
        </View>
      </View>

      {/* Department Performance */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Department Performance</Text>
        <View style={styles.performanceContainer}>
          {[
            { name: 'Cardiology', efficiency: 92, patients: 45 },
            { name: 'Pediatrics', efficiency: 88, patients: 38 },
            { name: 'Orthopedics', efficiency: 95, patients: 52 },
            { name: 'Neurology', efficiency: 85, patients: 29 },
            { name: 'Emergency', efficiency: 78, patients: 67 },
          ].map((dept, index) => (
            <View key={index} style={styles.performanceItem}>
              <View style={styles.performanceHeader}>
                <Text style={styles.performanceName}>{dept.name}</Text>
                <Text style={styles.performanceValue}>{dept.efficiency}%</Text>
              </View>
              <View style={styles.performanceBar}>
                <View 
                  style={[
                    styles.performanceBarFill,
                    { width: `${dept.efficiency}%`, backgroundColor: getDepartmentColor(index) }
                  ]} 
                />
              </View>
              <Text style={styles.performancePatients}>{dept.patients} patients</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const getDepartmentColor = (index: number) => {
  const colors = ['#27AE60', '#2E86C1', '#8E44AD', '#E67E22', '#E74C3C'];
  return colors[index % colors.length];
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
    fontFamily: 'Poppins-Bold',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#ECF0F1',
    borderRadius: 8,
    padding: 4,
  },
  timeRangeButton: {
    padding: 8,
    borderRadius: 6,
  },
  timeRangeButtonActive: {
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timeRangeText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
  },
  timeRangeTextActive: {
    color: '#2C3E50',
    fontFamily: 'Poppins-Medium',
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
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
  },
  metricLabel: {
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
  successRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successRate: {
    alignItems: 'center',
  },
  successRateValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#27AE60',
    fontFamily: 'Poppins-Bold',
  },
  successRateLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
  },
  successRateDetails: {
    flex: 1,
    marginLeft: 20,
  },
  successRateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  scheduled: {
    backgroundColor: '#3498DB',
  },
  completed: {
    backgroundColor: '#27AE60',
  },
  successRateText: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'Poppins-Regular',
  },
  staffStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  staffStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
  },
  staffStatText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'Poppins-Regular',
  },
  performanceContainer: {
    marginTop: 10,
  },
  performanceItem: {
    marginBottom: 15,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  performanceName: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'Poppins-Medium',
  },
  performanceValue: {
    fontSize: 14,
    color: '#27AE60',
    fontFamily: 'Poppins-Medium',
  },
  performanceBar: {
    height: 8,
    backgroundColor: '#ECF0F1',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  performancePatients: {
    fontSize: 12,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
  },
});

export default Analytics;