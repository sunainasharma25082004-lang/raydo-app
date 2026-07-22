import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { RequestCard } from '@/components/driver/RequestCard';
import { useDriver } from '@/context/DriverContext';
import { Colors } from '@/constants/Colors';

/**
 * Incoming ride modal.
 * Navigation is intentional only — never calls reject/accept from effects.
 */
export default function RequestScreen() {
  const router = useRouter();
  const { tripStatus, activeRequest, acceptRequest, rejectRequest } = useDriver();
  const handledNav = useRef(false);
  const requestId = activeRequest?.id;

  // Navigate away only on accept → trip
  useEffect(() => {
    if (handledNav.current) return;
    if (tripStatus === 'to_pickup' && requestId) {
      handledNav.current = true;
      router.replace('/driver/trip');
    }
  }, [tripStatus, requestId, router]);

  // After reject / clear, go home once
  useEffect(() => {
    if (handledNav.current) return;
    if (tripStatus === 'idle' && !activeRequest) {
      handledNav.current = true;
      // Slight delay so deferred reject state has settled
      const t = setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/driver/(tabs)/home');
      }, 50);
      return () => clearTimeout(t);
    }
  }, [tripStatus, activeRequest, router]);

  if (!activeRequest) {
    return <View style={styles.overlay} />;
  }

  return (
    <View style={styles.overlay}>
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          // User tapped outside — decline
          rejectRequest();
        }}
      />
      <View style={styles.sheet}>
        <RequestCard
          key={activeRequest.id}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    padding: 16,
    paddingBottom: 28,
  },
});
