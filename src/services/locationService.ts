import Geolocation from '@react-native-community/geolocation';
import { firestoreService } from './firebaseConfig';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

class LocationService {
  private watchId: number | null = null;
  private currentTripId: string | null = null;
  private isTracking: boolean = false;

  // Start location tracking
  startTracking = (tripId: string) => {
    this.currentTripId = tripId;
    this.isTracking = true;
    
    // Configure Geolocation
    Geolocation.getCurrentPosition(
      (position) => {
        console.log('Initial position:', position);
        this.updateLocation(position);
      },
      (error) => {
        console.error('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    // Start watching position
    this.watchId = Geolocation.watchPosition(
      (position) => {
        if (this.isTracking && this.currentTripId) {
          this.updateLocation(position);
        }
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Update every 5 seconds
        fastestInterval: 2000, // Fastest update interval
      }
    );
  };

  // Stop location tracking
  stopTracking = () => {
    this.isTracking = false;
    this.currentTripId = null;
    
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  };

  // Update location in Firebase
  private updateLocation = async (position: any) => {
    if (!this.currentTripId) return;

    try {
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        speed: position.coords.speed,
        heading: position.coords.heading,
        timestamp: position.timestamp,
      };

      await firestoreService.updateTripLocation(this.currentTripId, locationData);
      console.log('Location updated:', locationData);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  // Get current position once
  getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
          };
          resolve(locationData);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  };

  // Calculate distance between two points
  calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in kilometers
    return d;
  };

  // Get tracking status
  getTrackingStatus = () => {
    return {
      isTracking: this.isTracking,
      currentTripId: this.currentTripId,
      watchId: this.watchId,
    };
  };
}

export default new LocationService(); 