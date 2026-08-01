/**
 * Web stub for react-native-maps.
 *
 * The real package imports Fabric native specs that call codegenNativeComponent,
 * which react-native-web does not implement. Expo Router still bundles map
 * screens for web, so we resolve this module on web instead of the native package.
 */
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type LatLng = {
  latitude: number;
  longitude: number;
};

export const PROVIDER_GOOGLE = 'google' as const;
export const PROVIDER_DEFAULT = undefined;

type MapViewProps = ViewProps & {
  style?: StyleProp<ViewStyle>;
  region?: Region;
  initialRegion?: Region;
  provider?: string | null;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  followsUserLocation?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  toolbarEnabled?: boolean;
  customMapStyle?: unknown[];
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: (event: unknown) => void;
  children?: React.ReactNode;
};

const MapView = forwardRef<View, MapViewProps>(function MapView(
  { style, children, region, initialRegion, ...rest },
  ref
) {
  const r = region ?? initialRegion;
  return (
    <View ref={ref} style={[styles.container, style]} {...rest}>
      <Text style={styles.title}>Map preview (web)</Text>
      {r ? (
        <Text style={styles.coords}>
          {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
        </Text>
      ) : (
        <Text style={styles.coords}>Maps run on iOS / Android</Text>
      )}
      <View style={styles.hidden}>{children}</View>
    </View>
  );
});

type MarkerProps = {
  coordinate?: LatLng;
  title?: string;
  description?: string;
  pinColor?: string;
  anchor?: { x: number; y: number };
  tracksViewChanges?: boolean;
  children?: React.ReactNode;
  onPress?: () => void;
};

export function Marker(_props: MarkerProps) {
  return null;
}

type PolylineProps = {
  coordinates?: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
  lineDashPattern?: number[];
};

export function Polyline(_props: PolylineProps) {
  return null;
}

export function Circle() {
  return null;
}

export function Polygon() {
  return null;
}

export function Callout({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export default MapView;
export { MapView };

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E8F1F8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B5FFF',
  },
  coords: {
    marginTop: 4,
    fontSize: 12,
    color: '#475569',
  },
  hidden: {
    width: 0,
    height: 0,
    overflow: 'hidden',
  },
});
