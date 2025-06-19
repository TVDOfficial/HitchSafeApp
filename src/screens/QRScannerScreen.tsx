import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { authService, firestoreService } from '../services/firebaseConfig';
import locationService from '../services/locationService';
import { requestCameraPermission } from '../services/permissionService';

const QRScannerScreen = () => {
  const navigation = useNavigation();
  const [scanning, setScanning] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [manualData, setManualData] = useState({
    name: '',
    phoneNumber: '',
    licenseNumber: '',
  });
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera permission to scan QR codes.',
        [
          { text: 'Cancel', onPress: () => navigation.goBack() },
          { text: 'Settings', onPress: () => {/* Open settings */} }
        ]
      );
    }
  };

  const onSuccess = async (e: any) => {
    try {
      setScanning(false);
      const qrData = JSON.parse(e.data);
      
      if (qrData.userId && qrData.name) {
        await startTripWithUser(qrData);
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not from HitchSafe app.');
        setScanning(true);
      }
    } catch (error) {
      console.error('QR Scan error:', error);
      Alert.alert('Invalid QR Code', 'Unable to read QR code data.');
      setScanning(true);
    }
  };

  const startTripWithUser = async (qrData: any) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return;

      const location = await locationService.getCurrentLocation();
      
      const tripData = {
        driver: currentUser.uid.includes('driver') ? {
          uid: currentUser.uid,
          name: `${currentUser.displayName}`,
          qrCode: 'current_user_qr',
        } : undefined,
        hitchhiker: !currentUser.uid.includes('driver') ? {
          uid: currentUser.uid,
          name: `${currentUser.displayName}`,
          qrCode: 'current_user_qr',
        } : undefined,
        [currentUser.uid.includes('driver') ? 'hitchhiker' : 'driver']: {
          uid: qrData.userId,
          name: qrData.name,
          qrCode: qrData.qrCode || 'scanned_qr',
        },
        startLocation: location,
        currentLocation: location,
        status: 'active',
        isEmergency: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const tripId = await firestoreService.createTrip(tripData);
      
      // Start location tracking
      locationService.startTracking(tripId);
      
      // Update user's current trip
      await firestoreService.updateUserData(currentUser.uid, {
        currentTrip: tripId,
      });

      Alert.alert(
        'Trip Started',
        `Trip started with ${qrData.name}. Location tracking is now active.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Trip' as never) }]
      );
    } catch (error) {
      console.error('Trip start error:', error);
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    }
  };

  const handleManualEntry = async () => {
    if (!manualData.name) {
      Alert.alert('Error', 'Please enter the person\'s name.');
      return;
    }

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return;

      const location = await locationService.getCurrentLocation();
      
      const tripData = {
        [currentUser.uid.includes('driver') ? 'driver' : 'hitchhiker']: {
          uid: currentUser.uid,
          name: `${currentUser.displayName}`,
          qrCode: 'current_user_qr',
        },
        nonAppUser: {
          name: manualData.name,
          phoneNumber: manualData.phoneNumber,
          licensePhoto: capturedPhoto || '',
        },
        startLocation: location,
        currentLocation: location,
        status: 'active',
        isEmergency: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const tripId = await firestoreService.createTrip(tripData);
      
      // Start location tracking
      locationService.startTracking(tripId);
      
      // Update user's current trip
      await firestoreService.updateUserData(currentUser.uid, {
        currentTrip: tripId,
      });

      Alert.alert(
        'Trip Started',
        `Trip started with ${manualData.name}. Location tracking is now active.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Trip' as never) }]
      );
    } catch (error) {
      console.error('Manual trip start error:', error);
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    }
  };

  const capturePhoto = (camera: any) => {
    const options = { quality: 0.5, base64: true };
    camera.takePictureAsync(options)
      .then((data: any) => {
        setCapturedPhoto(data.uri);
        setShowPhotoCapture(false);
      })
      .catch((err: any) => console.error('Photo capture error:', err));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Start New Trip</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Scanner View */}
      <View style={styles.scannerContainer}>
        {scanning ? (
          <QRCodeScanner
            onRead={onSuccess}
            flashMode={RNCamera.Constants.FlashMode.auto}
            topContent={
              <Text style={styles.centerText}>
                Scan the other person's QR code to start a safe trip
              </Text>
            }
            bottomContent={
              <View style={styles.bottomContent}>
                <TouchableOpacity
                  style={styles.manualButton}
                  onPress={() => setShowManualEntry(true)}
                >
                  <Icon name="edit" size={20} color="#007AFF" />
                  <Text style={styles.manualButtonText}>Enter Manually</Text>
                </TouchableOpacity>
              </View>
            }
            cameraStyle={styles.camera}
            topViewStyle={styles.topView}
            bottomViewStyle={styles.bottomView}
          />
        ) : (
          <View style={styles.processingContainer}>
            <Icon name="hourglass-empty" size={48} color="#007AFF" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualEntry(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Details Manually</Text>
              <TouchableOpacity
                onPress={() => setShowManualEntry(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#7F8C8D" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              If the other person doesn't have the app, enter their details manually
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={manualData.name}
              onChangeText={(text) => setManualData(prev => ({ ...prev, name: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number (optional)"
              value={manualData.phoneNumber}
              onChangeText={(text) => setManualData(prev => ({ ...prev, phoneNumber: text }))}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => setShowPhotoCapture(true)}
            >
              <Icon name="camera-alt" size={20} color="#007AFF" />
              <Text style={styles.photoButtonText}>
                {capturedPhoto ? 'Photo Captured' : 'Take Photo of License/ID'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.startTripButton}
              onPress={handleManualEntry}
            >
              <Text style={styles.startTripButtonText}>Start Trip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Photo Capture Modal */}
      <Modal
        visible={showPhotoCapture}
        animationType="slide"
        onRequestClose={() => setShowPhotoCapture(false)}
      >
        <RNCamera
          style={styles.camera}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.auto}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
        >
          {({ camera, status }) => {
            if (status !== 'READY') return <View />;
            return (
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  onPress={() => setShowPhotoCapture(false)}
                  style={styles.cameraCloseButton}
                >
                  <Icon name="close" size={30} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => capturePhoto(camera)}
                  style={styles.captureButton}
                >
                  <Icon name="camera" size={40} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            );
          }}
        </RNCamera>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#007AFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  topView: {
    flex: 0,
    backgroundColor: 'transparent',
  },
  bottomView: {
    flex: 0,
    backgroundColor: 'transparent',
  },
  centerText: {
    fontSize: 18,
    padding: 32,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bottomContent: {
    padding: 20,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  manualButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  processingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  photoButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  startTripButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startTripButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraControls: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 40,
  },
  cameraCloseButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 10,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
});

export default QRScannerScreen; 