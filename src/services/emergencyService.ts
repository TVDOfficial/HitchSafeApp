import { Alert, Linking } from 'react-native';
import { firestoreService } from './firebaseConfig';
import { requestMicrophonePermission } from './permissionService';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import locationService from './locationService';
import PushNotification from 'react-native-push-notification';

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  relationship: string;
}

export interface EmergencyData {
  tripId: string;
  userId: string;
  location: any;
  timestamp: number;
  audioRecordingUrl?: string;
  message: string;
  type: 'hitchhiker' | 'driver';
}

class EmergencyService {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private isRecording: boolean = false;
  private recordingPath: string = '';

  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
  }

  // Trigger emergency alert
  triggerEmergency = async (tripId: string, userId: string, message: string = 'Emergency Alert!'): Promise<void> => {
    try {
      console.log('Emergency triggered!');
      
      // Get current location
      const location = await locationService.getCurrentLocation();
      
      // Create emergency data
      const emergencyData: EmergencyData = {
        tripId,
        userId,
        location,
        timestamp: Date.now(),
        message,
        type: 'hitchhiker', // This should be determined based on user role
      };

      // Start audio recording
      await this.startEmergencyRecording();

      // Update trip with emergency status
      await firestoreService.triggerEmergency(tripId, emergencyData);

      // Get emergency contacts
      const contacts = await firestoreService.getEmergencyContacts(userId);

      // Send alerts to emergency contacts
      await this.sendEmergencyAlerts(contacts, emergencyData);

      // Show local notification
      this.showEmergencyNotification();

      // Send push notifications if needed
      await this.sendPushNotifications(contacts, emergencyData);

    } catch (error) {
      console.error('Emergency trigger error:', error);
      Alert.alert('Emergency Error', 'Failed to trigger emergency alert. Please try again or call 911 directly.');
    }
  };

  // Start emergency audio recording
  private startEmergencyRecording = async (): Promise<void> => {
    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        console.log('Microphone permission denied');
        return;
      }

      this.recordingPath = `emergency_recording_${Date.now()}.mp4`;
      
      const result = await this.audioRecorderPlayer.startRecorder(this.recordingPath);
      this.isRecording = true;
      console.log('Emergency recording started:', result);

      // Auto-stop recording after 5 minutes for privacy
      setTimeout(() => {
        if (this.isRecording) {
          this.stopEmergencyRecording();
        }
      }, 300000); // 5 minutes

    } catch (error) {
      console.error('Recording start error:', error);
    }
  };

  // Stop emergency audio recording
  stopEmergencyRecording = async (): Promise<string | null> => {
    try {
      if (!this.isRecording) return null;

      const result = await this.audioRecorderPlayer.stopRecorder();
      this.isRecording = false;
      console.log('Emergency recording stopped:', result);
      
      // TODO: Upload recording to Firebase Storage
      // const downloadUrl = await this.uploadRecording(result);
      
      return result;
    } catch (error) {
      console.error('Recording stop error:', error);
      return null;
    }
  };

  // Send emergency alerts to contacts
  private sendEmergencyAlerts = async (contacts: EmergencyContact[], emergencyData: EmergencyData): Promise<void> => {
    for (const contact of contacts) {
      try {
        // Create tracking link
        const trackingLink = this.generateTrackingLink(emergencyData.tripId);
        
        // Send SMS
        await this.sendEmergencySMS(contact.phoneNumber, emergencyData, trackingLink);
        
        // Send email if available
        if (contact.email) {
          await this.sendEmergencyEmail(contact.email, emergencyData, trackingLink);
        }
      } catch (error) {
        console.error(`Error sending alert to ${contact.name}:`, error);
      }
    }
  };

  // Send emergency SMS
  private sendEmergencySMS = async (phoneNumber: string, emergencyData: EmergencyData, trackingLink: string): Promise<void> => {
    try {
      const message = `🚨 EMERGENCY ALERT 🚨\n\n${emergencyData.message}\n\nLocation: ${emergencyData.location.latitude}, ${emergencyData.location.longitude}\n\nTrack live location: ${trackingLink}\n\nTime: ${new Date(emergencyData.timestamp).toLocaleString()}\n\nThis is an automated emergency alert from HitchSafe.`;
      
      const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('SMS sending error:', error);
    }
  };

  // Send emergency email
  private sendEmergencyEmail = async (email: string, emergencyData: EmergencyData, trackingLink: string): Promise<void> => {
    try {
      const subject = '🚨 Emergency Alert - HitchSafe';
      const body = `EMERGENCY ALERT\n\n${emergencyData.message}\n\nLocation: ${emergencyData.location.latitude}, ${emergencyData.location.longitude}\n\nTrack live location: ${trackingLink}\n\nTime: ${new Date(emergencyData.timestamp).toLocaleString()}\n\nThis is an automated emergency alert from HitchSafe app.`;
      
      const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Email sending error:', error);
    }
  };

  // Generate tracking link
  private generateTrackingLink = (tripId: string): string => {
    // This would be your web app URL for tracking
    return `https://hitchsafe.app/track/${tripId}`;
  };

  // Show local emergency notification
  private showEmergencyNotification = (): void => {
    PushNotification.localNotification({
      title: '🚨 Emergency Alert Sent',
      message: 'Emergency contacts have been notified. Stay safe!',
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
    });
  };

  // Send push notifications
  private sendPushNotifications = async (contacts: EmergencyContact[], emergencyData: EmergencyData): Promise<void> => {
    // TODO: Implement push notification sending via Firebase Cloud Messaging
    // This would require a backend service to send notifications
    console.log('Push notifications would be sent here');
  };

  // Add emergency contact
  addEmergencyContact = async (userId: string, contact: Omit<EmergencyContact, 'id'>): Promise<string> => {
    try {
      const contactId = await firestoreService.addEmergencyContact(userId, contact);
      return contactId;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw error;
    }
  };

  // Get emergency contacts
  getEmergencyContacts = async (userId: string): Promise<EmergencyContact[]> => {
    try {
      return await firestoreService.getEmergencyContacts(userId);
    } catch (error) {
      console.error('Error getting emergency contacts:', error);
      throw error;
    }
  };

  // Check if currently recording
  getRecordingStatus = (): boolean => {
    return this.isRecording;
  };

  // Emergency call to 911
  callEmergencyServices = async (): Promise<void> => {
    try {
      Alert.alert(
        'Call Emergency Services',
        'Do you want to call 911?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call 911',
            style: 'destructive',
            onPress: async () => {
              const url = 'tel:911';
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                await Linking.openURL(url);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Emergency call error:', error);
    }
  };
}

export default new EmergencyService(); 