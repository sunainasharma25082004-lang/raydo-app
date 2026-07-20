import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Radius, Shadow } from '@/constants/Colors';

type Props = {
  online: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function OnlineToggle({ online, onChange, disabled }: Props) {
  const offset = useSharedValue(online ? 1 : 0);

  React.useEffect(() => {
    offset.value = withSpring(online ? 1 : 0, { damping: 16, stiffness: 180 });
  }, [online, offset]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value * 28 }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onChange(!online)}
      style={[styles.wrap, online ? styles.wrapOn : styles.wrapOff, disabled && styles.disabled]}
    >
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: online ? Colors.online : Colors.offline }]} />
        <View>
          <Text style={styles.title}>{online ? "You're Online" : "You're Offline"}</Text>
          <Text style={styles.sub}>
            {online ? 'Ready to receive ride requests' : 'Go online to start earning'}
          </Text>
        </View>
      </View>

      <View style={[styles.track, online ? styles.trackOn : styles.trackOff]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    ...Shadow.soft,
  },
  wrapOn: {
    backgroundColor: Colors.successSoft,
    borderColor: '#B7E4C7',
  },
  wrapOff: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  disabled: { opacity: 0.5 },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  sub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  track: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: Colors.success },
  trackOff: { backgroundColor: '#CBD5E1' },
  knob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    ...Shadow.soft,
  },
});
