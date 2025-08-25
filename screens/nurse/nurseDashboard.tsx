// screens/nurse/NurseDashboard.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import PatientList from '../../components/medical/PatientList';
import PatientHistory from '../../components/medical/PatientHistory';
import Appointments from '../../components/medical/Appointments';
import Medications from '../../components/medical/Medications';
import VitalsMonitoring from '../../components/nurse/VitalsMonitoring';

const Tab = createBottomTabNavigator();

const NurseDashboard = () => {
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
          } else if (route.name === 'Vitals') {
            iconName = focused ? 'pulse' : 'pulse-outline';
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
        tabBarStyle: {
          paddingVertical: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Poppins-Regular',
        },
      })}
    >
      <Tab.Screen 
        name="Patients" 
        component={PatientList} 
        options={{
          title: 'Patient List',
        }}
      />
      <Tab.Screen 
        name="Vitals" 
        component={VitalsMonitoring} 
        options={{
          title: 'Vitals Monitoring',
        }}
      />
      <Tab.Screen 
        name="Appointments" 
        component={Appointments} 
        options={{
          title: 'Appointments',
        }}
      />
      <Tab.Screen 
        name="Medications" 
        component={Medications} 
        options={{
          title: 'Medications',
        }}
      />
      <Tab.Screen 
        name="History" 
        component={PatientHistory} 
        options={{
          title: 'Patient History',
        }}
      />
    </Tab.Navigator>
  );
};

export default NurseDashboard;