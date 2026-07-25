import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
  Linking,
  AppState,
  type AppStateStatus,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow } from '@/constants/Colors';
import {
  Bell,
  Search,
  Clock,
  Home,
  Briefcase,
  RefreshCw,
  MapPin,
  Sparkles,
  Crosshair,
} from 'lucide-react-native';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { MapErrorBoundary } from '@/components/MapErrorBoundary';
import { api } from '@/lib/api';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

/** Fallback region (Bengaluru) until GPS is ready */
const DEFAULT_REGION: Region = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

const TAB_BAR_H = Platform.OS === 'ios' ? 84 : 68;

/** How long to wait after home is stable before mounting MapView (MIUI crash fix) */
const MAP_MOUNT_DELAY_MS = 1500;

const RECENT_PLACES = [
  {
    id: '1',
    name: 'Phoenix Marketcity',
    address: 'Whitefield Main Rd',
    time: '2h ago',
    emoji: '🛍️',
  },
  {
    id: '2',
    name: 'Kempegowda Airport',
    address: 'Devanahalli',
    time: 'Yesterday',
    emoji: '✈️',
  },
  {
    id: '3',
    name: 'Indiranagar Metro',
    address: 'CMH Road',
    time: '3d ago',
    emoji: '🚇',
  },
  {
    id: '4',
    name: 'Koramangala 5th Block',
    address: '80 Feet Road',
    time: '1w ago',
    emoji: '☕',
  },
];

const QUICK = [
  { id: 'home', label: 'Home', icon: Home, color: Colors.primary },
  { id: 'work', label: 'Work', icon: Briefcase, color: Colors.accentDark },
  { id: 'saved', label: 'Saved', icon: MapPin, color: Colors.success },
];

