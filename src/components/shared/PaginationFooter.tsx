import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';
import { Icon } from './Icon';

interface PaginationFooterProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function PaginationFooter({ page, totalPages, onChange }: PaginationFooterProps) {
  if (totalPages <= 1) return null;

  return (
    <View style={styles.container}>
      <Pressable
        disabled={page === 0}
        onPress={() => onChange(page - 1)}
        style={[styles.button, page === 0 && styles.buttonDisabled]}
      >
        <Icon name="chevron-back" size={18} color={page === 0 ? colors.textTertiary : colors.textPrimary} />
      </Pressable>
      <Text style={typography.bodySm}>
        Página {page + 1} de {totalPages}
      </Text>
      <Pressable
        disabled={page >= totalPages - 1}
        onPress={() => onChange(page + 1)}
        style={[styles.button, page >= totalPages - 1 && styles.buttonDisabled]}
      >
        <Icon name="chevron-forward" size={18} color={page >= totalPages - 1 ? colors.textTertiary : colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
});
