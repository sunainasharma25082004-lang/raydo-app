import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Navigation } from 'lucide-react-native';
import { Colors, Radius, Shadow } from '@/constants/Colors';

type Props = {
  label?: string;
  subtitle?: string;
  showRoute?: boolean;
  compact?: boolean;
  coords?: { latitude: number; longitude: number } | null;
  destCoords?: { latitude: number; longitude: number } | null;
  loading?: boolean;
};

export function MapCanvas({
  label = 'Your location',
  subtitle = 'Live map preview',
  showRoute,
  compact,
  coords,
  destCoords,
  loading,
}: Props) {
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    // Delay map mount slightly to avoid Xiaomi AppState crash
    const t = setTimeout(() => setShowMap(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      {showMap && coords ? (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsIndoors={false}
          toolbarEnabled={false}
          pitchEnabled={false}
          initialRegion={{
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          region={{
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          <Marker
            coordinate={{
              latitude: coords.latitude,
              longitude: coords.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
             <View style={styles.pinPulse} />
             <View style={styles.pin}>
               <Navigation color={Colors.white} size={14} fill={Colors.white} />
             </View>
          </Marker>

          {showRoute && destCoords && (
             <Marker
                coordinate={{
                  latitude: destCoords.latitude,
                  longitude: destCoords.longitude,
                }}
             >
                <View style={styles.destPin}>
                   <MapPin color={Colors.accent} size={28} fill={Colors.white} />
                </View>
             </Marker>
          )}
        </MapView>
      ) : (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Floating Badge overlay */}
      <View style={styles.badge}>
        <Text style={styles.badgeTitle}>{label}</Text>
        <Text style={styles.badgeSub} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.mapTint,
    overflow: 'hidden',
    position: 'relative',
  },
  compact: {
    minHeight: 180,
    borderRadius: Radius.lg,
  },
  loadingWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPulse: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    opacity: 0.25,
  },
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  destPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: '70%',
    ...Shadow.sm,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  badgeSub: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
});
