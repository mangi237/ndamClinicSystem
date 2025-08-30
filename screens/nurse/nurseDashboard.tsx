import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PatientList from '../../components/medical/PatientList';
import PatientTabsScreen from '../PatientTabsScreen';

const Stack = createStackNavigator();

const NurseDashboard: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="PatientList" 
      component={PatientList} 
      options={{ title: 'Patient List', headerShown: true }}
    />
    <Stack.Screen 
      name="PatientDetails" 
      component={PatientTabsScreen}
      options={{ title: 'Patient Details', headerShown: false }}
    />
  </Stack.Navigator>
);

export default NurseDashboard;