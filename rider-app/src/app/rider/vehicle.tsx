import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow } from '@/constants/Colors';
import { ArrowLeft, Zap, Check, ChevronRight } from 'lucide-react-native';
import { useCurrentLocation } from '@/hooks/use-current-location';

const { height } = Dimensions.get('window');

const VEHICLES = [
  {
    id: 'Scooty',
    name: 'Scooty',
    eta: '2 min',
    fare: '₹45',
    surge: false,
    icon: '🛵',
    match: 'Two-wheeler',
    seats: '1 seat',
  },
  {
    id: 'Bike',
    name: 'Bike',
    eta: '3 min',
    fare: '₹50',
    surge: false,
    icon: '🏍',
    match: 'Two-wheeler',
    seats: '1 seat',
  },
  {
    id: 'Auto',
    name: 'Auto',
    eta: '4 min',
    fare: '₹85',
    surge: true,
    icon: '🛺',
    match: 'Auto only',
    seats: '3 seats',
  },
  {
    id: 'Car',
    name: 'Car',
    eta: '6 min',
    fare: '₹180',
    surge: false,
    icon: '🚗',
    match: 'Car only',
    seats: '4 seats',
  },
];

export default function VehicleSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    pickup?: string;
    drop?: string;
    pickupLat?: string;
    pickupLng?: string;
  }>();
  const { address, coords } = useCurrentLocation({ watch: false });
  const [selectedVehicle, setSelectedVehicle] = useState('Auto');

  const selectedData = VEHICLES.find((v) => v.id === selectedVehicle);
  const pickupLabel = String(params.pickup || address || 'Current location');
  const dropLabel = String(params.drop || 'Destination');
  const lat = params.pickupLat || (coords ? String(coords.latitude) : '');
  const lng = params.pickupLng || (coords ? String(coords.longitude) : '');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.mapHero, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <View style={styles.mapDecor} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={Colors.white} size={22} />
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Choose your ride</Text>
        <Text style={styles.heroSub}>Matched drivers only for this vehicle type</Text>

        <View style={styles.routeCard}>
          <View style={styles.routeDots}>
            <View style={styles.dotPick} />
            <View style={styles.dash} />
            <View style={styles.dotDrop} />
          </View>
          <View style={{ flex: 1, gap: 10 }}>
            <View>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeText} numberOfLines={1}>
                {pickupLabel}
              </Text>
            </View>
            <View>
              <Text style={styles.routeLabel}>DROP</Text>
              <Text style={[styles.routeText, { fontWeight: '800' }]} numberOfLines={1}>
                {dropLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {VEHICLES.map((vehicle) => {
            const isSelected = selectedVehicle === vehicle.id;
            return (
              <TouchableOpacity
                key={vehicle.id}
                style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                onPress={() => setSelectedVehicle(vehicle.id)}
                activeOpacity={0.88}
              >
                <View style={[styles.iconBox, isSelected && styles.iconBoxOn]}>
                  <Text style={{ fontSize: 26 }}>{vehicle.icon}</Text>
                </View>
                <View style={styles.details}>
                  <View style={styles.nameRow}>
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    {vehicle.surge ? (
                      <View style={styles.surgePill}>
                        <Zap size={10} color={Colors.error} />
                        <Text style={styles.surgeText}>Busy</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.meta}>
                    {vehicle.eta} away · {vehicle.seats} · {vehicle.match}
                  </Text>
                </View>
                <View style={styles.fareCol}>
                  <Text style={styles.fare}>{vehicle.fare}</Text>
                  {isSelected ? (
                    <View style={styles.check}>
                      <Check size={12} color={Colors.white} strokeWidth={3} />
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={styles.confirmButton}
          activeOpacity={0.92}
          onPress={() =>
            router.push({
              pathname: '/rider/tracking',
              params: {
                vehicleType: selectedData?.id || 'Auto',
                vehicleName: selectedData?.name || 'Auto',
                fare: selectedData?.fare || '₹0',
                pickup: pickupLabel,
                drop: dropLabel,
                pickupLat: lat,
                pickupLng: lng,
              },
            })
          }
        >
          <Text style={styles.confirmText}>Confirm {selectedData?.name}</Text>
          <ChevronRight color={Colors.accent} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapHero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 28,
    minHeight: height * 0.32,
  },
  mapDecor: {
    position: 'absolute',
    right: -40,
    top: 40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(201,162,93,0.12)',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 18,
    fontWeight: '500',
  },
  routeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: 14,
    gap: 12,
    ...Shadow.card,
  },
  routeDots: { alignItems: 'center', paddingTop: 4, width: 14 },
  dotPick: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  dash: {
    width: 2,
    flex: 1,
    minHeight: 22,
    backgroundColor: Colors.borderStrong,
    marginVertical: 4,
  },
  dotDrop: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textLight,
    letterSpacing: 0.6,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  sheet: {
    flex: 1,
    marginTop: -12,
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.xl,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  vehicleCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
    ...Shadow.soft,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBoxOn: {
    backgroundColor: Colors.white,
  },
  details: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vehicleName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  surgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.errorSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  surgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.error,
  },
  meta: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    fontWeight: '600',
  },
  fareCol: { alignItems: 'flex-end', gap: 6 },
  fare: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadow.card,
  },
  confirmText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
