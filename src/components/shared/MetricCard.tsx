import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, toneColors, StatusTone } from '@/theme';
import { Card } from './Card';
import { Icon, IconName } from './Icon';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: IconName;
  tone?: StatusTone;
  onPress?: () => void;
  style?: ViewStyle;
}

export function MetricCard({ label, value, subtitle, icon, tone = 'brand', onPress, style }: MetricCardProps) {
  const palette = toneColors[tone];
  return (
    <Card onPress={onPress} style={StyleSheet.flatten([styles.card, style])}>
      <View style={styles.row}>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: palette.bg }]}>
            <Icon name={icon} size={15} color={palette.fg} />
          </View>
        ) : null}
        <View style={styles.texts}>
          <Text style={styles.valueText} numberOfLines={1}>{value}</Text>
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, minWidth: 0, justifyContent: 'center' },
  valueText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  label: { fontSize: 10.5, fontWeight: '700', color: colors.textSecondary },
  subtitle: { fontSize: 9.5, color: colors.textTertiary, lineHeight: 11 },
});
