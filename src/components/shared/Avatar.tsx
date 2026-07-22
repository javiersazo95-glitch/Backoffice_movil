import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '@/theme';

interface AvatarProps {
  initials: string;
  size?: number;
}

export function Avatar({ initials, size = 40 }: AvatarProps) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[typography.bodySm, styles.text]}>{initials.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  text: { color: colors.brandDark, fontWeight: '700', textTransform: 'none' },
});
