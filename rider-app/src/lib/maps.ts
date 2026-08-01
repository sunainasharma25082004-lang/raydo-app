/**
 * Native maps entry (iOS / Android).
 * Web uses maps.web.ts via Metro platform resolution.
 */
import MapView from 'react-native-maps';

export default MapView;
export { MapView };
export {
  Marker,
  Polyline,
  Circle,
  Polygon,
  Callout,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
export type { Region, LatLng, MapViewProps, MapMarkerProps } from 'react-native-maps';
