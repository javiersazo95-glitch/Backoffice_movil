import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { colors, radii, spacing, typography } from '@/theme';
import { Avatar, Button } from '@/components/shared';
import { Role, type UserSummaryResponse } from '@/types/auth';

export interface ProfileSheetHandle {
  open: () => void;
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
  const sheetRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.present(),
  }));

  const snapPoints = useMemo(() => ['32%'], []);

  return (
    <BottomSheetModal ref={sheetRef} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={styles.sheetBg}>
      <BottomSheetView style={styles.container}>
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
            sheetRef.current?.dismiss();
            onLogout();
          }}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
});

ProfileSheet.displayName = 'ProfileSheet';

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
  container: { padding: spacing.xl, gap: spacing.xl },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  texts: { gap: spacing.xxs },
});
