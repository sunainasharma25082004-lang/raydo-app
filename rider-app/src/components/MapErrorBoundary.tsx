import React, { Component, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius } from '@/constants/Colors';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
};

type State = { hasError: boolean };

/**
 * Catches JS errors around the map. Native map crashes still need careful mounting.
 */
export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[MapErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={styles.box}>
          <Text style={styles.title}>Map temporarily unavailable</Text>
          <Text style={styles.sub}>You can still search and book a ride.</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              this.setState({ hasError: false });
              this.props.onRetry?.();
            }}
          >
            <Text style={styles.btnText}>Retry map</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  box: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.mapTint,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  btnText: {
    color: Colors.white,
    fontWeight: '800',
  },
});
