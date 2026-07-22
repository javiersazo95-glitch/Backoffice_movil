import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, minTapTarget } from '@/theme';
import { Icon } from '@/components/shared';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  onMenu?: () => void;
  right?: ReactNode;
}

/** Header consistente para todas las pantallas: back/menú + título + acción a la derecha. */
export function AppHeader({ title, onBack, onMenu, right }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.iconButton}>
            <Icon name="arrow-back" size={22} />
          </Pressable>
        ) : onMenu ? (
          <Pressable onPress={onMenu} hitSlop={12} style={styles.iconButton}>
            <Icon name="menu" size={22} />
          </Pressable>
        ) : null}
      </View>
      <Text style={[typography.subtitle, styles.title]} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  side: { width: minTapTarget, justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center' },
  right: { alignItems: 'flex-end' },
  iconButton: { width: minTapTarget, height: minTapTarget, alignItems: 'flex-start', justifyContent: 'center' },
});
