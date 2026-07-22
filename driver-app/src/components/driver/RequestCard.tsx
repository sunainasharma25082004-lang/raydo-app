import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin, Navigation2, Star, Wallet } from 'lucide-react-native';
import { RideRequest, formatInr } from '@/data/mock';
import { Colors, Radius, Shadow } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';

type Props = {
  request: RideRequest;
  seconds?: number;
  onAccept: () => void;
  onReject: () => void;
};

export function RequestCard({ request, seconds = 20, onAccept, onReject }: Props) {
  const [left, setLeft] = useState(seconds);
  const onRejectRef = useRef(onReject);
  const finishedRef = useRef(false);

  onRejectRef.current = onReject;

  useEffect(() => {
    finishedRef.current = false;
    setLeft(seconds);
    let remaining = seconds;

    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        setLeft(0);
        if (!finishedRef.current) {
          finishedRef.current = true;
          // Next tick — never inside setState updater
          setTimeout(() => {
            onRejectRef.current();
          }, 0);
        }
        return;
      }
      setLeft(remaining);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [request.id, seconds]);

  const handleReject = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setTimeout(() => onReject(), 0);
  };

  const handleAccept = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setTimeout(() => onAccept(), 0);
  };

  const progress = left / seconds;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.kicker}>New ride request</Text>
          <Text style={styles.rider}>
            {request.riderName} · {request.riderRating}{' '}
            <Star size={12} color={Colors.accent} fill={Colors.accent} />
          </Text>
        </View>
        <View style={styles.timer}>
          <Text style={styles.timerText}>{left}s</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(progress * 100, 2)}%` }]} />
      </View>

      <View style={styles.fareRow}>
        <Text style={styles.fare}>{formatInr(request.fare)}</Text>
        <View style={styles.metaChip}>
          <Text style={styles.metaText}>
            {request.distanceKm} km · {request.etaMin} min
          </Text>
        </View>
        <View style={[styles.metaChip, styles.payChip]}>
          <Wallet size={12} color={Colors.primary} />
          <Text style={styles.metaText}>{request.payment}</Text>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.routeIconCol}>
          <View style={styles.dotPickup} />
          <View style={styles.dash} />
          <MapPin size={16} color={Colors.accent} />
        </View>
        <View style={styles.routeTextCol}>
          <View style={styles.routeBlock}>
            <Text style={styles.routeLabel}>Pickup</Text>
            <Text style={styles.routeTitle} numberOfLines={1}>
              {request.pickup}
            </Text>
            <Text style={styles.routeSub} numberOfLines={1}>
              {request.pickupArea}
            </Text>
          </View>
          <View style={styles.routeBlock}>
            <Text style={styles.routeLabel}>Drop</Text>
            <Text style={styles.routeTitle} numberOfLines={1}>
              {request.drop}
            </Text>
            <Text style={styles.routeSub} numberOfLines={1}>
              {request.dropArea}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Decline" variant="outline" onPress={handleReject} style={styles.flex} />
        <Button
          title="Accept"
          variant="success"
          onPress={handleAccept}
          style={styles.flex}
          leftIcon={<Navigation2 size={16} color={Colors.white} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.floating,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accentDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rider: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  timer: {
    minWidth: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  fare: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    marginRight: 4,
  },
  metaChip: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  payChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentSoft,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  route: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: 14,
  },
  routeIconCol: {
    alignItems: 'center',
    paddingTop: 4,
    width: 18,
  },
  dotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  dash: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderStrong,
    marginVertical: 4,
    minHeight: 28,
  },
  routeTextCol: {
    flex: 1,
    gap: 14,
  },
  routeBlock: { gap: 2 },
  routeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  routeSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: { flex: 1 },
});
