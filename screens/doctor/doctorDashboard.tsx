// screens/doctor/DoctorDashboard.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import PatientList from '../../components/medical/PatientList';
import PatientDetailsScreen from '../../screens/PatientDetailsScreen';

const Stack = createStackNavigator();

const DoctorDashboard = () => {
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
      <Stack.Screen 
        name="PatientList" 
        component={PatientList} 
        options={{
          title: 'Patient List',
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
    </Stack.Navigator>
  );
};

export default DoctorDashboard;