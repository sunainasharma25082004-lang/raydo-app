import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://raydo-app-tqev.onrender.com';

export default function RequestsScreen() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingRide, setIncomingRide] = useState<any>(null);

  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    // Mock driver connect
    newSocket.emit('join_driver', 'driver123');

    newSocket.on('new_ride_request', (data) => {
      console.log('New ride request received:', data);
      setIncomingRide(data.ride);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const acceptRide = async () => {
    if (!incomingRide) return;
    
    try {
      // In a real app, this calls the backend accept route with Auth
      // const response = await axios.post(`${API_URL}/api/rides/${incomingRide._id}/accept`, {}, { headers: { Authorization: 'Bearer driver_token' }});
      
      // For MVP without auth, we simulate success
      Alert.alert('Ride Accepted!', 'You are now assigned to this ride.');
      router.push('/track');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not accept ride');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Rides</Text>
      
      {!incomingRide ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Searching for nearby passengers...</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.locations}>
            <Text style={styles.locText}>📍 Pickup: {incomingRide.pickupLocation?.address}</Text>
            <Text style={styles.locText}>🏁 Dropoff: {incomingRide.dropoffLocation?.address}</Text>
          </View>
          
          <View style={styles.details}>
            <Text style={styles.detailText}>🚗 {incomingRide.vehicleType}</Text>
            <Text style={styles.detailText}>📏 {incomingRide.distance} km</Text>
            <Text style={styles.fareText}>₹{incomingRide.fare}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={acceptRide}>
            <Text style={styles.buttonText}>ACCEPT RIDE</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#888'
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  locations: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15
  },
  locText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333'
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  detailText: {
    fontSize: 16,
    color: '#555'
  },
  fareText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary
  },
  button: {
    backgroundColor: Colors.accent,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
