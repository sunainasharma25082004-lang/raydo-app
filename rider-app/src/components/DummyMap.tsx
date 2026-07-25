import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Colors, Radius, Shadow } from '@/constants/Colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface DummyMapProps {
  style?: any;
  latitude?: number;
  longitude?: number;
  address?: string;
  driver?: boolean;
}

export default function DummyMap({ style, latitude, longitude, address, driver }: DummyMapProps) {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    pulseScale.value = withRepeat(
      withTiming(3, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Grid Pattern Background */}
      <View style={styles.gridContainer}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineHorizontal, { top: `${i * 5}%` }]} />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineVertical, { left: `${i * 5}%` }]} />
        ))}
      </View>

      <View style={styles.centerContainer}>
        <Animated.View style={[styles.pulseCircle, pulseStyle]} />
        <Animated.View style={[styles.pinContainer, animatedStyle]}>
          <MapPin color="white" size={24} />
        </Animated.View>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {driver ? 'Driver Location' : 'Live Location'}
          </Text>
          <Text style={styles.infoSubtitle} numberOfLines={1}>
            {address || (latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 'Connecting to GPS...')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E8F1F8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    ...StyleSheet.absoluteFill,
    opacity: 0.15,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.primary,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.primary,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pinContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
    zIndex: 2,
  },
  pulseCircle: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    zIndex: 1,
  },
  infoCard: {
    marginTop: 16,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    alignItems: 'center',
    ...Shadow.card,
    maxWidth: 250,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
    textAlign: 'center',
  },
});
