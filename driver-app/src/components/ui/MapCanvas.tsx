import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { Colors, Radius } from '@/constants/Colors';

type Props = {
  label?: string;
  subtitle?: string;
  showRoute?: boolean;
  compact?: boolean;
  coords?: { latitude: number; longitude: number } | null;
  loading?: boolean;
};

export function MapCanvas({
  label = 'Your location',
  subtitle = 'Live map preview',
  showRoute,
  compact,
  coords,
  loading,
}: Props) {
  const gpsLine = coords
    ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
    : loading
      ? 'Reading GPS…'
      : 'Waiting for GPS';

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={styles.grid} />
      <View style={styles.roadH} />
      <View style={styles.roadV} />
      {showRoute ? <View style={styles.route} /> : null}

      <View style={styles.pinWrap}>
        <View style={styles.pinPulse} />
        <View style={styles.pin}>
          <Navigation color={Colors.white} size={16} fill={Colors.white} />
        </View>
      </View>

      {showRoute ? (
        <View style={styles.destPin}>
          <MapPin color={Colors.accent} size={22} fill={Colors.accentSoft} />
        </View>
      ) : null}

      <View style={styles.badge}>
        <Text style={styles.badgeTitle}>{label}</Text>
        <Text style={styles.badgeSub} numberOfLines={2}>
          {subtitle}
        </Text>
        <Text style={styles.gps}>{gpsLine}</Text>
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
  grid: {
    ...StyleSheet.absoluteFill,
    opacity: 0.35,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  roadH: {
    position: 'absolute',
    top: '48%',
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#CBD5E1',
  },
  roadV: {
    position: 'absolute',
    left: '42%',
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: '#CBD5E1',
  },
  route: {
    position: 'absolute',
    left: '44%',
    top: '30%',
    width: 4,
    height: '38%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
    transform: [{ rotate: '28deg' }],
  },
  pinWrap: {
    position: 'absolute',
    top: '44%',
    left: '40%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPulse: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    opacity: 0.15,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  destPin: {
    position: 'absolute',
    top: '28%',
    right: '22%',
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
  gps: {
    fontSize: 10,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: '700',
  },
});
