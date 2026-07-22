import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { Colors } from '@/constants/Colors';
import { MapPin, Navigation, Phone, Send } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.31.254:5000';

export default function TrackScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<{latitude: number, longitude: number}[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Call & Chat States
  const [driverPhone, setDriverPhone] = useState<string>('+919876543210'); // Mock driver phone
  const [messages, setMessages] = useState<{id: string, text: string, sender: string}[]>([]);
  const [inputText, setInputText] = useState('');

  const RIDER_ID = 'rider123';
  const DRIVER_ID = 'driver123'; // In real app, this comes from ride details

  useEffect(() => {
    let active = true;
    let newSocket: Socket | null = null;

    (async () => {
      const services = await Location.hasServicesEnabledAsync();
      if (!services) {
        Alert.alert('Location off', 'Turn on GPS / Location services for live tracking.', [
          { text: 'Open settings', onPress: () => Linking.openSettings() },
          { text: 'OK' },
        ]);
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Allow location access so we can show your actual position on the map.',
          [
            { text: 'Open settings', onPress: () => Linking.openSettings() },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });
      if (!active) return;
      setLocation(currentLocation);

      newSocket = io(API_URL);
      setSocket(newSocket);

      newSocket.emit('join_rider', RIDER_ID);

      newSocket.on('live_tracking_update', (data: { lat: number; lng: number }) => {
        setDriverLocation(data);
        fetchEtaAndRoute(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          data.lat,
          data.lng,
        );
      });

      newSocket.on('receive_chat_message', (data) => {
        setMessages((prev) => [
          ...prev,
          { id: Math.random().toString(), text: data.message, sender: data.senderRole },
        ]);
      });
    })();

    return () => {
      active = false;
      newSocket?.disconnect();
    };
  }, []);

  const fetchEtaAndRoute = async (rLat: number, rLng: number, dLat: number, dLng: number) => {
    try {
      const waypoints = `${dLat},${dLng}|${rLat},${rLng}`;
      const response = await axios.get(`${API_URL}/api/map/routing?waypoints=${waypoints}`);
      
      if (response.data?.features?.length > 0) {
        const feature = response.data.features[0];
        setEta(`${Math.ceil(feature.properties.time / 60)} min`);
        if (feature.geometry?.coordinates) {
          setRouteCoords(feature.geometry.coordinates[0].map((c: number[]) => ({ latitude: c[1], longitude: c[0] })));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${driverPhone}`);
  };

  const handleSendChat = () => {
    if (!inputText.trim() || !socket) return;
    
    // Optimistic UI update
    setMessages(prev => [...prev, { id: Math.random().toString(), text: inputText, sender: 'rider' }]);
    
    socket.emit('send_chat_message', {
      receiverId: DRIVER_ID,
      message: inputText,
      senderId: RIDER_ID,
      senderRole: 'rider'
    });
    setInputText('');
  };

  if (!location) return <View style={styles.loadingContainer}><Text>Fetching location...</Text></View>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <MapView style={styles.map}
        initialRegion={{ latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      >
        <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }} title="You">
          <View style={styles.riderMarker}><MapPin color="white" size={20} /></View>
        </Marker>
        {driverLocation && (
          <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }} title="Driver">
            <View style={styles.driverMarker}><Navigation color="white" size={20} /></View>
          </Marker>
        )}
        {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeColor={Colors.accent} strokeWidth={4} />}
      </MapView>

      <View style={styles.bottomSheet}>
        <View style={styles.infoRow}>
          <View>
            <Text style={styles.statusText}>Driver is on the way</Text>
            {eta && <Text style={styles.etaText}>Arriving in {eta}</Text>}
          </View>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Phone color="white" size={24} />
          </TouchableOpacity>
        </View>

        {/* Chat Interface */}
        <View style={styles.chatContainer}>
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            style={styles.chatList}
            renderItem={({item}) => (
              <View style={[styles.messageBubble, item.sender === 'rider' ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, item.sender === 'rider' ? styles.myMessageText : null]}>{item.text}</Text>
              </View>
            )}
          />
          <View style={styles.inputRow}>
            <TextInput style={styles.chatInput} value={inputText} onChangeText={setInputText} placeholder="Message driver..." />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendChat}>
              <Send color="white" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1 },
  riderMarker: { backgroundColor: Colors.primary, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white' },
  driverMarker: { backgroundColor: Colors.accent, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white' },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15 },
  statusText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  etaText: { fontSize: 20, fontWeight: '900', color: Colors.primary, marginTop: 5 },
  callButton: { backgroundColor: '#25D366', padding: 15, borderRadius: 30 },
  chatContainer: { flex: 1 },
  chatList: { flex: 1, marginBottom: 10 },
  messageBubble: { padding: 10, borderRadius: 15, maxWidth: '80%', marginBottom: 8 },
  myMessage: { backgroundColor: Colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 0 },
  theirMessage: { backgroundColor: '#f0f0f0', alignSelf: 'flex-start', borderBottomLeftRadius: 0 },
  messageText: { color: '#333' },
  myMessageText: { color: 'white' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  chatInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
  sendBtn: { backgroundColor: Colors.accent, padding: 10, borderRadius: 20 }
});
