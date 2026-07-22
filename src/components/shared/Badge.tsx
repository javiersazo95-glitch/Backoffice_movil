import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radii, spacing, toneColors, typography, StatusTone } from '@/theme';

interface BadgeProps {
  label: string;
  tone?: StatusTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const palette = toneColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[typography.caption, { color: palette.fg, textTransform: 'none' }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs + 2,
    alignSelf: 'flex-start',
  },
});
