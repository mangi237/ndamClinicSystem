// App.js
import React, { useCallback, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './context/authContext';
import CategorySelection from './screens/categorySelection';
import LoginScreen from './screens/authentication/authScreen';
import AdminDashboard from './screens/admin/adminDashboard';
import DoctorDashboard from './screens/doctor/doctorDashboard';
// import NurseDashboard from './screens/nurse/NurseDashboard';
import LabTechDashboard from './screens/lab/LabTechDashboard';
import PharmacistDashboard from './screens/pharmacist/pharmacistDashboard';
import NurseDashboard  from './screens/nurse/nurseDashboard';
import PatientDetailsScreen from './screens/PatientDetailsScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('./assets/fonts/Poppins/Poppins-Regular.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/Poppins/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins/Poppins-Bold.ttf'),
  });

  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load any other resources here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  if (!appIsReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#27AE60' }}>
        <Text style={{ color: 'white', fontSize: 24, fontFamily: 'Poppins-Bold' }}>NDAM Clinic</Text>
        <Text style={{ color: 'white', fontSize: 16, marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator 
           id={undefined}
            initialRouteName="CategorySelection" 
            screenOptions={{ 
              headerShown: false,
              cardStyleInterpolator: ({ current, layouts }) => {
                return {
                  cardStyle: {
                    transform: [
                      {
                        translateX: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layouts.screen.width, 0],
                        }),
                      },
                    ],
                  },
                };
              },
            }}
          >
          <Stack.Screen name="CategorySelection" component={CategorySelection} />
  <Stack.Screen name="LoginScreen" component={LoginScreen} />
  <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
  <Stack.Screen name="DoctorDashboard" component={DoctorDashboard} />
  <Stack.Screen name="NurseDashboard" component={NurseDashboard} />
  <Stack.Screen name="LabTechDashboard" component={LabTechDashboard} />
  <Stack.Screen name="PharmacistDashboard" component={PharmacistDashboard} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </View>
  );
}