// screens/lab/LabTechDashboard.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import PatientList from '../../components/medical/PatientList';
import PatientDetailsScreen from '../../screens/PatientDetailsScreen';
import LabTestModal from '../../components/lab/LabTestModal';

const Stack = createStackNavigator();

const LabTechDashboard = () => {
  return (
    <Stack.Navigator
    id={undefined}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Patients') {
            iconName = focused ? 'people' : 'people-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8E44AD', // Purple color for lab
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#8E44AD',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontFamily: 'Poppins-SemiBold',
        },
      })}
    >
      <Stack.Screen 
        name="PatientList" 
        component={PatientList} 
        options={{
          title: 'Patient List - Lab Technician',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="PatientDetails" 
        component={PatientDetailsScreen}
        options={{
          title: 'Patient Details',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="LabTest" 
        component={LabTestModal}
        options={{
          title: 'Lab Test',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default LabTechDashboard;