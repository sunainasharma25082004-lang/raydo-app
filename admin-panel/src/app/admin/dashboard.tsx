import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Users, Car, IndianRupee, AlertCircle } from 'lucide-react-native';

const METRICS = [
  { id: '1', title: 'Active Rides', value: '42', icon: Car, color: Colors.primary },
  { id: '2', title: 'Online Drivers', value: '156', icon: Users, color: Colors.success },
  { id: '3', title: 'Today\'s Revenue', value: '₹ 45K', icon: IndianRupee, color: Colors.accent },
  { id: '4', title: 'Open Tickets', value: '8', icon: AlertCircle, color: Colors.error },
];

export default function AdminDashboardScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Raydo Admin</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Overview</Text>
        
        <View style={styles.metricsGrid}>
          {METRICS.map((metric) => (
            <View key={metric.id} style={styles.metricCard}>
              <View style={[styles.iconBg, { backgroundColor: metric.color + '15' }]}>
                <metric.icon color={metric.color} size={24} />
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricTitle}>{metric.title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.card}>
            <Text style={styles.emptyText}>Activity logs will appear here</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Manage Pricing Config</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]}>
            <Text style={styles.actionButtonText}>View All Drivers</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: '#E5E8EB'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  content: { padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  metricCard: {
    width: '48%', backgroundColor: Colors.white, padding: 16, borderRadius: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  iconBg: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  metricTitle: { fontSize: 14, color: Colors.textLight },
  section: { marginBottom: 24 },
  card: { backgroundColor: Colors.white, padding: 24, borderRadius: 16, alignItems: 'center' },
  emptyText: { color: Colors.textLight, fontSize: 14 },
  actionButton: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  actionButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' }
});
