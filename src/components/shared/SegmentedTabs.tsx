import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';

export interface SegmentedTabOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  options: SegmentedTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedTabs<T extends string>({ options, value, onChange }: SegmentedTabsProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.borderSoft,
    borderRadius: radii.md,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  segment: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.sm, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.surface },
  label: { ...typography.bodySm, fontWeight: '600', textTransform: 'none', color: colors.textSecondary },
  labelActive: { color: colors.textPrimary },
});
