import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { CheckCircle2, MapPin, ChevronRight, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function PaymentScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'done'>('idle');

  const handleDone = () => {
    setPaymentState('processing');
    setTimeout(() => {
      setPaymentState('done');
      setTimeout(() => {
        router.replace('/rider/home');
      }, 1000);
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <CheckCircle2 color={Colors.accent} size={48} strokeWidth={1.5} />
        <Text style={styles.headerText}>Trip completed</Text>
      </View>

      {/* Receipt Card */}
      <View style={styles.receiptCard}>
        {/* Route Info */}
        <View style={styles.routeInfo}>
          <View style={styles.routeLine}>
            <View style={styles.routeDot} />
            <View style={styles.routeDash} />
            <View style={[styles.routeDot, { backgroundColor: Colors.accent }]} />
          </View>
          <View style={styles.addressBox}>
            <View style={styles.addressRow}>
              <Text style={styles.addressText} numberOfLines={1}>Kempegowda Int. Airport</Text>
            </View>
            <View style={styles.addressRow}>
              <Text style={[styles.addressText, { fontWeight: '500' }]} numberOfLines={1}>Phoenix Marketcity</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Fare Breakdown */}
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Base fare</Text>
          <Text style={styles.fareValue}>₹40</Text>
        </View>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Distance (12 km)</Text>
          <Text style={styles.fareValue}>₹120</Text>
        </View>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Time (45 min)</Text>
          <Text style={styles.fareValue}>₹45</Text>
        </View>

        <View style={styles.totalDivider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹205</Text>
        </View>
      </View>

      {/* Payment Method */}
      <TouchableOpacity style={styles.paymentMethod}>
        <View style={styles.paymentLeft}>
          <View style={styles.paymentIconBg}>
            <Text style={{ fontSize: 16 }}>UPI</Text>
          </View>
          <Text style={styles.paymentText}>Pay via UPI</Text>
        </View>
        <ChevronRight color={Colors.textLight} size={20} />
      </TouchableOpacity>

      {/* Rating Section */}
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

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.doneButton} 
          onPress={handleDone}
          disabled={paymentState !== 'idle'}
        >
          {paymentState === 'idle' && <Text style={styles.doneButtonText}>Done</Text>}
          {paymentState === 'processing' && <Text style={styles.doneButtonText}>Processing...</Text>}
          {paymentState === 'done' && <Text style={styles.doneButtonText}>Payment Successful</Text>}
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
  ratingSection: {
    alignItems: 'center',
    marginBottom: 40,
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
  footer: {
    paddingHorizontal: 24,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '600',
  }
});
