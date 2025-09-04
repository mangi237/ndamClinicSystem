import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PatientList from '../../components/medical/PatientList';
import PatientDetailsScreen from '../PatientDetailsScreen';
import AnimatedHeader from '../../components/common/AnimateHeader';
import VitalsMonitoring from '../../components/nurse/vitalMonitoring';

const Stack = createStackNavigator();

const ReceptionistDashboard = () => {
  return (
    <>
    <AnimatedHeader />
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2E86C1' },
        headerTintColor: 'white',
        headerTitleStyle: { fontFamily: 'Poppins-SemiBold' },
      }}
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
    </>
    
  );
};

export default ReceptionistDashboard;