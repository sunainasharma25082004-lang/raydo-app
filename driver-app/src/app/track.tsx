import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { Colors } from '@/constants/Colors';
import { Navigation, Phone, Send } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://raydo-app-tqev.onrender.com';

export default function DriverTrackScreen() {
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  // Call & Chat States
  const [riderPhone, setRiderPhone] = useState<string>('+919876543211'); // Mock rider phone
  const [messages, setMessages] = useState<{id: string, text: string, sender: string}[]>([]);
  const [inputText, setInputText] = useState('');

  const DRIVER_ID = 'driver123';
  const RIDER_ID = 'rider123';

  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);
    
    newSocket.emit('join_driver', DRIVER_ID);

    newSocket.on('receive_chat_message', (data) => {
      setMessages(prev => [...prev, { id: Math.random().toString(), text: data.message, sender: data.senderRole }]);
    });

    return () => {
      newSocket.disconnect();
      if (locationSubscription) locationSubscription.remove();
    };
  }, [locationSubscription]);

  const startTracking = async () => {
    const services = await Location.hasServicesEnabledAsync();
    if (!services) {
      Alert.alert('Location off', 'Turn on GPS so your live location can be shared.');
      return;
    }
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Please go to your phone Settings -> Apps -> Expo Go -> Permissions and allow Location access.',
        [
          { text: 'Open settings', onPress: () => Linking.openSettings() },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    setIsTracking(true);
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 4000,
        distanceInterval: 8,
        mayShowUserSettingsDialog: true,
      },
      (newLoc) => {
        setLocation(newLoc);
        if (socket) {
          socket.emit('trip_location_update', {
            rideId: 'ride123',
            riderId: RIDER_ID,
            lat: newLoc.coords.latitude,
            lng: newLoc.coords.longitude,
          });
        }
      },
    );
    setLocationSubscription(sub);
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (locationSubscription) { locationSubscription.remove(); setLocationSubscription(null); }
  };

  const handleCall = () => { Linking.openURL(`tel:${riderPhone}`); };

  const handleSendChat = () => {
    if (!inputText.trim() || !socket) return;
    setMessages(prev => [...prev, { id: Math.random().toString(), text: inputText, sender: 'driver' }]);
    socket.emit('send_chat_message', { receiverId: RIDER_ID, message: inputText, senderId: DRIVER_ID, senderRole: 'driver' });
    setInputText('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Active Ride</Text>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Phone color="white" size={20} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, isTracking ? styles.buttonStop : styles.buttonStart]} onPress={isTracking ? stopTracking : startTracking}>
          <Text style={styles.buttonText}>{isTracking ? "STOP DRIVING" : "START DRIVING"}</Text>
        </TouchableOpacity>

        {/* Chat Interface */}
        <View style={styles.chatContainer}>
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            style={styles.chatList}
            renderItem={({item}) => (
              <View style={[styles.messageBubble, item.sender === 'driver' ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, item.sender === 'driver' ? styles.myMessageText : null]}>{item.text}</Text>
              </View>
            )}
          />
          <View style={styles.inputRow}>
            <TextInput style={styles.chatInput} value={inputText} onChangeText={setInputText} placeholder="Message rider..." />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendChat}>
              <Send color="white" size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, justifyContent: 'center' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, flex: 0.8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  callButton: { backgroundColor: '#25D366', padding: 12, borderRadius: 25 },
  button: { width: '100%', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginBottom: 20 },
  buttonStart: { backgroundColor: Colors.primary },
  buttonStop: { backgroundColor: '#ff4757' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  chatContainer: { flex: 1, backgroundColor: '#fafafa', borderRadius: 15, padding: 10 },
  chatList: { flex: 1, marginBottom: 10 },
  messageBubble: { padding: 10, borderRadius: 15, maxWidth: '80%', marginBottom: 8 },
  myMessage: { backgroundColor: Colors.accent, alignSelf: 'flex-end', borderBottomRightRadius: 0 },
  theirMessage: { backgroundColor: '#e0e0e0', alignSelf: 'flex-start', borderBottomLeftRadius: 0 },
  messageText: { color: '#333' },
  myMessageText: { color: 'white' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  chatInput: { flex: 1, backgroundColor: '#eee', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
  sendBtn: { backgroundColor: Colors.primary, padding: 12, borderRadius: 20 }
});
