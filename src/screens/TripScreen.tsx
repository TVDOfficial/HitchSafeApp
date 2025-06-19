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
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { authService, firestoreService } from '../services/firebaseConfig';
import locationService from '../services/locationService';
import emergencyService from '../services/emergencyService';
import { LocationData, Trip } from '../types';

const TripScreen = () => {
  const navigation = useNavigation();
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    loadTripData();
    const interval = setInterval(updateLocation, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadTripData = async () => {
    try {
      const user = authService.getCurrentUser();
      if (user) {
        const userData = await firestoreService.getUserData(user.uid);
        if (userData?.currentTrip) {
          // Load trip data from Firestore
          console.log('Loading trip:', userData.currentTrip);
          // This would normally fetch trip data from Firestore
          setCurrentTrip({
            id: userData.currentTrip,
            driver: { uid: 'driver1', name: 'John Doe', qrCode: 'qr1' },
            hitchhiker: { uid: 'hiker1', name: 'Jane Smith', qrCode: 'qr2' },
            startLocation: { latitude: 40.7128, longitude: -74.0060, accuracy: 10, timestamp: Date.now() },
            currentLocation: { latitude: 40.7128, longitude: -74.0060, accuracy: 10, timestamp: Date.now() },
            status: 'active',
            isEmergency: false,
            createdAt: Date.now() - 300000, // 5 minutes ago
            updatedAt: Date.now(),
          } as Trip);
        }
      }
    } catch (error) {
      console.error('Error loading trip data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleEmergency = async () => {
    Alert.alert(
      '🚨 Emergency Alert',
      'This will immediately notify your emergency contacts and start recording. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND SOS',
          style: 'destructive',
          onPress: triggerEmergency
        }
      ]
    );
  };

  const triggerEmergency = async () => {
    try {
      const user = authService.getCurrentUser();
      if (user && currentTrip) {
        setIsRecording(true);
        await emergencyService.triggerEmergency(
          currentTrip.id,
          user.uid,
          'EMERGENCY: I need immediate help!'
        );
        Alert.alert(
          'Emergency Alert Sent',
          'Your emergency contacts have been notified and recording has started.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Emergency trigger error:', error);
      Alert.alert('Error', 'Failed to send emergency alert. Please call 911 directly.');
      setIsRecording(false);
    }
  };

  const handleEndTrip = () => {
    Alert.alert(
      'End Trip',
      'Are you safe and ready to end this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          onPress: endTrip
        }
      ]
    );
  };

  const endTrip = async () => {
    try {
      const user = authService.getCurrentUser();
      if (user && currentTrip) {
        // Stop location tracking
        locationService.stopTracking();
        
        // Stop recording if active
        if (isRecording) {
          await emergencyService.stopEmergencyRecording();
          setIsRecording(false);
        }

        // Update trip status
        await firestoreService.endTrip(currentTrip.id, {
          endLocation: currentLocation,
          safeArrival: true,
        });

        // Update user's current trip
        await firestoreService.updateUserData(user.uid, {
          currentTrip: null,
        });

        Alert.alert(
          'Trip Ended',
          'Trip has been successfully ended. Stay safe!',
          [{ text: 'OK', onPress: () => navigation.navigate('Home' as never) }]
        );
      }
    } catch (error) {
      console.error('Error ending trip:', error);
      Alert.alert('Error', 'Failed to end trip. Please try again.');
    }
  };

  const formatDuration = (startTime: number) => {
    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getUserRole = () => {
    const user = authService.getCurrentUser();
    if (!user || !currentTrip) return 'unknown';
    
    if (currentTrip.driver?.uid === user.uid) return 'driver';
    if (currentTrip.hitchhiker?.uid === user.uid) return 'hitchhiker';
    return 'unknown';
  };

  const getOtherUser = () => {
    const role = getUserRole();
    if (role === 'driver') return currentTrip?.hitchhiker;
    if (role === 'hitchhiker') return currentTrip?.driver;
    return currentTrip?.nonAppUser;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading trip...</Text>
      </View>
    );
  }

  if (!currentTrip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noTripContainer}>
          <Icon name="directions-car" size={64} color="#E1E8ED" />
          <Text style={styles.noTripTitle}>No Active Trip</Text>
          <Text style={styles.noTripText}>
            Start a new trip from the Home screen to enable tracking and safety features.
          </Text>
          <TouchableOpacity
            style={styles.startTripButton}
            onPress={() => navigation.navigate('Home' as never)}
          >
            <Text style={styles.startTripButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const otherUser = getOtherUser();
  const userRole = getUserRole();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Active Trip</Text>
        <View style={styles.statusIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>LIVE</Text>
        </View>
      </View>

      {/* Trip Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="person" size={24} color="#007AFF" />
          <Text style={styles.cardTitle}>
            {userRole === 'driver' ? 'Driving' : 'Hitchhiking with'}
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{otherUser?.name || 'Unknown'}</Text>
          {otherUser?.phoneNumber && (
            <Text style={styles.userPhone}>{otherUser.phoneNumber}</Text>
          )}
        </View>

        <View style={styles.tripStats}>
          <View style={styles.statItem}>
            <Icon name="schedule" size={20} color="#7F8C8D" />
            <Text style={styles.statText}>
              {formatDuration(currentTrip.createdAt)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="location-on" size={20} color="#34C759" />
            <Text style={styles.statText}>Tracking</Text>
          </View>
        </View>
      </View>

      {/* Emergency Status */}
      {currentTrip.isEmergency && (
        <View style={styles.emergencyCard}>
          <Icon name="warning" size={24} color="#FF3B30" />
          <Text style={styles.emergencyText}>EMERGENCY MODE ACTIVE</Text>
          <Text style={styles.emergencySubtext}>
            Emergency contacts have been notified
          </Text>
        </View>
      )}

      {/* Recording Status */}
      {isRecording && (
        <View style={styles.recordingCard}>
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording Audio</Text>
          </View>
          <Text style={styles.recordingSubtext}>
            Audio is being recorded for safety purposes
          </Text>
        </View>
      )}

      {/* Location Info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="my-location" size={24} color="#34C759" />
          <Text style={styles.cardTitle}>Current Location</Text>
        </View>
        
        {currentLocation ? (
          <View style={styles.locationInfo}>
            <Text style={styles.coordinates}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.accuracy}>
              Accuracy: ±{Math.round(currentLocation.accuracy)}m
            </Text>
          </View>
        ) : (
          <Text style={styles.noLocationText}>Getting location...</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {/* Emergency Button */}
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergency}
        >
          <LinearGradient
            colors={['#FF3B30', '#D70015']}
            style={styles.emergencyGradient}
          >
            <Icon name="warning" size={32} color="#FFFFFF" />
            <Text style={styles.emergencyButtonText}>SOS</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Call 911 Button */}
        <TouchableOpacity
          style={styles.call911Button}
          onPress={() => emergencyService.callEmergencyServices()}
        >
          <Icon name="phone" size={20} color="#FF3B30" />
          <Text style={styles.call911ButtonText}>Call 911</Text>
        </TouchableOpacity>
      </View>

      {/* End Trip Button */}
      <TouchableOpacity
        style={styles.endTripButton}
        onPress={handleEndTrip}
      >
        <Text style={styles.endTripButtonText}>End Trip Safely</Text>
      </TouchableOpacity>
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
  noTripContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noTripTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 12,
  },
  noTripText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  startTripButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startTripButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 0,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 12,
  },
  userInfo: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
  },
  userPhone: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 4,
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 6,
    fontWeight: '500',
  },
  emergencyCard: {
    backgroundColor: '#FF3B30',
    margin: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  emergencySubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  recordingCard: {
    backgroundColor: '#34C759',
    margin: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  locationInfo: {
    marginTop: 8,
  },
  coordinates: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  accuracy: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  noLocationText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
  },
  emergencyButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 20,
  },
  emergencyGradient: {
    flex: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  endTripButton: {
    backgroundColor: '#34C759',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  endTripButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TripScreen; 