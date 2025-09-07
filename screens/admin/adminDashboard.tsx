// // components/admin/AdminDashboard.tsx
// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Ionicons } from '@expo/vector-icons';
// import Overview from '../../components/admin/Overview';
// import ManageStaff from '../../components/admin/ManageStaff';
// import PatientList from '../../components/medical/PatientList';
// import PharmacyDashboard from '../../screens/pharmacist/pharmacistDashboard';
// import Analytics from '../../components/admin/Analatytics';

// const Tab = createBottomTabNavigator();

// const AdminDashboard: React.FC = () => {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName;

//           if (route.name === 'Overview') {
//             iconName = focused ? 'speedometer' : 'speedometer-outline';
//           } else if (route.name === 'Staff') {
//             iconName = focused ? 'people' : 'people-outline';
//           } else if (route.name === 'Patients') {
//             iconName = focused ? 'medical' : 'medical-outline';
//           } else if (route.name === 'Stock') {
//             iconName = focused ? 'cube' : 'cube-outline';
//           } else if (route.name === 'Analytics') {
//             iconName = focused ? 'stats-chart' : 'stats-chart-outline';
//           }

//           return <Ionicons name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: '#27AE60',
//         tabBarInactiveTintColor: 'gray',
//         headerStyle: {
//           backgroundColor: '#27AE60',
//         },
//         headerTintColor: 'white',
//         headerTitleStyle: {
//           fontFamily: 'Poppins-SemiBold',
//         },
//       })}
//     >
//       <Tab.Screen name="Overview" component={Overview} />
//       <Tab.Screen name="Staff" component={ManageStaff} />
//       <Tab.Screen name="Patients" component={PatientList} />
//       <Tab.Screen name="Stock" component={PharmacyDashboard} />
//       <Tab.Screen name="Analytics" component={Analytics} />
//     </Tab.Navigator>
//   );
// };

// export default AdminDashboard;

// components/admin/AdminDashboard.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Overview from '../../components/admin/Overview';
import ManageStaff from '../../components/admin/ManageStaff';
import PatientList from '../../components/medical/PatientList';
import PharmacyDashboard from '../../screens/pharmacist/pharmacistDashboard';
import Analytics from '../../components/admin/Analatytics';
import { useAuth } from '../../context/authContext';
import { User } from 'firebase/auth';
const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const { user } = useAuth();
 var currentUser = user  || null;
  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return <Overview />;
      case 'Staff':
        return <ManageStaff />;
      case 'Patients':
        return <PatientList />;
      case 'Stock':
        return <PharmacyDashboard />;
      case 'Analytics':
        return <Analytics />;
      default:
        return <Overview />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>PILEM LABS</Text>
          <Text style={styles.dashboardText}>Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.userButton}>
            <Ionicons name="person-circle-outline" size={32} color="#008080" />
            <Text style={styles.userName}>{currentUser.name}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Overview' && styles.activeTab]} 
          onPress={() => setActiveTab('Overview')}
        >
          <Text style={[styles.tabText, activeTab === 'Overview' && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Staff' && styles.activeTab]} 
          onPress={() => setActiveTab('Staff')}
        >
          <Text style={[styles.tabText, activeTab === 'Staff' && styles.activeTabText]}>Staff</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Patients' && styles.activeTab]} 
          onPress={() => setActiveTab('Patients')}
        >
          <Text style={[styles.tabText, activeTab === 'Patients' && styles.activeTabText]}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Stock' && styles.activeTab]} 
          onPress={() => setActiveTab('Stock')}
        >
          <Text style={[styles.tabText, activeTab === 'Stock' && styles.activeTabText]}>Stock</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Analytics' && styles.activeTab]} 
          onPress={() => setActiveTab('Analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'Analytics' && styles.activeTabText]}>Analytics</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#008080',
    fontFamily: 'Poppins-Bold',
  },
  dashboardText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  userName: {
    marginLeft: 8,
    color: '#008080',
    fontFamily: 'Poppins-Medium',
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 15,
    // flex:1,
  },
  tab: {
    paddingHorizontal: 20,
    // paddingVertical: 15,
    paddingTop: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#008080',
  },
  tabText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Medium',
  },
  activeTabText: {
    color: '#008080',
  },
  content: {
    // flex: 1,
  },
});

export default AdminDashboard;