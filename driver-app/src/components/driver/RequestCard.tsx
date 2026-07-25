import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  MapPin,
  Navigation2,
  Star,
  Wallet,
  Zap,
  Car,
  LocateFixed,
  UserRound,
} from 'lucide-react-native';
import { RideRequest, formatInr } from '@/data/mock';
import { Colors, Radius, Shadow } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';

type Props = {
  request: RideRequest;
  seconds?: number;
  onAccept: () => void;
  onReject: () => void;
  accepting?: boolean;
};

export function RequestCard({
  request,
  seconds = 25,
  onAccept,
  onReject,
  accepting,
}: Props) {
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
          setTimeout(() => onRejectRef.current(), 0);
        }
        return;
      }
      setLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [request.id, seconds]);

  const handleReject = () => {
    if (finishedRef.current || accepting) return;
    finishedRef.current = true;
    setTimeout(() => onReject(), 0);
  };

  const handleAccept = () => {
    if (finishedRef.current || accepting) return;
    finishedRef.current = true;
    setTimeout(() => onAccept(), 0);
  };

  const progress = left / seconds;
  const nearKm = request.distanceFromDriverKm;

  return (
    <View style={styles.card}>
      {/* Accent header strip */}
      <View style={styles.headerBand}>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE REQUEST</Text>
        </View>
        <View style={styles.timer}>
          <Text style={styles.timerText}>{left}s</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(progress * 100, 2)}%` }]} />
      </View>

      {/* Rider + fare hero */}
      <View style={styles.heroRow}>
        <View style={styles.avatar}>
          <UserRound size={26} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.riderName}>{request.riderName}</Text>
          <View style={styles.ratingRow}>
            <Star size={13} color={Colors.accent} fill={Colors.accent} />
            <Text style={styles.ratingText}>{request.riderRating.toFixed(1)} rider</Text>
            {request.isLiveServerRide ? (
              <View style={styles.nearPill}>
                <Zap size={11} color={Colors.primary} />
                <Text style={styles.nearPillText}>Nearest match</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.fareBox}>
          <Text style={styles.fareLabel}>Earn</Text>
          <Text style={styles.fare}>{formatInr(request.fare)}</Text>
        </View>
      </View>

      {/* Stats chips */}
      <View style={styles.chips}>
        <View style={styles.chip}>
          <Car size={14} color={Colors.primary} />
          <Text style={styles.chipText}>{request.vehicle}</Text>
        </View>
        <View style={styles.chip}>
          <Navigation2 size={14} color={Colors.primary} />
          <Text style={styles.chipText}>
            {request.distanceKm ? `${request.distanceKm} km trip` : 'Trip'}
          </Text>
        </View>
        {nearKm != null && Number.isFinite(nearKm) ? (
          <View style={[styles.chip, styles.chipAccent]}>
            <LocateFixed size={14} color={Colors.accentDark} />
            <Text style={[styles.chipText, styles.chipAccentText]}>
              {nearKm.toFixed(1)} km from you
            </Text>
          </View>
        ) : (
          <View style={styles.chip}>
            <Text style={styles.chipText}>~{request.etaMin} min</Text>
          </View>
        )}
        <View style={[styles.chip, styles.chipPay]}>
          <Wallet size={14} color={Colors.success} />
          <Text style={styles.chipText}>{request.payment}</Text>
        </View>
      </View>

      {/* Route card */}
      <View style={styles.route}>
        <View style={styles.routeIconCol}>
          <View style={styles.dotPickup} />
          <View style={styles.dash} />
          <MapPin size={18} color={Colors.accent} />
        </View>
        <View style={styles.routeTextCol}>
          <View style={styles.routeBlock}>
            <Text style={styles.routeLabel}>Pickup</Text>
            <Text style={styles.routeTitle} numberOfLines={2}>
              {request.pickup}
            </Text>
            {request.pickupArea && request.pickupArea !== request.pickup ? (
              <Text style={styles.routeSub} numberOfLines={1}>
                {request.pickupArea}
              </Text>
            ) : null}
          </View>
          <View style={styles.routeBlock}>
            <Text style={styles.routeLabel}>Drop</Text>
            <Text style={styles.routeTitle} numberOfLines={2}>
              {request.drop}
            </Text>
            {request.dropArea && request.dropArea !== request.drop ? (
              <Text style={styles.routeSub} numberOfLines={1}>
                {request.dropArea}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <Text style={styles.hint}>
        Accept quickly — only nearest drivers got this request
      </Text>

      <View style={styles.actions}>
        <Button
          title="Decline"
          variant="outline"
          onPress={handleReject}
          style={styles.flex}
          disabled={!!accepting}
        />
        <Button
          title={accepting ? 'Accepting…' : 'Accept ride'}
          variant="success"
          onPress={handleAccept}
          style={styles.flex}
          loading={!!accepting}
          leftIcon={!accepting ? <Navigation2 size={16} color={Colors.white} /> : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.floating,
    gap: 14,
    overflow: 'hidden',
  },
  headerBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.errorSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.error,
    letterSpacing: 0.6,
  },
  timer: {
    minWidth: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  timerText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
  progressTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: Colors.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  riderName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 4,
  },
  nearPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary + '14',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  nearPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  fareBox: {
    alignItems: 'flex-end',
  },
  fareLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
  },
  fare: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.success,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipAccent: {
    backgroundColor: Colors.accentSoft,
  },
  chipPay: {
    backgroundColor: Colors.successSoft,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chipAccentText: {
    color: Colors.accentDark,
  },
  route: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routeIconCol: {
    alignItems: 'center',
    paddingTop: 4,
    width: 20,
  },
  dotPickup: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.successSoft,
  },
  dash: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderStrong,
    marginVertical: 4,
    minHeight: 36,
  },
  routeTextCol: {
    flex: 1,
    gap: 16,
  },
  routeBlock: { gap: 2 },
  routeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  routeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 20,
  },
  routeSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: { flex: 1 },
});
