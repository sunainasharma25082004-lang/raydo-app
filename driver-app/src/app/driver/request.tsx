import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { RequestCard } from '@/components/driver/RequestCard';
import { useDriver } from '@/context/DriverContext';
import { useSession } from '@/context/SessionContext';
import { api } from '@/lib/api';
import { Colors } from '@/constants/Colors';
import { notifyTripUpdate } from '@/lib/notifications';

/**
 * Incoming ride modal — polished card + timer.
 * Accept calls live API when it's a server ride.
 */
export default function RequestScreen() {
  const router = useRouter();
  const { token } = useSession();
  const { tripStatus, activeRequest, acceptRequest, rejectRequest } = useDriver();
  const handledNav = useRef(false);
  const requestId = activeRequest?.id;
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    // Haptic when request sheet opens
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [requestId]);

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
      const t = setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/driver/(tabs)/home');
      }, 50);
      return () => clearTimeout(t);
    }
  }, [tripStatus, activeRequest, router]);

  const onAccept = async () => {
    if (!activeRequest || accepting) return;
    setAccepting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      if (token && activeRequest.isLiveServerRide) {
        await api.acceptRide(token, activeRequest.id);
        await notifyTripUpdate(
          'Ride accepted ✓',
          `${activeRequest.riderName} · navigate to pickup`,
        );
      }
      acceptRequest();
    } catch (e: any) {
      setAccepting(false);
      Alert.alert('Accept failed', e.message || 'Could not accept ride');
      // allow retry
      // finishedRef is inside card — remount by rejecting then user can re-poll
      rejectRequest();
    }
  };

  const onReject = () => {
    Haptics.selectionAsync().catch(() => {});
    rejectRequest();
  };

  if (!activeRequest) {
    return <View style={styles.overlay} />;
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onReject} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Incoming ride</Text>
        <RequestCard
          key={activeRequest.id}
          request={activeRequest}
          onAccept={onAccept}
          onReject={onReject}
          accepting={accepting}
          seconds={28}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 28, 63, 0.62)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    paddingHorizontal: 14,
    paddingBottom: 28,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginBottom: 10,
  },
  sheetTitle: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.9,
  },
});
