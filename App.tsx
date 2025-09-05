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
import DoctorDashboard from './screens/doctor/ReceptionistDashboard';
// import NurseDashboard from './screens/nurse/NurseDashboard';
import LabDashboard from './screens/lab/LabDashboard';
import PharmacistDashboard from './screens/pharmacist/pharmacistDashboard';
// import NurseDashboard  from './screens/nurse/nurseDashboard';
import PatientDetailsScreen from './screens/PatientDetailsScreen';
import PortalSelection from './screens/authentication/PortalSelection';
import ReceptionistDashboard from './screens/doctor/ReceptionistDashboard';
import CashierDashboard from './screens/cashier/CashierDashboard';
import AnalyzerDashboard from './screens/Analyzer/AnalyzerDashboard';
import PatientLogin from './screens/authentication/PatientLogin';
import PatientDetailsViewScreen from './screens/Patient/PatientDashboard';
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#013220' }}>
        
        <Text style={{ color: 'white', fontSize: 24, fontFamily: 'Poppins-Bold' }}>PILEM LABS</Text>
        <Text style={{ color: 'white', fontSize: 16, marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator 
          //  id={undefined}
            initialRouteName="PortalSelection" 
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
            <Stack.Screen name = "PortalSelection" component={ PortalSelection} />
          <Stack.Screen name="CategorySelection" component={CategorySelection} />
  <Stack.Screen name="LoginScreen" component={LoginScreen} />
  <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
  <Stack.Screen name="ReceptionistDashboard" component={ReceptionistDashboard} />
  <Stack.Screen name ="AnalyzerDashboard" component={AnalyzerDashboard} />
  {/* <Stack.Screen name="NurseDashboard" component={NurseDashboard} /> */}
  <Stack.Screen name="LabDashboard" component={LabDashboard} />
  <Stack.Screen name="CashierDashboard" component={CashierDashboard} />
    <Stack.Screen name="PatientLogin" component={PatientLogin} />
  <Stack.Screen name="PharmacistDashboard" component={PharmacistDashboard} />
   <Stack.Screen 
    name="PatientDetails" 
    component={PatientDetailsScreen}
    options={{ 
      title: 'Patient Details',
      headerShown: true // Show header for this screen
    }}
  />
  <Stack.Screen 
  name="PatientDetailsView" 
  component={PatientDetailsViewScreen}
  options={{ title: 'My Medical Records' }}
/>

          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </View>
  );

}