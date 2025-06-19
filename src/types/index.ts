export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: 'hitchhiker' | 'driver' | 'both';
  profilePicture?: string;
  qrCode: string;
  emergencyContacts: EmergencyContact[];
  isActive: boolean;
  currentTrip?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Trip {
  id: string;
  driver?: {
    uid: string;
    name: string;
    qrCode: string;
  };
  hitchhiker?: {
    uid: string;
    name: string;
    qrCode: string;
  };
  nonAppUser?: {
    name: string;
    licensePhoto: string;
    phoneNumber?: string;
  };
  startLocation: LocationData;
  currentLocation: LocationData;
  endLocation?: LocationData;
  status: 'active' | 'completed' | 'emergency';
  isEmergency: boolean;
  emergencyData?: EmergencyData;
  createdAt: number;
  updatedAt: number;
  endedAt?: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

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
  location: LocationData;
  timestamp: number;
  audioRecordingUrl?: string;
  message: string;
  type: 'hitchhiker' | 'driver';
}

export interface QRCodeData {
  userId: string;
  name: string;
  userType: 'hitchhiker' | 'driver';
  timestamp: number;
}

export interface AppState {
  user: User | null;
  currentTrip: Trip | null;
  isLoading: boolean;
  isTracking: boolean;
  isEmergency: boolean;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  Emergency: {
    tripId: string;
    userId: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Trip: undefined;
  Scanner: undefined;
  Profile: undefined;
};

// Component Props
export interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: any;
  textStyle?: any;
  disabled?: boolean;
  loading?: boolean;
}

export interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  style?: any;
}

export interface MapProps {
  location: LocationData;
  showUserLocation?: boolean;
  onLocationChange?: (location: LocationData) => void;
}

export interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export interface EmergencyButtonProps {
  onPress: () => void;
  isActive?: boolean;
  size?: 'small' | 'medium' | 'large';
} 