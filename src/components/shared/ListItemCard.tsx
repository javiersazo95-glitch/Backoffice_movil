import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';
import { Icon } from './Icon';

interface ListItemCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  rightBadge?: ReactNode;
  onPress?: () => void;
  leading?: ReactNode;
  showChevron?: boolean;
}

/**
 * Tarjeta de lista genérica: reemplaza las filas de <table> del backoffice web.
 * Usada dentro de FlatList en todos los listados (pedidos, retiros, tickets,
 * mediaciones, vendedores, validaciones, alertas, bitácora, reportes).
 */
export function ListItemCard({
  title,
  subtitle,
  meta,
  rightBadge,
  onPress,
  leading,
  showChevron = true,
}: ListItemCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed]}
    >
      {leading}
      <View style={styles.texts}>
        <Text style={typography.subtitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[typography.bodySm, styles.subtitle]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text style={typography.caption} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {rightBadge ? <View style={styles.badgeSlot}>{rightBadge}</View> : null}
      {onPress && showChevron ? <Icon name="chevron-forward" size={18} color={colors.textTertiary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.85, backgroundColor: colors.surfaceAlt },
  texts: { flex: 1, gap: spacing.xxs },
  subtitle: { textTransform: 'none' },
  badgeSlot: { alignItems: 'flex-end' },
});
