import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapboxGL from '@react-native-mapbox-gl/maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { authService, firestoreService } from '../services/firebaseConfig';
import locationService from '../services/locationService';
import emergencyService from '../services/emergencyService';
import { LocationData } from '../types';

// Set Mapbox access token (replace with your actual token)
MapboxGL.setAccessToken('YOUR_MAPBOX_ACCESS_TOKEN');

const HomeScreen = () => {
  const navigation = useNavigation();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [currentTrip, setCurrentTrip] = useState<any>(null);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      const user = authService.getCurrentUser();
      if (user) {
        const userInfo = await firestoreService.getUserData(user.uid);
        setUserData(userInfo);
        
        // Get current location
        const location = await locationService.getCurrentLocation();
        setCurrentLocation(location);
        
        // Check if user has an active trip
        if (userInfo?.currentTrip) {
          // Load current trip data
          console.log('User has active trip:', userInfo.currentTrip);
        }
      }
    } catch (error) {
      console.error('Error initializing home screen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = () => {
    navigation.navigate('Scanner' as never);
  };

  const handleEmergency = async () => {
    try {
      const user = authService.getCurrentUser();
      if (user && currentTrip) {
        await emergencyService.triggerEmergency(
          currentTrip.id,
          user.uid,
          'Emergency assistance needed!'
        );
      } else {
        Alert.alert(
          'No Active Trip',
          'You need to start a trip before using emergency features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Start Trip', onPress: handleStartTrip }
          ]
        );
      }
    } catch (error) {
      console.error('Emergency error:', error);
      Alert.alert('Error', 'Failed to trigger emergency alert. Please try calling 911 directly.');
    }
  };

  const handleCall911 = () => {
    emergencyService.callEmergencyServices();
  };

  const renderStatusCard = () => {
    if (currentTrip) {
      return (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Icon name="directions-car" size={24} color="#007AFF" />
            <Text style={styles.statusTitle}>Trip Active</Text>
          </View>
          <Text style={styles.statusText}>
            {currentTrip.type === 'driver' ? 'Driving a hitchhiker' : 'Currently hitchhiking'}
          </Text>
          <View style={styles.statusActions}>
            <TouchableOpacity
              style={styles.endTripButton}
              onPress={() => {/* Handle end trip */}}
            >
              <Text style={styles.endTripButtonText}>End Trip</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Icon name="security" size={24} color="#34C759" />
            <Text style={styles.statusTitle}>Ready to Travel</Text>
          </View>
          <Text style={styles.statusText}>
            Start a new trip to enable safety tracking
          </Text>
          <TouchableOpacity
            style={styles.startTripButton}
            onPress={handleStartTrip}
          >
            <Icon name="qr-code-scanner" size={20} color="#FFFFFF" />
            <Text style={styles.startTripButtonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userData?.firstName || 'User'}!</Text>
          <Text style={styles.subGreeting}>Stay safe on your journey</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Icon name="person" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapboxGL.MapView
            style={styles.map}
            zoomLevel={14}
            centerCoordinate={[currentLocation.longitude, currentLocation.latitude]}
          >
            <MapboxGL.Camera
              zoomLevel={14}
              centerCoordinate={[currentLocation.longitude, currentLocation.latitude]}
            />
            <MapboxGL.PointAnnotation
              id="currentLocation"
              coordinate={[currentLocation.longitude, currentLocation.latitude]}
            >
              <View style={styles.userLocationMarker}>
                <Icon name="my-location" size={20} color="#FFFFFF" />
              </View>
            </MapboxGL.PointAnnotation>
          </MapboxGL.MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Icon name="location-off" size={48} color="#7F8C8D" />
            <Text style={styles.mapPlaceholderText}>Location not available</Text>
          </View>
        )}
      </View>

      {/* Status Card */}
      {renderStatusCard()}

      {/* Emergency Buttons */}
      <View style={styles.emergencyContainer}>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergency}
        >
          <LinearGradient
            colors={['#FF3B30', '#D70015']}
            style={styles.emergencyGradient}
          >
            <Icon name="warning" size={28} color="#FFFFFF" />
            <Text style={styles.emergencyButtonText}>SOS</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.call911Button}
          onPress={handleCall911}
        >
          <Icon name="phone" size={20} color="#FF3B30" />
          <Text style={styles.call911ButtonText}>Call 911</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  subGreeting: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E1E8ED',
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
  },
  userLocationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  statusActions: {
    flexDirection: 'row',
  },
  startTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  startTripButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  endTripButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 10,
    flex: 1,
  },
  endTripButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emergencyContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    alignItems: 'center',
  },
  emergencyButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  emergencyGradient: {
    flex: 1,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  call911Button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF3B30',
    flex: 1,
    justifyContent: 'center',
  },
  call911ButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HomeScreen; 