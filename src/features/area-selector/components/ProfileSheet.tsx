import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '@/theme';
import { Avatar, Button, Icon } from '@/components/shared';
import { Role, type UserSummaryResponse } from '@/types/auth';

export interface ProfileSheetHandle {
  open: () => void;
  close: () => void;
}

interface ProfileSheetProps {
  user: UserSummaryResponse | null;
  onLogout: () => void;
}

function roleLabel(role?: Role | null): string {
  if (role === Role.SUPER_ADMIN) return 'Super administrador';
  if (role === Role.ADMIN) return 'Administrador';
  if (role === Role.OPERATOR) return 'Operador';
  return 'Backoffice';
}

export const ProfileSheet = forwardRef<ProfileSheetHandle, ProfileSheetProps>(({ user, onLogout }, ref) => {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  const bottomPadding = Math.max(insets.bottom, spacing.md) + spacing.md;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={[styles.container, { paddingBottom: bottomPadding }]}>
          <View style={styles.headerRow}>
            <Text style={typography.title}>Perfil de Usuario</Text>
            <Pressable onPress={() => setVisible(false)} hitSlop={12}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.profileRow}>
            <Avatar initials={user?.initials ?? 'AR'} size={48} />
            <View style={styles.texts}>
              <Text style={typography.subtitle}>{user?.fullName ?? 'Usuario backoffice'}</Text>
              <Text style={typography.bodySm}>{roleLabel(user?.role)}</Text>
            </View>
          </View>
          <Button
            label="Cerrar sesión"
            variant="danger"
            fullWidth
            onPress={() => {
              setVisible(false);
              onLogout();
            }}
          />
        </View>
      </View>
    </Modal>
  );
});

ProfileSheet.displayName = 'ProfileSheet';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  texts: { gap: spacing.xxs },
});
