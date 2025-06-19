# HitchSafe App

A comprehensive mobile safety app for hitchhikers and drivers, built with React Native and Firebase.

## Features

### 🚗 For Drivers & Hitchhikers
- **QR Code Scanning**: Instantly verify and connect with other users
- **Real-time Location Tracking**: Continuous GPS monitoring during trips
- **Emergency SOS System**: One-tap emergency alerts to trusted contacts
- **Audio Recording**: Automatic emergency recording when SOS is triggered
- **Manual Entry**: Support for users without the app (photo + details)

### 🛡️ Safety Features
- **Emergency Contacts**: Add trusted contacts for automatic alerts
- **Live Location Sharing**: Share real-time location with emergency contacts
- **Emergency Recording**: Audio recording during emergencies
- **911 Integration**: Direct emergency services calling
- **Trip History**: Complete record of all trips for safety

### 📱 App Features
- **User Authentication**: Secure Firebase authentication
- **Profile Management**: Manage personal information and emergency contacts
- **Map Integration**: Mapbox-powered maps with real-time tracking
- **Push Notifications**: Emergency alerts and trip updates
- **Cross-Platform**: Available for both iOS and Android

## Technology Stack

- **Frontend**: React Native with TypeScript
- **Backend**: Firebase (Firestore, Authentication, Storage, Messaging)
- **Maps**: Mapbox GL Native
- **Real-time Location**: React Native Geolocation
- **QR Codes**: React Native QR Code Scanner
- **Audio Recording**: React Native Audio Recorder Player
- **Permissions**: React Native Permissions
- **Navigation**: React Navigation 6

## Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **iOS Setup** (macOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Configure Firebase**
   - Create Firebase project
   - Add `google-services.json` to `android/app/`
   - Add `GoogleService-Info.plist` to iOS project

4. **Set Mapbox Token**
   - Get token from Mapbox.com
   - Replace `YOUR_MAPBOX_ACCESS_TOKEN` in HomeScreen.tsx

5. **Run the app**
   ```bash
   # Android
   npx react-native run-android
   
   # iOS
   npx react-native run-ios
   ```

## Core Functionality

### Trip Flow
1. User scans QR code or enters details manually
2. Real-time location tracking begins
3. Emergency SOS button available
4. Trip ends when both users confirm safety

### Emergency System
1. SOS button triggers emergency protocol
2. Current location captured
3. Audio recording starts automatically
4. Emergency contacts receive SMS/email alerts
5. Live tracking link shared
6. 911 calling option available

## App Structure

```
src/
├── screens/           # Main app screens
├── services/          # Firebase & core services
├── components/        # Reusable UI components
├── types/            # TypeScript definitions
└── utils/            # Helper functions
```

## Security & Privacy

- Location data only stored during active trips
- Emergency recordings encrypted
- Firebase security rules protect user data
- Users can delete their data anytime

## Permissions Required

**Android**: Location, Camera, Microphone, Contacts, SMS
**iOS**: Location, Camera, Microphone, Contacts

## Important Notes

- Replace Firebase config with your own project
- Add your Mapbox access token
- Test emergency features thoroughly
- This enhances safety but doesn't replace proper precautions
- Always call 911 directly in real emergencies

## License

MIT License - See LICENSE file for details. 