// components/admin/Analytics.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BarChart, LineChart } from 'react-native-chart-kit';

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
      const patientsSnapshot = await getDocs(collection(db, 'patients'));
      const totalPatients = patientsSnapshot.size;

      const staffSnapshot = await getDocs(collection(db, 'users'));
      const staffCount = staffSnapshot.size;

      const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
      const totalAppointments = appointmentsSnapshot.size;
      const completedAppointments = appointmentsSnapshot.docs.filter(
        doc => doc.data().status === 'completed'
      ).length;

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
  const screenHeight = Dimensions.get('window').height;
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

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <View style={{height: screenHeight}}>
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
          <View style={styles.metricIcon}>
            <Ionicons name="people" size={24} color="#008080" />
          </View>
          <Text style={styles.metricValue}>{stats.totalPatients}</Text>
          <Text style={styles.metricLabel}>Total Patients</Text>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Ionicons name="male" size={24} color="#008080" />
          </View>
          <Text style={styles.metricValue}>{stats.staffCount}</Text>
          <Text style={styles.metricLabel}>Total Staffs</Text>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Ionicons name="cash" size={24} color="#008080" />
          </View>
          <Text style={styles.metricValue}>${stats.revenue.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Revenue</Text>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Ionicons name="time" size={24} color="#008080" />
          </View>
          <Text style={styles.metricValue}>{Math.round(stats.averageWaitTime)}m</Text>
          <Text style={styles.metricLabel}>Avg Wait Time</Text>
        </View>
      </View>

      {/* Revenue Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Revenue Trend</Text>
        <View style={styles.chartFilterContainer}>
          {['All', 'Week', 'Month', 'Year'].map((item) => (
            <TouchableOpacity key={item} style={styles.filterButton}>
              <Text style={styles.filterButtonText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <LineChart
          data={revenueData}
          width={screenWidth - 40}
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
        <View style={styles.chartFilterContainer}>
          {['All', 'Week', 'Month', 'Year'].map((item) => (
            <TouchableOpacity key={item} style={styles.filterButton}>
              <Text style={styles.filterButtonText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <BarChart
          data={patientData}
          width={screenWidth - 40}
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

      {/* Appointment Success Rate */}
   
    </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexGrow: 1,
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
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
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
    marginVertical: 8,
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
    color: '#008080',
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
    backgroundColor: '#008080',
  },
  successRateText: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'Poppins-Regular',
  },
});

export default Analytics;