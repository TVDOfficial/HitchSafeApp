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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card, Button, Title, Paragraph } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import emergencyService from '../services/emergencyService';
import { authService } from '../services/firebaseConfig';

const EmergencyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [isRecording, setIsRecording] = useState(false);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const [loading, setLoading] = useState(false);

  const { tripId, userId } = route.params || {};

  useEffect(() => {
    // Check if emergency is already active
    setIsRecording(emergencyService.getRecordingStatus());
  }, []);

  const handleEmergencyAlert = async () => {
    if (emergencyTriggered) {
      Alert.alert('Emergency Already Active', 'Emergency alert has already been sent.');
      return;
    }

    Alert.alert(
      '🚨 EMERGENCY ALERT',
      'This will immediately notify your emergency contacts, start recording, and share your location. Are you sure?',
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
      setLoading(true);
      const user = authService.getCurrentUser();
      
      if (user) {
        await emergencyService.triggerEmergency(
          tripId || 'emergency_' + Date.now(),
          user.uid,
          'EMERGENCY: I need immediate help!'
        );
        
        setEmergencyTriggered(true);
        setIsRecording(true);
        
        Alert.alert(
          'Emergency Alert Sent',
          'Your emergency contacts have been notified. Stay safe!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Emergency trigger error:', error);
      Alert.alert('Error', 'Failed to send emergency alert. Please call 911 directly.');
    } finally {
      setLoading(false);
    }
  };

  const handleCall911 = () => {
    emergencyService.callEmergencyServices();
  };

  const handleStopRecording = async () => {
    try {
      await emergencyService.stopEmergencyRecording();
      setIsRecording(false);
      Alert.alert('Recording Stopped', 'Emergency recording has been stopped.');
    } catch (error) {
      console.error('Stop recording error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Emergency Status */}
        <Card style={[styles.card, emergencyTriggered && styles.emergencyCard]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.statusContainer}>
              <MaterialIcons 
                name="warning" 
                size={48} 
                color={emergencyTriggered ? "#FFFFFF" : "#FF3B30"} 
              />
              <Title style={[styles.title, emergencyTriggered && styles.emergencyTitle]}>
                {emergencyTriggered ? 'EMERGENCY ACTIVE' : 'Emergency Alert'}
              </Title>
            </View>
            
            <Paragraph style={[styles.description, emergencyTriggered && styles.emergencyDescription]}>
              {emergencyTriggered 
                ? 'Emergency contacts have been notified. Help is on the way.'
                : 'Trigger an emergency alert to notify your trusted contacts immediately.'
              }
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Recording Status */}
        {isRecording && (
          <Card style={styles.recordingCard}>
            <Card.Content>
              <View style={styles.recordingContainer}>
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording Audio</Text>
                </View>
                <Paragraph style={styles.recordingDescription}>
                  Audio is being recorded for safety purposes
                </Paragraph>
                <Button
                  mode="outlined"
                  onPress={handleStopRecording}
                  style={styles.stopButton}
                  labelStyle={styles.stopButtonText}
                >
                  Stop Recording
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!emergencyTriggered ? (
            <Button
              mode="contained"
              onPress={handleEmergencyAlert}
              style={styles.emergencyButton}
              labelStyle={styles.emergencyButtonText}
              loading={loading}
              disabled={loading}
              icon={() => <MaterialIcons name="warning" size={24} color="#FFFFFF" />}
            >
              {loading ? 'Sending...' : 'SEND SOS ALERT'}
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={() => Alert.alert('Emergency Active', 'Emergency has already been triggered.')}
              style={styles.activeButton}
              labelStyle={styles.activeButtonText}
              icon={() => <MaterialIcons name="check" size={24} color="#FFFFFF" />}
            >
              SOS SENT
            </Button>
          )}

          <Button
            mode="outlined"
            onPress={handleCall911}
            style={styles.call911Button}
            labelStyle={styles.call911ButtonText}
            icon={() => <MaterialIcons name="phone" size={20} color="#FF3B30" />}
          >
            Call 911
          </Button>
        </View>

        {/* Instructions */}
        <Card style={styles.instructionsCard}>
          <Card.Content>
            <Title style={styles.instructionsTitle}>Emergency Features</Title>
            <View style={styles.feature}>
              <MaterialIcons name="location-on" size={20} color="#007AFF" />
              <Text style={styles.featureText}>Live location shared with contacts</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="mic" size={20} color="#007AFF" />
              <Text style={styles.featureText}>Audio recording for evidence</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="message" size={20} color="#007AFF" />
              <Text style={styles.featureText}>SMS/Email alerts sent automatically</Text>
            </View>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginBottom: 20,
  },
  emergencyCard: {
    backgroundColor: '#FF3B30',
  },
  cardContent: {
    alignItems: 'center',
    padding: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 12,
    textAlign: 'center',
  },
  emergencyTitle: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
  },
  emergencyDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  recordingCard: {
    backgroundColor: '#34C759',
    marginBottom: 20,
  },
  recordingContainer: {
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordingDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  stopButton: {
    borderColor: '#FFFFFF',
  },
  stopButtonText: {
    color: '#FFFFFF',
  },
  actionContainer: {
    marginBottom: 20,
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    marginBottom: 12,
    paddingVertical: 8,
  },
  emergencyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activeButton: {
    backgroundColor: '#34C759',
    marginBottom: 12,
    paddingVertical: 8,
  },
  activeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  call911Button: {
    borderColor: '#FF3B30',
    paddingVertical: 8,
  },
  call911ButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsCard: {
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 12,
  },
});

export default EmergencyScreen; 