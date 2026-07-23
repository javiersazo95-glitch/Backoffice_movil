import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface BrandLogoProps {
  size?: number;
  variant?: 'full' | 'mark';
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export function BrandLogo({ size = 60, variant = 'full', style, imageStyle }: BrandLogoProps) {
  const source =
    variant === 'mark'
      ? require('../../../assets/logo-mark.png')
      : require('../../../assets/logo.png');

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={source}
        style={[{ width: '100%', height: '100%', resizeMode: 'contain' }, imageStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});

