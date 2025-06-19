import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import { authService, firestoreService } from '../services/firebaseConfig';
import emergencyService from '../services/emergencyService';
import { EmergencyContact } from '../types';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<any>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    relationship: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = authService.getCurrentUser();
      if (user) {
        const userInfo = await firestoreService.getUserData(user.uid);
        setUserData(userInfo);
        
        const contacts = await emergencyService.getEmergencyContacts(user.uid);
        setEmergencyContacts(contacts);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }
        }
      ]
    );
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phoneNumber) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }

    try {
      const user = authService.getCurrentUser();
      if (user) {
        await emergencyService.addEmergencyContact(user.uid, newContact);
        setNewContact({ name: '', phoneNumber: '', email: '', relationship: '' });
        setShowAddContact(false);
        loadUserData(); // Reload contacts
        Alert.alert('Success', 'Emergency contact added successfully');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      Alert.alert('Error', 'Failed to add emergency contact');
    }
  };

  const generateQRData = () => {
    if (!userData) return '';
    
    return JSON.stringify({
      userId: userData.uid,
      name: `${userData.firstName} ${userData.lastName}`,
      userType: userData.userType,
      timestamp: Date.now(),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Icon name="logout" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="person" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {userData?.firstName} {userData?.lastName}
            </Text>
            <Text style={styles.userEmail}>{userData?.email}</Text>
            <Text style={styles.userPhone}>{userData?.phoneNumber}</Text>
            <Text style={styles.userType}>
              Type: {userData?.userType?.charAt(0).toUpperCase() + userData?.userType?.slice(1)}
            </Text>
          </View>
        </View>

        {/* QR Code Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="qr-code" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>My QR Code</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Show this QR code to other users to start a safe trip
          </Text>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => setShowQRCode(true)}
          >
            <Icon name="qr-code-scanner" size={20} color="#FFFFFF" />
            <Text style={styles.qrButtonText}>Show QR Code</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Contacts Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="emergency" size={24} color="#FF3B30" />
            <Text style={styles.cardTitle}>Emergency Contacts</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddContact(true)}
            >
              <Icon name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardSubtitle}>
            These contacts will be notified in case of emergency
          </Text>
          
          {emergencyContacts.length === 0 ? (
            <Text style={styles.noContactsText}>No emergency contacts added yet</Text>
          ) : (
            emergencyContacts.map((contact, index) => (
              <View key={index} style={styles.contactItem}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                  <Text style={styles.contactRelation}>{contact.relationship}</Text>
                </View>
                <Icon name="phone" size={20} color="#34C759" />
              </View>
            ))
          )}
        </View>

        {/* Settings Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="settings" size={24} color="#7F8C8D" />
            <Text style={styles.cardTitle}>Settings</Text>
          </View>
          
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="location-on" size={20} color="#7F8C8D" />
            <Text style={styles.settingText}>Location Settings</Text>
            <Icon name="chevron-right" size={20} color="#7F8C8D" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="notifications" size={20} color="#7F8C8D" />
            <Text style={styles.settingText}>Notifications</Text>
            <Icon name="chevron-right" size={20} color="#7F8C8D" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="privacy-tip" size={20} color="#7F8C8D" />
            <Text style={styles.settingText}>Privacy Policy</Text>
            <Icon name="chevron-right" size={20} color="#7F8C8D" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRCode}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQRCode(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My QR Code</Text>
              <TouchableOpacity
                onPress={() => setShowQRCode(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#7F8C8D" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={generateQRData()}
                size={200}
                backgroundColor="white"
                color="black"
              />
            </View>
            
            <Text style={styles.qrInstructions}>
              Show this QR code to another HitchSafe user to start a trip
            </Text>
          </View>
        </View>
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        visible={showAddContact}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddContact(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Emergency Contact</Text>
              <TouchableOpacity
                onPress={() => setShowAddContact(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#7F8C8D" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={newContact.name}
              onChangeText={(text) => setNewContact(prev => ({ ...prev, name: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              value={newContact.phoneNumber}
              onChangeText={(text) => setNewContact(prev => ({ ...prev, phoneNumber: text }))}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Email (optional)"
              value={newContact.email}
              onChangeText={(text) => setNewContact(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Relationship (e.g., Family, Friend)"
              value={newContact.relationship}
              onChangeText={(text) => setNewContact(prev => ({ ...prev, relationship: text }))}
            />

            <TouchableOpacity
              style={styles.addContactButton}
              onPress={handleAddContact}
            >
              <Text style={styles.addContactButtonText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
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
  signOutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
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
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  userInfo: {
    marginTop: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
  },
  userEmail: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 4,
  },
  userPhone: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 4,
  },
  userType: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '500',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  qrButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noContactsText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  contactPhone: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  contactRelation: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  settingText: {
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 12,
    flex: 1,
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
  qrModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#7F8C8D',
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
  addContactButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addContactButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ProfileScreen; 