import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.brand} size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.huge },
  label: { ...typography.body, color: colors.textSecondary },
});
