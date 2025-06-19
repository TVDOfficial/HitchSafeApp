import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, StyleSheet, Alert } from 'react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TripScreen from './src/screens/TripScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import EmergencyScreen from './src/screens/EmergencyScreen';

// Import services
import { initializeFirebase } from './src/services/firebaseConfig';
import { requestPermissions } from './src/services/permissionService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom theme for HitchSafe
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007AFF',
    accent: '#34C759',
    surface: '#FFFFFF',
    background: '#F8F9FA',
    error: '#FF3B30',
  },
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Trip') {
            iconName = 'directions-car';
          } else if (route.name === 'Scanner') {
            iconName = 'qr-code-scanner';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Trip" component={TripScreen} />
      <Tab.Screen name="Scanner" component={QRScannerScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Initialize Firebase
    initializeFirebase();
    
    // Request necessary permissions
    requestPermissions();

    // Auth state listener
    const subscriber = auth().onAuthStateChanged((user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return subscriber; // unsubscribe on unmount
  }, [initializing]);

  if (initializing) return null;

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {user ? (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen 
                name="Emergency" 
                component={EmergencyScreen}
                options={{
                  presentation: 'modal',
                  headerShown: true,
                  title: 'Emergency',
                  headerStyle: { backgroundColor: '#FF3B30' },
                  headerTintColor: '#FFFFFF',
                }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App; 