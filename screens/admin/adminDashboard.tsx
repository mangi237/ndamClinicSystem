// screens/admin/AdminDashboard.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Overview from '../../components/admin/Overview';
import ManageStaff from '../../components/admin/ManageStaff';
import Analytics from '../../components/admin/Analatytics';

const Tab = createBottomTabNavigator();

const AdminDashboard : React.FC= () => {
  return (
    <Tab.Navigator
    id={undefined}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Overview') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'Staff') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#27AE60',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#27AE60',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontFamily: 'Poppins-SemiBold',
        },
      })}
    >
      <Tab.Screen name="Overview" component={Overview} />
      <Tab.Screen name="Staff" component={ManageStaff} />
      <Tab.Screen name="Analytics" component={Analytics} />
    </Tab.Navigator>
  );
};

export default AdminDashboard;