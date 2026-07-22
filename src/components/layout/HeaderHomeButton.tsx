import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '@/components/shared/Icon';
import { colors, radii, spacing } from '@/theme';

export function HeaderHomeButton() {
  const navigation = useNavigation<any>();

  return (
    <Pressable
      style={styles.button}
      onPress={() => navigation.navigate('AreaSelector')}
      hitSlop={8}
    >
      <Icon name="home-outline" size={16} color={colors.textSecondary} />
      <Text style={styles.label}>Áreas</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