export default function RiderHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const didCenterRef = useRef(false);

  // Home must NEVER open the permission dialog while MapView is loading.
  // Permission is requested on login screen. Here we only read GPS if already allowed.
  const { coords, address, loading, error, refresh } = useCurrentLocation({
    watch: true,
    highAccuracy: false,
    autoStart: true,
    onlyIfGranted: true,
    startDelayMs: 1800,
  });

  const [mapReady, setMapReady] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [mapDisabled, setMapDisabled] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);

  // Poll for nearby drivers
  useEffect(() => {
    if (!coords) return;
    const fetchDrivers = async () => {
      try {
        const res = await api.get(`/platform/nearby-drivers?lat=${coords.latitude}&lng=${coords.longitude}`);
        if (res.data) setNearbyDrivers(res.data);
      } catch (err) {}
    };
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 3000);
    return () => clearInterval(interval);
  }, [coords]);

  // Mount map only when app is active + delayed (permission Activity fully gone)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tryMount = () => {
      if (cancelled || mapDisabled) return;
      if (AppState.currentState !== 'active') return;
      timer = setTimeout(() => {
        if (!cancelled && AppState.currentState === 'active') {
          setShowMap(true);
        }
      }, MAP_MOUNT_DELAY_MS);
    };

    tryMount();

    const onState = (s: AppStateStatus) => {
      if (s === 'active' && !showMap) tryMount();
    };
    const sub = AppState.addEventListener('change', onState);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapDisabled]);

  // When live GPS arrives → move map pointer
  useEffect(() => {
    if (!coords || !mapReady || !showMap) return;

    const next: Region = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    try {
      if (!didCenterRef.current) {
        didCenterRef.current = true;
        mapRef.current?.animateToRegion(next, 500);
      } else {
        mapRef.current?.animateToRegion(next, 350);
      }
    } catch {
      /* ignore animate failures */
    }
  }, [coords?.latitude, coords?.longitude, mapReady, showMap]);

  const goToMyLocation = useCallback(async () => {
    try {
      await refresh();
    } catch {
      Linking.openSettings();
    }
  }, [refresh]);

  const retryMap = useCallback(() => {
    setMapDisabled(false);
    setShowMap(false);
    setMapReady(false);
    didCenterRef.current = false;
    setMapKey((k) => k + 1);
    setTimeout(() => setShowMap(true), MAP_MOUNT_DELAY_MS);
  }, []);

  const goSearch = (drop?: string) => {
    router.push({
      pathname: '/rider/search',
      params: {
        pickup: address || 'Current location',
        pickupLat: coords ? String(coords.latitude) : '',
        pickupLng: coords ? String(coords.longitude) : '',
        drop: drop || '',
      },
    });
  };

  const sheetMaxH = SCREEN_H * 0.48;
  const bottomPad = TAB_BAR_H + Math.max(insets.bottom, 0);

  const mapFallback = (
    <View style={[styles.map, styles.mapPlaceholder]}>
      <MapPin color={Colors.primary} size={32} />
      <Text style={styles.mapFallbackTitle}>Map ready soon</Text>
      <Text style={styles.mapFallbackSub}>You can still search & book below</Text>
      {mapDisabled ? (
        <TouchableOpacity style={styles.mapRetryBtn} onPress={retryMap}>
          <Text style={styles.mapRetryText}>Show map</Text>
        </TouchableOpacity>
      ) : (
        <ActivityIndicator style={{ marginTop: 12 }} color={Colors.primary} />
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Map loads late + simple pin only — custom marker Views crash some Xiaomi devices */}
      {showMap && !mapDisabled ? (
        <MapErrorBoundary
          key={mapKey}
          onRetry={retryMap}
          fallback={mapFallback}
        >
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={
              coords
                ? {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }
                : DEFAULT_REGION
            }
            onMapReady={() => setMapReady(true)}
            // If native map dies, user can continue with sheet UI
            onMapLoaded={() => setMapReady(true)}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsBuildings={false}
            showsTraffic={false}
            showsIndoors={false}
            loadingEnabled={false}
            moveOnMarkerPress={false}
            toolbarEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            liteMode={false}
          >
              {coords ? (
                <Marker
                  coordinate={{
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                  }}
                  title="You are here"
                  description={address || 'Live location'}
                  pinColor={Colors.primary}
                />
              ) : null}

              {nearbyDrivers.map((d) => (
                <Marker
                  key={d.id}
                  coordinate={{
                    latitude: d.latitude,
                    longitude: d.longitude,
                  }}
                  title={d.vehicleType}
                  description="Nearby driver"
                  pinColor={Colors.accentDark}
                />
              ))}
            </MapView>
        </MapErrorBoundary>
      ) : (
        mapFallback
      )}

      {loading && !coords ? (
        <View style={styles.gpsBanner}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.gpsBannerText}>Getting live location…</Text>
        </View>
      ) : null}

      {error && !coords ? (
        <View style={[styles.gpsBanner, styles.gpsBannerError]}>
          <Text style={styles.gpsBannerTextError} numberOfLines={2}>
            {error}
          </Text>
          <TouchableOpacity style={styles.gpsRetry} onPress={goToMyLocation}>
            <RefreshCw size={14} color={Colors.white} />
            <Text style={styles.gpsRetryText}>Allow / Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={[styles.topBar, { top: Math.max(insets.top, 10) + 6 }]}>
        <View style={styles.brandPill}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>R</Text>
          </View>
          <Text style={styles.logoText}>Raydo</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
          <Bell color={Colors.primary} size={20} />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.locateBtn, { bottom: sheetMaxH + 12 }]}
        onPress={goToMyLocation}
        activeOpacity={0.9}
      >
        <Crosshair color={Colors.primary} size={22} />
      </TouchableOpacity>

      <View
        style={[
          styles.sheet,
          {
            maxHeight: sheetMaxH,
            bottom: bottomPad,
          },
        ]}
      >
        <View style={styles.handle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.sheetScroll}
          nestedScrollEnabled
        >
          <View style={styles.greetingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Where to next?</Text>
              <View style={styles.liveRow}>
                <View style={[styles.liveDot, !coords && styles.liveDotOff]} />
                <Text style={styles.locationChipText} numberOfLines={2}>
                  {loading && !coords
                    ? 'Detecting live location…'
                    : address || error || 'Tap location button to enable GPS'}
                </Text>
              </View>
            </View>
            <View style={styles.sparkle}>
              <Sparkles size={16} color={Colors.accentDark} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.searchCard}
            activeOpacity={0.92}
            onPress={() => goSearch()}
          >
            <View style={styles.searchIconWrap}>
              <Search color={Colors.primary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.searchLabel}>Plan a ride</Text>
              <Text style={styles.searchText}>Search destination</Text>
            </View>
            <View style={styles.goChip}>
              <Text style={styles.goChipText}>Go</Text>
            </View>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
          >
            {QUICK.map((q) => {
              const Icon = q.icon;
              return (
                <TouchableOpacity
                  key={q.id}
                  style={styles.pill}
                  onPress={() => goSearch()}
                  activeOpacity={0.88}
                >
                  <View style={[styles.pillIcon, { backgroundColor: q.color + '18' }]}>
                    <Icon color={q.color} size={16} />
                  </View>
                  <Text style={styles.pillText}>{q.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionLabel}>Recent places</Text>

          {RECENT_PLACES.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.recentRow}
              activeOpacity={0.88}
              onPress={() => goSearch(place.name)}
            >
              <View style={styles.recentIconBg}>
                <Text style={{ fontSize: 18 }}>{place.emoji}</Text>
              </View>
              <View style={styles.recentTextContainer}>
                <Text style={styles.recentName}>{place.name}</Text>
                <Text style={styles.recentAddress}>{place.address}</Text>
              </View>
              <View style={styles.timeChip}>
                <Clock color={Colors.textLight} size={12} />
                <Text style={styles.recentTime}>{place.time}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 12 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.mapTint,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  mapPlaceholder: {
    backgroundColor: Colors.mapTint,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  mapFallbackTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  mapFallbackSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  mapRetryBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  mapRetryText: {
    color: Colors.white,
    fontWeight: '800',
  },
  gpsBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 90,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
    maxWidth: SCREEN_W - 40,
    ...Shadow.card,
    zIndex: 5,
  },
  gpsBannerError: {
    flexDirection: 'column',
    borderRadius: Radius.lg,
    alignItems: 'flex-start',
    gap: 10,
    maxWidth: SCREEN_W - 32,
  },
  gpsBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  gpsBannerTextError: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.error,
  },
  gpsRetry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  gpsRetryText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 4,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    ...Shadow.soft,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: Colors.accent,
    fontWeight: '800',
    fontSize: 15,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },
  badge: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  locateBtn: {
    position: 'absolute',
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
    ...Shadow.card,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingTop: 8,
    zIndex: 3,
    ...Shadow.floating,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderStrong,
    marginBottom: 8,
  },
  sheetScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingRight: 4,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveDotOff: {
    backgroundColor: Colors.warning,
  },
  locationChipText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sparkle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
    marginBottom: 12,
  },
  searchIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  goChip: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  goChipText: {
    color: Colors.accent,
    fontWeight: '800',
    fontSize: 13,
  },
  pillsRow: {
    gap: 10,
    paddingBottom: 4,
    paddingRight: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    marginRight: 4,
  },
  pillIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentTextContainer: {
    flex: 1,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  recentAddress: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  recentTime: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '600',
  },
});
