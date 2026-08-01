/**
 * Web stub for react-native-maps-directions (depends on react-native-maps).
 */
import type { ComponentType } from 'react';

type DirectionsProps = {
  origin?: unknown;
  destination?: unknown;
  waypoints?: unknown[];
  apikey?: string;
  strokeWidth?: number;
  strokeColor?: string;
  onReady?: (result: unknown) => void;
  onError?: (error: unknown) => void;
  mode?: string;
  precision?: string;
};

const MapViewDirections: ComponentType<DirectionsProps> = () => null;

export default MapViewDirections;
