import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { MapPin, Edit2, Zap, ArrowRight, ShieldCheck } from 'lucide-react-native';

const { height, width } = Dimensions.get('window');

const VEHICLES = [
  {
    id: 'bike',
    name: 'Bike',
    eta: '2 min away',
    fare: '₹45',
    surge: false,
    icon: '🛵'
  },
  {
    id: 'auto',
    name: 'Auto',
    eta: '4 min away',
    fare: '₹85',
    surge: true,
    icon: '🛺'
  },
  {
    id: 'erickshaw',
    name: 'E-Rickshaw',
    eta: '5 min away',
    fare: '₹60',
    surge: false,
    icon: '🛺' // Simplified emoji for placeholder
  }
];

export default function VehicleSelectionScreen() {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState('auto');

  const selectedData = VEHICLES.find(v => v.id === selectedVehicle);

  return (
    <View style={styles.container}>
      {/* Blurred/Dimmed Map Background */}
      <View style={styles.mapContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&sat=-100&bri=20' }} 
          style={styles.mapImage}
          blurRadius={10}
        />
        <View style={styles.mapDimmer} />
      </View>

      {/* Bottom Sheet */}
      <View style={styles.sheet}>
        <View style={styles.dragHandle} />
        
        {/* Route Info */}
        <View style={styles.routeInfo}>
          <View style={styles.routeLine}>
            <View style={styles.routeDot} />
            <View style={styles.routeDash} />
            <View style={[styles.routeDot, { backgroundColor: Colors.accent }]} />
          </View>
          <View style={styles.addressBox}>
            <Text style={styles.addressText} numberOfLines={1}>Current Location</Text>
            <Text style={[styles.addressText, { color: Colors.primary, fontWeight: '600' }]} numberOfLines={1}>Phoenix Marketcity</Text>
          </View>
          <TouchableOpacity style={styles.editIcon}>
            <Edit2 color={Colors.textLight} size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Vehicle List */}
        <ScrollView style={styles.vehicleList} showsVerticalScrollIndicator={false}>
          {VEHICLES.map((vehicle) => {
            const isSelected = selectedVehicle === vehicle.id;
            return (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  isSelected && styles.vehicleCardSelected
                ]}
                onPress={() => setSelectedVehicle(vehicle.id)}
                activeOpacity={0.7}
              >
                <View style={styles.vehicleIconBox}>
                  <Text style={{ fontSize: 24 }}>{vehicle.icon}</Text>
                </View>
                
                <View style={styles.vehicleDetails}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <Text style={styles.vehicleEta}>{vehicle.eta}</Text>
                </View>
                
                <View style={styles.fareDetails}>
                  <Text style={styles.vehicleFare}>{vehicle.fare}</Text>
                  {vehicle.surge && (
                    <Text style={styles.surgeText}>High demand</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => router.push('/rider/tracking')}
          >
            <Text style={styles.confirmText}>Confirm {selectedData?.name}</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    height: height * 0.4,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mapDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 42, 74, 0.4)', // Deep Indigo with opacity
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.75,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E8EB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  routeLine: {
    alignItems: 'center',
    marginRight: 16,
    height: 40,
    justifyContent: 'space-between',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textLight,
  },
  routeDash: {
    width: 1,
    flex: 1,
    backgroundColor: '#E5E8EB',
    marginVertical: 4,
  },
  addressBox: {
    flex: 1,
    justifyContent: 'space-between',
    height: 40,
  },
  addressText: {
    fontSize: 15,
    color: Colors.text,
  },
  editIcon: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  vehicleList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  vehicleCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: '#FAF8F4', // Soft Ivory
  },
  vehicleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  vehicleEta: {
    fontSize: 13,
    color: Colors.textLight,
  },
  fareDetails: {
    alignItems: 'flex-end',
  },
  vehicleFare: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  surgeText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32, // Safe area for bottom
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  confirmText: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '600',
  }
});
