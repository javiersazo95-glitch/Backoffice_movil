import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

interface BrandLogoProps {
  size?: number;
}

export function BrandLogo({ size = 60 }: BrandLogoProps) {
  const scale = size / 60;
  const barWidth = 9 * scale;
  const barHeight = 36 * scale;
  const borderRadius = 4 * scale;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: 14 * scale }]}>
      <View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: barHeight,
            borderRadius,
            left: 17 * scale,
            top: 9 * scale,
            transform: [{ rotate: '28deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: barHeight,
            borderRadius,
            right: 17 * scale,
            top: 9 * scale,
            transform: [{ rotate: '-28deg' }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brand,
    position: 'relative',
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    backgroundColor: colors.white,
  },
});
