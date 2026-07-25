import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { CheckCircle2, ChevronRight, Star } from 'lucide-react-native';
import { LiveRide, riderApi } from '@/lib/api';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const rideId = String(params.rideId || '');

  const [ride, setRide] = useState<LiveRide | null>(null);
  const [loading, setLoading] = useState(!!rideId);
  const [rating, setRating] = useState(0);
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'done'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!rideId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await riderApi.getRide(rideId);
        if (!cancelled) setRide(res.ride);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Could not load ride');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rideId]);

  const fare = Number(ride?.fare) || 0;
  const base = Math.min(40, Math.round(fare * 0.25));
  const distancePart = Math.max(0, fare - base);

  const handlePay = async () => {
    if (!rideId) {
      // Demo fallback without ride id
      setPaymentState('processing');
      setTimeout(() => {
        setPaymentState('done');
        setTimeout(() => router.replace('/(tabs)/home'), 900);
      }, 800);
      return;
    }
    if (paymentState !== 'idle') return;
    setPaymentState('processing');
    setError('');
    try {
      const res = await riderApi.payRide(rideId, {
        method: 'upi',
        rating: rating || undefined,
        transactionId: `upi_${Date.now()}`,
      });
      setRide(res.ride);
      setPaymentState('done');
      Alert.alert(
        'Payment successful',
        `₹${res.payment.amount} received by Raydo admin.\n\n${res.message}`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }],
      );
    } catch (e: any) {
      setPaymentState('idle');
      setError(e.message || 'Payment failed');
      Alert.alert('Payment failed', e.message || 'Try again');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading fare…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <CheckCircle2 color={Colors.accent} size={48} strokeWidth={1.5} />
        <Text style={styles.headerText}>Trip completed</Text>
        <Text style={styles.headerSub}>Pay Raydo — amount goes to admin</Text>
      </View>

      <View style={styles.receiptCard}>
        <View style={styles.routeInfo}>
          <View style={styles.routeLine}>
            <View style={styles.routeDot} />
            <View style={styles.routeDash} />
            <View style={[styles.routeDot, { backgroundColor: Colors.accent }]} />
          </View>
          <View style={styles.addressBox}>
            <View style={styles.addressRow}>
              <Text style={styles.addressText} numberOfLines={1}>
                {ride?.pickup || 'Pickup'}
              </Text>
            </View>
            <View style={styles.addressRow}>
              <Text style={[styles.addressText, { fontWeight: '500' }]} numberOfLines={1}>
                {ride?.drop || 'Destination'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Base fare</Text>
          <Text style={styles.fareValue}>₹{base}</Text>
        </View>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>
            Distance / trip{ride?.distanceKm ? ` (${ride.distanceKm} km)` : ''}
          </Text>
          <Text style={styles.fareValue}>₹{distancePart}</Text>
        </View>
        {ride?.vehicleType ? (
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Vehicle</Text>
            <Text style={styles.fareValue}>{ride.vehicleType}</Text>
          </View>
        ) : null}

        <View style={styles.totalDivider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total (to admin)</Text>
          <Text style={styles.totalValue}>₹{fare || '—'}</Text>
        </View>

        {ride?.paymentStatus === 'paid' ? (
          <Text style={styles.paidBadge}>Already paid · received by admin</Text>
        ) : null}
      </View>

      <TouchableOpacity style={styles.paymentMethod} activeOpacity={0.9}>
        <View style={styles.paymentLeft}>
          <View style={styles.paymentIconBg}>
            <Text style={{ fontSize: 16 }}>UPI</Text>
          </View>
          <View>
            <Text style={styles.paymentText}>Pay via UPI</Text>
            <Text style={styles.paymentHint}>Settles to Raydo admin account</Text>
          </View>
        </View>
        <ChevronRight color={Colors.textLight} size={20} />
      </TouchableOpacity>

      <View style={styles.ratingSection}>
        <Text style={styles.ratingTitle}>How was your ride?</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Star
                color={rating >= star ? Colors.accent : '#E5E8EB'}
                size={36}
                strokeWidth={1.5}
                fill={rating >= star ? Colors.accent : 'transparent'}
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.doneButton,
            (paymentState !== 'idle' || ride?.paymentStatus === 'paid') && styles.doneDisabled,
          ]}
          onPress={handlePay}
          disabled={paymentState !== 'idle' || ride?.paymentStatus === 'paid'}
        >
          {paymentState === 'idle' && ride?.paymentStatus !== 'paid' && (
            <Text style={styles.doneButtonText}>Pay ₹{fare} to Raydo</Text>
          )}
          {paymentState === 'processing' && (
            <Text style={styles.doneButtonText}>Processing…</Text>
          )}
          {(paymentState === 'done' || ride?.paymentStatus === 'paid') && (
            <Text style={styles.doneButtonText}>Payment Successful</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.skip} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.skipText}>Back to home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: Colors.textSecondary, fontWeight: '600' },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 30,
  },
  headerText: {
    fontSize: 20,
    color: Colors.text,
    fontWeight: '500',
    marginTop: 16,
  },
  headerSub: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '600',
  },
  receiptCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  routeInfo: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  routeLine: {
    alignItems: 'center',
    marginRight: 16,
    height: 48,
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
    height: 48,
  },
  addressRow: {
    justifyContent: 'center',
  },
  addressText: {
    fontSize: 15,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fareLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  fareValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#E5E8EB',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: '600',
  },
  paidBadge: {
    marginTop: 12,
    textAlign: 'center',
    color: Colors.success,
    fontWeight: '700',
    fontSize: 13,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  paymentHint: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '600',
    marginTop: 2,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingTitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  star: {
    marginHorizontal: 8,
  },
  error: {
    color: Colors.error,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  footer: {
    paddingHorizontal: 24,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneDisabled: { opacity: 0.85 },
  doneButtonText: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  skip: { marginTop: 14, alignItems: 'center' },
  skipText: { color: Colors.textSecondary, fontWeight: '700' },
});
