import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { request, PERMISSIONS, RESULTS, check } from 'react-native-permissions';

export const requestPermissions = async () => {
  try {
    if (Platform.OS === 'android') {
      // Android permissions
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      console.log('Android permissions:', granted);
      return granted;
    } else {
      // iOS permissions
      const locationPermission = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      const cameraPermission = await request(PERMISSIONS.IOS.CAMERA);
      const microphonePermission = await request(PERMISSIONS.IOS.MICROPHONE);
      const contactsPermission = await request(PERMISSIONS.IOS.CONTACTS);

      console.log('iOS permissions:', {
        location: locationPermission,
        camera: cameraPermission,
        microphone: microphonePermission,
        contacts: contactsPermission,
      });

      return {
        location: locationPermission,
        camera: cameraPermission,
        microphone: microphonePermission,
        contacts: contactsPermission,
      };
    }
  } catch (error) {
    console.error('Permission request error:', error);
    Alert.alert(
      'Permission Error',
      'Failed to request permissions. Some features may not work properly.',
    );
    return null;
  }
};

export const checkLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted;
    } else {
      const result = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return result === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Location permission check error:', error);
    return false;
  }
};

export const checkCameraPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      return granted;
    } else {
      const result = await check(PERMISSIONS.IOS.CAMERA);
      return result === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Camera permission check error:', error);
    return false;
  }
};

export const checkMicrophonePermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      return granted;
    } else {
      const result = await check(PERMISSIONS.IOS.MICROPHONE);
      return result === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Microphone permission check error:', error);
    return false;
  }
};

export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'HitchSafe needs access to your location for safety tracking.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return result === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Location permission request error:', error);
    return false;
  }
};

export const requestCameraPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'HitchSafe needs access to your camera to scan QR codes and take photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const result = await request(PERMISSIONS.IOS.CAMERA);
      return result === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Camera permission request error:', error);
    return false;
  }
};

export const requestMicrophonePermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'HitchSafe needs access to your microphone for emergency recordings.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const result = await request(PERMISSIONS.IOS.MICROPHONE);
      return result === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Microphone permission request error:', error);
    return false;
  }
}; 