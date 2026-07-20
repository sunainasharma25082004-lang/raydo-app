import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Colors, Radius } from '@/constants/Colors';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.text, textVariantStyles[variant], sizeTextStyles[size], textStyle]}>
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.md,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: 10, paddingHorizontal: 14, minHeight: 40 },
  md: { paddingVertical: 14, paddingHorizontal: 18, minHeight: 52 },
  lg: { paddingVertical: 16, paddingHorizontal: 22, minHeight: 56 },
});

const sizeTextStyles = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 16 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: Colors.primary },
  accent: { backgroundColor: Colors.accent },
  outline: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.error },
  success: { backgroundColor: Colors.success },
});

const textVariantStyles = StyleSheet.create({
  primary: { color: Colors.textOnPrimary },
  accent: { color: Colors.textOnAccent },
  outline: { color: Colors.primary },
  ghost: { color: Colors.primary },
  danger: { color: Colors.white },
  success: { color: Colors.white },
});
