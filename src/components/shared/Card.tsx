import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, Pressable } from 'react-native';
import { colors, radii, spacing, shadows } from '@/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ children, style, onPress, padded = true }: CardProps) {
  const content = <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.card,
  },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.85 },
});
