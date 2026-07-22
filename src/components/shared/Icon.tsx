import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

export type IconName = keyof typeof Ionicons.glyphMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

/** Set de iconos único para toda la app (Ionicons), reemplaza UiIcon.tsx del web. */
export function Icon({ name, size = 20, color = colors.textPrimary }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
