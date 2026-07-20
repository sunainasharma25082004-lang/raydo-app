import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Clock } from 'lucide-react-native';

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride History</Text>
      <View style={styles.emptyState}>
        <Clock color={Colors.textLight} size={48} />
        <Text style={styles.emptyText}>No recent rides.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginBottom: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textLight, marginTop: 12, fontSize: 16 }
});
