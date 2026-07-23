import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://raydo-app-tqev.onrender.com';

export default function BookScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const requestRide = async () => {
    setLoading(true);
    
    // Connect to Socket.io to listen for driver acceptance
    const newSocket = io(API_URL);
    setSocket(newSocket);

    // Mock rider login token and ID
    const RIDER_ID = 'rider123'; // Replace with real auth
    newSocket.emit('join_rider', RIDER_ID);

    newSocket.on('ride_accepted', (data) => {
      console.log('Ride accepted!', data);
      Alert.alert('Success', 'A driver has accepted your ride!');
      // Pass ride details to track screen or state manager
      router.push('/track');
    });

    try {
      // Create mock ride request
      const response = await axios.post(`${API_URL}/api/rides/request`, {
        pickupLocation: { address: 'Delhi Airport', lat: 28.5562, lng: 77.1000 },
        dropoffLocation: { address: 'Connaught Place', lat: 28.6304, lng: 77.2177 },
        vehicleType: 'Auto',
        distance: 15, // km
        fare: 150 // INR
      }, {
        headers: {
          // Replace with real JWT token
          Authorization: `Bearer mock_token_for_rider123` 
        }
      });
      console.log("Requested:", response.data);
    } catch (err) {
      console.error(err);
      // For MVP without auth, we will manually broadcast a socket event to test it if HTTP fails due to auth middleware
      console.log("Mocking request via direct socket emit due to missing auth");
      newSocket.emit('new_ride_request', {
        ride: {
          _id: 'ride123',
          riderId: RIDER_ID,
          pickupLocation: { address: 'Delhi Airport', lat: 28.5562, lng: 77.1000 },
          dropoffLocation: { address: 'Connaught Place', lat: 28.6304, lng: 77.2177 },
          vehicleType: 'Auto',
          distance: 15,
          fare: 150
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where to?</Text>
      
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="Pickup Location (e.g. Delhi Airport)" editable={false} value="Delhi Airport" />
        <TextInput style={styles.input} placeholder="Dropoff Location" editable={false} value="Connaught Place" />
      </View>

      <View style={styles.fareContainer}>
        <Text style={styles.vehicleType}>Auto Rickshaw</Text>
        <Text style={styles.farePrice}>₹150</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={requestRide} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>REQUEST RIDE</Text>
        )}
      </TouchableOpacity>
      
      {loading && (
        <Text style={styles.findingText}>Looking for nearby drivers...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30
  },
  inputContainer: {
    marginBottom: 20
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16
  },
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 10,
    marginBottom: 30
  },
  vehicleType: {
    fontSize: 18,
    fontWeight: '600'
  },
  farePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  findingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666'
  }
});
