import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';

// Firebase Collections
export const COLLECTIONS = {
  USERS: 'users',
  TRIPS: 'trips',
  EMERGENCY_CONTACTS: 'emergency_contacts',
  RECORDINGS: 'recordings',
  REPORTS: 'reports',
};

// Initialize Firebase services
export const initializeFirebase = async () => {
  try {
    // Request permission for push notifications
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }

    // Get FCM token
    const fcmToken = await messaging().getToken();
    console.log('FCM Token:', fcmToken);
    
    return fcmToken;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
};

// Auth service
export const authService = {
  signUp: async (email: string, password: string, userData: any) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Store additional user data in Firestore
      await firestore().collection(COLLECTIONS.USERS).doc(user.uid).set({
        ...userData,
        email: user.email,
        uid: user.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
        isActive: true,
        currentTrip: null,
      });
      
      return user;
    } catch (error) {
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  signOut: async () => {
    try {
      await auth().signOut();
    } catch (error) {
      throw error;
    }
  },

  getCurrentUser: () => {
    return auth().currentUser;
  },
};

// Firestore service
export const firestoreService = {
  // User operations
  getUserData: async (uid: string) => {
    try {
      const doc = await firestore().collection(COLLECTIONS.USERS).doc(uid).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      throw error;
    }
  },

  updateUserData: async (uid: string, data: any) => {
    try {
      await firestore().collection(COLLECTIONS.USERS).doc(uid).update({
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Trip operations
  createTrip: async (tripData: any) => {
    try {
      const tripRef = await firestore().collection(COLLECTIONS.TRIPS).add({
        ...tripData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        status: 'active',
        isEmergency: false,
      });
      return tripRef.id;
    } catch (error) {
      throw error;
    }
  },

  updateTripLocation: async (tripId: string, locationData: any) => {
    try {
      await firestore().collection(COLLECTIONS.TRIPS).doc(tripId).update({
        currentLocation: locationData,
        lastLocationUpdate: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  endTrip: async (tripId: string, endData: any) => {
    try {
      await firestore().collection(COLLECTIONS.TRIPS).doc(tripId).update({
        ...endData,
        status: 'completed',
        endedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Emergency operations
  triggerEmergency: async (tripId: string, emergencyData: any) => {
    try {
      await firestore().collection(COLLECTIONS.TRIPS).doc(tripId).update({
        isEmergency: true,
        emergencyTriggeredAt: firestore.FieldValue.serverTimestamp(),
        emergencyData,
      });
    } catch (error) {
      throw error;
    }
  },

  // Emergency contacts
  addEmergencyContact: async (userId: string, contactData: any) => {
    try {
      const contactRef = await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .collection(COLLECTIONS.EMERGENCY_CONTACTS)
        .add({
          ...contactData,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      return contactRef.id;
    } catch (error) {
      throw error;
    }
  },

  getEmergencyContacts: async (userId: string) => {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .collection(COLLECTIONS.EMERGENCY_CONTACTS)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw error;
    }
  },
};

export default {
  auth,
  firestore,
  storage,
  messaging,
}; 