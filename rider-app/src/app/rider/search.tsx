import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow } from '@/constants/Colors';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { API_BASE } from '@/lib/config';

type Place = {
  key: string;
  title: string;
  subtitle: string;
  lat: string;
  lng: string;
};

const FALLBACK_PLACES: Place[] = [
  {
    key: 'fb1',
    title: 'Phoenix Marketcity',
    subtitle: 'Whitefield, Bengaluru',
    lat: '12.997',
    lng: '77.696',
  },
  {
    key: 'fb2',
    title: 'Indiranagar Metro',
    subtitle: 'CMH Road, Bengaluru',
    lat: '12.978',
    lng: '77.641',
  },
  {
    key: 'fb3',
    title: 'Koramangala 5th Block',
    subtitle: 'Bengaluru',
    lat: '12.935',
    lng: '77.624',
  },
  {
    key: 'fb4',
    title: 'Kempegowda Airport',
    subtitle: 'Devanahalli, Bengaluru',
    lat: '13.199',
    lng: '77.706',
  },
];

function asText(v: unknown): string {
  if (v == null) return '';
  if (Array.isArray(v)) return String(v[0] ?? '');
  return String(v);
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const { coords, address, loading, refresh } = useCurrentLocation({
    watch: false,
    highAccuracy: true,
  });

  const [pickup, setPickup] = useState(asText(params.pickup));
  const [drop, setDrop] = useState(asText(params.drop));
  const [pickupLat, setPickupLat] = useState(asText(params.pickupLat));
  const [pickupLng, setPickupLng] = useState(asText(params.pickupLng));
  const [places, setPlaces] = useState<Place[]>(FALLBACK_PLACES);
  const [searching, setSearching] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Type destination then wait…');
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // GPS pickup fill
  useEffect(() => {
    if (!coords) return;
    setPickupLat(String(coords.latitude));
    setPickupLng(String(coords.longitude));
    if (!pickup || pickup.toLowerCase() === 'current location') {
      if (address) setPickup(address);
    }
  }, [coords, address]);

  // Live autocomplete (safe, never crash render)
  useEffect(() => {
    if (timer) clearTimeout(timer);

    const q = drop.trim();
    if (q.length < 2) {
      setPlaces(FALLBACK_PLACES);
      setSearching(false);
      setStatusMsg('Suggested places');
      return;
    }

    setSearching(true);
    setStatusMsg('Searching…');

    const t = setTimeout(() => {
      const bias =
        coords != null
          ? `&bias=proximity:${coords.longitude},${coords.latitude}`
          : '';
      const url = `${API_BASE}/api/map/autocomplete?text=${encodeURIComponent(q)}${bias}`;

      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data?.suggestions) ? data.suggestions : [];
          const next: Place[] = [];

          for (let i = 0; i < list.length; i++) {
            try {
              const s = list[i];
              if (!s) continue;
              const title = asText(s.name || s.label);
              const subtitle = asText(s.label || s.city);
              if (!title) continue;
              next.push({
                key: `p-${i}-${title}`,
                title,
                subtitle: subtitle || title,
                lat: asText(s.lat),
                lng: asText(s.lng),
              });
            } catch {
              // skip bad row
            }
          }

          if (next.length > 0) {
            setPlaces(next);
            setStatusMsg('Live search results');
          } else {
            setPlaces(FALLBACK_PLACES);
            setStatusMsg('No live results — showing suggestions');
          }
        })
        .catch(() => {
          setPlaces(FALLBACK_PLACES);
          setStatusMsg('Map API offline — showing suggestions');
        })
        .finally(() => setSearching(false));
    }, 450);

    setTimer(t);
    return () => clearTimeout(t);
  }, [drop, coords?.latitude, coords?.longitude]);

  const goVehicle = (dropName: string, dLat = '', dLng = '') => {
    const name = (dropName || drop || '').trim();
    if (name.length < 2) return;

    router.push({
      pathname: '/rider/vehicle',
      params: {
        pickup: pickup || address || 'Current location',
        drop: name,
        pickupLat: pickupLat || (coords ? String(coords.latitude) : ''),
        pickupLng: pickupLng || (coords ? String(coords.longitude) : ''),
        dropLat: dLat,
        dropLng: dLng,
      },
    });
  };

  const onSelect = (p: Place) => {
    setDrop(p.title);
    goVehicle(p.title, p.lat, p.lng);
  };

  // Build rows as plain array of elements (no .map crash surface)
  const rows: React.ReactNode[] = [];
  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    if (!p || !p.key) continue;
    rows.push(
      <Pressable
        key={p.key}
        style={styles.row}
        onPress={() => onSelect(p)}
      >
        <View style={styles.iconBox}>
          <Text style={styles.pin}>📍</Text>
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {p.title}
          </Text>
          <Text style={styles.rowSub} numberOfLines={2}>
            {p.subtitle}
          </Text>
        </View>
      </Pressable>,
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) + 8 }]}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Plan your ride</Text>
          <Text style={styles.headerSub}>{statusMsg}</Text>
        </View>
        {searching ? <ActivityIndicator color={Colors.primary} /> : null}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.card}>
          <Text style={styles.label}>PICKUP</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={loading && !pickup ? 'Getting GPS…' : pickup}
              onChangeText={setPickup}
              placeholder="Pickup"
              placeholderTextColor={Colors.textLight}
            />
            <Pressable style={styles.gpsBtn} onPress={() => refresh()}>
              <Text style={styles.gpsBtnText}>GPS</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>DROP</Text>
          <TextInput
            style={styles.input}
            value={drop}
            onChangeText={setDrop}
            placeholder="Where to?"
            placeholderTextColor={Colors.textLight}
            autoFocus
          />
        </View>

        {coords ? (
          <Text style={styles.hint}>
            GPS {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </Text>
        ) : null}

        <Pressable
          style={[styles.continue, drop.trim().length < 2 && styles.continueOff]}
          disabled={drop.trim().length < 2}
          onPress={() => goVehicle(drop.trim())}
        >
          <Text style={styles.continueText}>Choose vehicle →</Text>
        </Pressable>

        <Text style={styles.section}>{statusMsg}</Text>
        {rows}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 20, color: Colors.text, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textLight, marginTop: 2, fontWeight: '600' },
  scroll: { paddingBottom: 40 },
  card: {
    margin: 16,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textLight,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: 10,
  },
  gpsBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  gpsBtnText: { color: Colors.accent, fontWeight: '800', fontSize: 12 },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  hint: {
    marginHorizontal: 20,
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '600',
    marginBottom: 8,
  },
  continue: {
    marginHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  continueOff: { opacity: 0.4 },
  continueText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  section: {
    marginHorizontal: 20,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textLight,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pin: { fontSize: 18 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  rowSub: { fontSize: 12, color: Colors.textLight, marginTop: 2, fontWeight: '500' },
});
