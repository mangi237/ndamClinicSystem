// screens/doctor/DoctorDashboard.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import PatientList from '../../components/medical/PatientList';
import PatientHistory from '../../components/medical/PatientHistory';
import Appointments from '../../components/medical/Appointments';
import Medications from '../../components/medical/Medications';

const Tab = createBottomTabNavigator();

const DoctorDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Patients') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Appointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Medications') {
            iconName = focused ? 'medical' : 'medical-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E86C1',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#2E86C1',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontFamily: 'Poppins-SemiBold',
        },
      })}
    >
      <Tab.Screen name="Patients" component={PatientList} />
      <Tab.Screen name="History" component={PatientHistory} />
      <Tab.Screen name="Appointments" component={Appointments} />
      <Tab.Screen name="Medications" component={Medications} />
    </Tab.Navigator>
  );
};

export default DoctorDashboard;