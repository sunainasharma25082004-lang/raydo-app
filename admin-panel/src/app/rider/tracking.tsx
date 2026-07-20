import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Phone, MessageSquare, ShieldAlert, Star } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, withDelay } from 'react-native-reanimated';

const { height, width } = Dimensions.get('window');

export default function TrackingScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'finding' | 'assigned' | 'arrived'>('finding');

  // Animation values for finding driver
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);
  const pulse3 = useSharedValue(1);

  useEffect(() => {
    if (status === 'finding') {
      pulse1.value = withRepeat(withTiming(3, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
      pulse2.value = withDelay(400, withRepeat(withTiming(3, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false));
      pulse3.value = withDelay(800, withRepeat(withTiming(3, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false));

      // Simulate finding driver -> found after 4 seconds
      const timer = setTimeout(() => {
        setStatus('assigned');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const Ring1 = useAnimatedStyle(() => ({ transform: [{ scale: pulse1.value }], opacity: 1 - (pulse1.value / 3) }));
  const Ring2 = useAnimatedStyle(() => ({ transform: [{ scale: pulse2.value }], opacity: 1 - (pulse2.value / 3) }));
  const Ring3 = useAnimatedStyle(() => ({ transform: [{ scale: pulse3.value }], opacity: 1 - (pulse3.value / 3) }));

  if (status === 'finding') {
    return (
      <View style={styles.findingContainer}>
        <View style={styles.radarCenter}>
          <Animated.View style={[styles.pulseRing, Ring3]} />
          <Animated.View style={[styles.pulseRing, Ring2]} />
          <Animated.View style={[styles.pulseRing, Ring1]} />
          
          <View style={styles.centerPinIcon}>
            <View style={styles.pinDot} />
          </View>
        </View>

        <View style={styles.statusTextContainer}>
          <Text style={styles.findingTitle}>Finding your ride</Text>
          <Text style={styles.findingSubtitle}>Connecting you with a driver nearby</Text>
        </View>

        <TouchableOpacity style={styles.cancelLink} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel Request</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Active Tracking View
  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&sat=-100&bri=20' }} 
          style={styles.mapImage}
        />
        {/* Mock Route Line */}
        <View style={styles.mockRoute} />
        <View style={styles.carPin} />
      </View>

      {/* SOS Button */}
      <TouchableOpacity style={styles.sosButton}>
        <ShieldAlert color={Colors.error} size={24} />
      </TouchableOpacity>

      {/* Driver Bottom Sheet */}
      <View style={styles.sheet}>
        <View style={styles.dragHandle} />
        
        <View style={styles.etaHeader}>
          <Text style={styles.etaTitle}>Arriving in</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.etaNumber}>4</Text>
            <Text style={styles.etaMin}> min</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg} />
          <View style={[styles.progressBarFill, { width: '40%' }]} />
          <View style={[styles.progressDot, { left: '40%' }]} />
        </View>

        <View style={styles.driverSection}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80' }} style={styles.driverImage} />
          <View style={styles.driverInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.driverName}>Ramesh Kumar</Text>
              <View style={styles.ratingBox}>
                <Star color={Colors.accent} size={12} fill={Colors.accent} />
                <Text style={styles.ratingText}>4.8</Text>
              </View>
            </View>
            <Text style={styles.vehicleInfo}>Bajaj RE • <Text style={styles.plate}>KA 01 AB 1234</Text></Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Phone color={Colors.primary} size={20} style={{ marginRight: 8 }} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <View style={{ width: 16 }} />
          <TouchableOpacity style={styles.actionButton}>
            <MessageSquare color={Colors.primary} size={20} style={{ marginRight: 8 }} />
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.testCompleteButton}
          onPress={() => router.push('/rider/payment')}
        >
          <Text style={styles.testCompleteText}>Simulate Trip Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  findingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  pulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  centerPinIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  statusTextContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  findingTitle: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: '400',
    marginBottom: 8,
  },
  findingSubtitle: {
    fontSize: 15,
    color: Colors.textLight,
  },
  cancelLink: {
    position: 'absolute',
    bottom: 50,
    padding: 16,
  },
  cancelText: {
    color: Colors.textLight,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  
  // Tracking UI styles
  mapContainer: {
    flex: 1,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.9,
  },
  mockRoute: {
    position: 'absolute',
    top: '30%',
    left: '40%',
    width: 100,
    height: 100,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: Colors.accent,
    borderBottomLeftRadius: 20,
    transform: [{ rotate: '45deg' }],
  },
  carPin: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sosButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  etaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  etaTitle: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: '500',
  },
  etaNumber: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.primary,
  },
  etaMin: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 4,
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  progressDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginLeft: -6, // offset for center
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  driverImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 4,
  },
  vehicleInfo: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  plate: {
    fontFamily: 'Courier',
    fontWeight: '600',
    color: Colors.text,
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  testCompleteButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 12,
  },
  testCompleteText: {
    color: Colors.textLight,
    fontSize: 12,
    textDecorationLine: 'underline',
  }
});
