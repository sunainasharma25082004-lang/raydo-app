import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Radius } from '@/constants/Colors';
import { useAppTheme } from '@/context/ThemeContext';

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
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;

  const variantStyles = useMemo(() => {
    return {
      primary: { backgroundColor: colors.primary },
      accent: { backgroundColor: colors.accent },
      outline: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderStrong,
      },
      ghost: { backgroundColor: 'transparent' },
      danger: { backgroundColor: colors.error },
      success: { backgroundColor: colors.success },
    } as const;
  }, [colors]);

  const textVariantStyles = useMemo(() => {
    return {
      primary: { color: colors.textOnPrimary },
      accent: { color: colors.textOnAccent },
      outline: { color: colors.primary },
      ghost: { color: colors.primary },
      danger: { color: colors.white },
      success: { color: colors.white },
    } as const;
  }, [colors]);

  const spinnerColor =
    variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white;

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
        <ActivityIndicator color={spinnerColor} />
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
