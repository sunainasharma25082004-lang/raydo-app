import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { RequestCard } from '@/components/driver/RequestCard';
import { useDriver } from '@/context/DriverContext';
import { Colors } from '@/constants/Colors';

export default function RequestScreen() {
  const router = useRouter();
  const { tripStatus, activeRequest, acceptRequest, rejectRequest } = useDriver();

  useEffect(() => {
    if (tripStatus === 'to_pickup') {
      router.replace('/driver/trip');
    } else if (tripStatus === 'idle' || !activeRequest) {
      router.back();
    }
  }, [tripStatus, activeRequest, router]);

  if (!activeRequest) return <View style={styles.overlay} />;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={rejectRequest} />
      <View style={styles.sheet}>
        <RequestCard
          request={activeRequest}
          onAccept={acceptRequest}
          onReject={rejectRequest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    padding: 16,
    paddingBottom: 28,
  },
});
