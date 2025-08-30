import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/Navigation';
import PatientDetailsScreen from './PatientDetailsScreen';
// import VitalsList from '../components/nurse/VitalList';
// import VitalsMonitoring from '../components/nurse/vitalMonitoring';
import Appointments from '../components/medical/Appointments';
import Ionicons from 'react-native-vector-icons/Ionicons';
import VitalsMonitoring from '../components/nurse/vitalMonitoring';
import AppointmentList from '../components/medical/AppointmentList';
import MedicationList from '../components/medical/MedicationList';

type PatientTabsScreenRouteProp = RouteProp<RootStackParamList, 'PatientDetails'>;

interface PatientTabsScreenProps {
  route: PatientTabsScreenRouteProp;
}

const Tab = createBottomTabNavigator();

const PatientTabsScreen: React.FC<PatientTabsScreenProps> = ({ route }) => {
  const { patient } = route.params;

  return (
    <Tab.Navigator

      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'person';
          if (route.name === 'Details') iconName = 'person';
          if (route.name === 'VitalsMonitoring') iconName = 'pulse';
          if (route.name === 'Medications') iconName = 'medkit';
          if (route.name === 'Appointments') iconName = 'calendar';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Details"
        children={() => <PatientDetailsScreen patient={patient} />}
        options={{ tabBarLabel: 'Details' }}
      />
      <Tab.Screen
        name="VitalsMonitoring"
        children={() => <VitalsMonitoring patientId={patient.id} />}
        options={{ tabBarLabel: 'Vitals Monitoring' }}
      />
      <Tab.Screen
        name="Medications"
        children={() => <MedicationList patientId={patient.id} />}
        options={{ tabBarLabel: 'Medications' }}
      />
      <Tab.Screen
        name="Appointments"
        children={() => <AppointmentList patientId={patient.id} />}
        options={{ tabBarLabel: 'Appointments' }}
      />
    </Tab.Navigator>
  );
};

export default PatientTabsScreen;