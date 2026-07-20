import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { User, CreditCard, Clock, Settings, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';

const RIDE_HISTORY = [
  { id: '1', destination: 'Phoenix Marketcity', date: 'Jul 15, 14:30', fare: '₹205', vehicle: 'Auto' },
  { id: '2', destination: 'Indiranagar Metro', date: 'Jul 12, 09:15', fare: '₹145', vehicle: 'Bike' },
  { id: '3', destination: 'Koramangala 3rd Block', date: 'Jul 10, 18:45', fare: '₹85', vehicle: 'E-Rickshaw' },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User color={Colors.white} size={32} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>Rahul Sharma</Text>
            <Text style={styles.phone}>+91 98765 43210</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet / Payment */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.row}>
            <View style={styles.iconBg}><CreditCard color={Colors.primary} size={20} /></View>
            <Text style={styles.rowText}>Payment Methods</Text>
            <ChevronRight color={Colors.textLight} size={20} />
          </TouchableOpacity>
        </View>

        {/* Ride History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Rides</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          
          {RIDE_HISTORY.map((ride, index) => (
            <View key={ride.id}>
              <TouchableOpacity style={styles.rideRow}>
                <View style={styles.rideIconBg}>
                  <Clock color={Colors.textLight} size={20} />
                </View>
                <View style={styles.rideInfo}>
                  <Text style={styles.rideDest} numberOfLines={1}>{ride.destination}</Text>
                  <Text style={styles.rideMeta}>{ride.date} • {ride.vehicle}</Text>
                </View>
                <Text style={styles.rideFare}>{ride.fare}</Text>
              </TouchableOpacity>
              {index < RIDE_HISTORY.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Settings & Support */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.row}>
            <View style={styles.iconBg}><Settings color={Colors.primary} size={20} /></View>
            <Text style={styles.rowText}>Settings</Text>
            <ChevronRight color={Colors.textLight} size={20} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <View style={styles.iconBg}><HelpCircle color={Colors.primary} size={20} /></View>
            <Text style={styles.rowText}>Help & Support</Text>
            <ChevronRight color={Colors.textLight} size={20} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/rider/login')}>
          <LogOut color={Colors.error} size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        {/* Link to Driver App for MVP Demo */}
        <TouchableOpacity style={styles.driverLinkBtn} onPress={() => router.replace('/driver/login')}>
          <Text style={styles.driverLinkText}>Switch to Driver App (Demo)</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: Colors.textLight,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  editText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  rideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rideIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAF8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rideInfo: {
    flex: 1,
    marginRight: 12,
  },
  rideDest: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  rideMeta: {
    fontSize: 13,
    color: Colors.textLight,
  },
  rideFare: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.error,
    marginBottom: 16,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  driverLinkBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  driverLinkText: {
    color: Colors.textLight,
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});
