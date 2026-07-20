import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ArrowLeft, MapPin, Clock, Navigation } from 'lucide-react-native';

const RECENT_SEARCHES = [
  { id: '1', name: 'Phoenix Marketcity', address: 'Whitefield Main Rd, Devasandra Industrial Estate' },
  { id: '2', name: 'Kempegowda Int. Airport', address: 'KIAL Rd, Devanahalli' },
  { id: '3', name: 'Indiranagar Metro Station', address: 'CMH Road, Indiranagar' },
];

export default function SearchScreen() {
  const router = useRouter();
  const [pickup, setPickup] = useState('Current Location');
  const [drop, setDrop] = useState('');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan your ride</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <View style={styles.routeLine}>
          <View style={styles.routeDot} />
          <View style={styles.routeDash} />
          <View style={[styles.routeDot, { backgroundColor: Colors.accent }]} />
        </View>

        <View style={styles.inputsContainer}>
          <TextInput
            style={styles.input}
            placeholder="Pickup location"
            value={pickup}
            onChangeText={setPickup}
            placeholderTextColor={Colors.textLight}
          />
          <View style={styles.inputDivider} />
          <TextInput
            style={[styles.input, { fontWeight: '500' }]}
            placeholder="Where to?"
            value={drop}
            onChangeText={setDrop}
            placeholderTextColor={Colors.textLight}
            autoFocus
          />
        </View>
      </View>

      {/* Map Pin Option */}
      <TouchableOpacity 
        style={styles.mapSelectBtn}
        onPress={() => {
          if (drop.length > 2) {
            router.push('/rider/vehicle');
          }
        }}
      >
        <View style={styles.mapIconBg}>
          <MapPin color={Colors.text} size={20} />
        </View>
        <Text style={styles.mapSelectText}>Choose on map</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Recent Searches */}
      <ScrollView style={styles.recentList} keyboardShouldPersistTaps="handled">
        {RECENT_SEARCHES.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.recentRow}
            onPress={() => {
              setDrop(item.name);
              router.push('/rider/vehicle');
            }}
          >
            <View style={styles.recentIconBg}>
              <Clock color={Colors.textLight} size={20} />
            </View>
            <View style={styles.recentTextContainer}>
              <Text style={styles.recentName}>{item.name}</Text>
              <Text style={styles.recentAddress} numberOfLines={1}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.white,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  inputSection: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  routeLine: {
    alignItems: 'center',
    marginRight: 16,
    marginTop: 18,
    height: 70,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textLight,
  },
  routeDash: {
    width: 1,
    height: 38,
    backgroundColor: '#E5E8EB',
    marginVertical: 4,
  },
  inputsContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#E5E8EB',
    marginLeft: 16,
  },
  mapSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  mapIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E8EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mapSelectText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 8,
    backgroundColor: '#F3F4F6',
  },
  recentList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  recentIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  recentTextContainer: {
    flex: 1,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  recentAddress: {
    fontSize: 13,
    color: Colors.textLight,
  }
});
