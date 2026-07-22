import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, toneColors, typography, StatusTone } from '@/theme';
import { Card } from './Card';
import { Icon, IconName } from './Icon';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: IconName;
  tone?: StatusTone;
  onPress?: () => void;
}

export function MetricCard({ label, value, icon, tone = 'brand', onPress }: MetricCardProps) {
  const palette = toneColors[tone];
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: palette.bg }]}>
            <Icon name={icon} size={18} color={palette.fg} />
          </View>
        ) : null}
        <View style={styles.texts}>
          <Text style={typography.displaySm}>{value}</Text>
          <Text style={[typography.bodySm, styles.label]}>{label}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { minWidth: 150, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  texts: { gap: spacing.xxs, flexShrink: 1 },
  label: { textTransform: 'none', color: colors.textSecondary },
});
