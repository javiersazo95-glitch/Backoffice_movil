import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Role } from '@/types/auth';
import { RootStackParamList } from '@/navigation/types';
import { BrandLogo, Icon, IconName, ScreenContainer } from '@/components/shared';
import { colors, radii, spacing } from '@/theme';
import { ProfileSheet, ProfileSheetHandle } from '../components/ProfileSheet';

export function AreaSelectorScreen() {
  const { user, logout } = useAuth();
  const { isAreaEnabled } = usePermissions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const profileSheetRef = useRef<ProfileSheetHandle>(null);
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  const roleLabel =
    user?.role === Role.SUPER_ADMIN
      ? 'Super Administrador'
      : user?.role === Role.ADMIN
      ? 'Administrador'
      : user?.role === Role.OPERATOR
      ? 'Operador'
      : 'Backoffice';

  // 4 Tarjetas coloridas en 1 Columna con fondos suaves, bordes vivos e icono gigante máximo
  const allRows = [
    {
      key: 'administracion',
      title: 'Administración Contable',
      subtitle: 'Gestión financiera, usuarios y configuración del sistema.',
      icon: 'wallet-outline' as IconName,
      route: 'Administracion' as keyof RootStackParamList,
      color: '#059669',
      titleColor: '#047857',
      borderColor: '#10B981',
      bgCard: '#ECFDF5',
      iconBg: '#D1FAE5',
      enabled: isAreaEnabled('administracion', user),
    },
    {
      key: 'soporte',
      title: 'Soporte Técnico',
      subtitle: 'Gestión de tickets, casos y atención a vendedores.',
      icon: 'headset-outline' as IconName,
      route: 'Soporte' as keyof RootStackParamList,
      color: '#0284C7',
      titleColor: '#0369A1',
      borderColor: '#38BDF8',
      bgCard: '#F0F9FF',
      iconBg: '#E0F2FE',
      enabled: isAreaEnabled('soporte', user),
    },
    {
      key: 'confianza',
      title: 'Confianza y Mediación',
      subtitle: 'Revisión, mediación y resolución de casos y disputas.',
      icon: 'scale-outline' as IconName,
      route: 'Confianza' as keyof RootStackParamList,
      color: '#9333EA',
      titleColor: '#7E22CE',
      borderColor: '#C084FC',
      bgCard: '#F5EFFF',
      iconBg: '#EDE9FE',
      enabled: isAreaEnabled('confianza', user),
    },
    {
      key: 'permisos',
      title: 'Gestión de Permisos',
      subtitle: 'Administración de accesos por correo y rol operativo.',
      icon: 'shield-checkmark-outline' as IconName,
      route: 'Permissions' as keyof RootStackParamList,
      color: '#D97706',
      titleColor: '#B45309',
      borderColor: '#F59E0B',
      bgCard: '#FEF3C7',
      iconBg: '#FDE68A',
      enabled: isSuperAdmin,
    },
  ];

  return (
    <ScreenContainer scroll={false} padded={false}>
      {/* Header Superior */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <BrandLogo size={32} variant="mark" />
          <View style={styles.brandTitleWrap}>
            <Text style={styles.brandTitle}>
              RepuesTop <Text style={styles.brandAccent}>BackOffice</Text>
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.profilePill}
          onPress={() => profileSheetRef.current?.open()}
          hitSlop={8}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.initials ?? 'AR'}</Text>
          </View>
          <Text style={styles.profileText}>{roleLabel}</Text>
          <Icon name="chevron-down" size={13} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Contenido Principal: 4 Filas Coloridas en 1 Columna (Sin Scroll) */}
      <View style={styles.mainContainer}>
        <View style={styles.headerCopy}>
          <Icon name="grid-outline" size={18} color={colors.brand} />
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerCopyTitle}>Accesos principales</Text>
            <Text style={styles.headerCopySub}>Selecciona un área para comenzar a operar</Text>
          </View>
        </View>

        <View style={styles.fourRowsColumn}>
          {allRows.map((item) => (
            <Pressable
              key={item.key}
              disabled={!item.enabled}
              onPress={() => navigation.navigate(item.route as never)}
              style={({ pressed }) => [
                styles.vibrantCardRow,
                {
                  borderColor: item.enabled ? item.borderColor : colors.border,
                  backgroundColor: item.enabled ? item.bgCard : colors.surfaceAlt,
                },
                !item.enabled && styles.cardDisabled,
                pressed && item.enabled && styles.cardPressed,
              ]}
            >
              <View style={styles.cardCenterLayout}>
                {/* Icono Máximo Gigante Encasillado */}
                <View
                  style={[
                    styles.giantSquircleBox,
                    {
                      borderColor: item.enabled ? item.borderColor : colors.border,
                      backgroundColor: item.enabled ? item.iconBg : colors.borderSoft,
                    },
                  ]}
                >
                  <Icon
                    name={item.enabled ? item.icon : 'lock-closed'}
                    size={46}
                    color={item.enabled ? item.color : colors.textTertiary}
                  />
                </View>

                {/* Nombre del Área y Subtítulo */}
                <View style={styles.cardTitleWrap}>
                  <Text
                    style={[
                      styles.vibrantCardTitle,
                      { color: item.enabled ? item.titleColor : colors.textTertiary },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.vibrantCardSub,
                      { color: item.enabled ? item.color : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </View>

              {!item.enabled ? (
                <View style={styles.disabledBadgeAbsolute}>
                  <Icon name="lock-closed" size={11} color={colors.textTertiary} />
                  <Text style={styles.disabledBadgeText}>Sin Acceso</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>

        <Text style={styles.footerText}>
          © 2026 RepuesTop Chile · Panel Administrativo
        </Text>
      </View>

      <ProfileSheet
        ref={profileSheetRef}
        user={user}
        onLogout={() => {
          void logout();
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandTitleWrap: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  brandAccent: {
    color: colors.brand,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 36,
    paddingLeft: spacing.xxs,
    paddingRight: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.white,
  },
  profileText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  headerCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xxs,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerCopyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerCopySub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  fourRowsColumn: {
    flex: 1,
    gap: spacing.xs,
    marginVertical: spacing.xxs,
  },
  vibrantCardRow: {
    flex: 1,
    borderWidth: 2,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardCenterLayout: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  giantSquircleBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitleWrap: {
    alignItems: 'center',
  },
  vibrantCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  vibrantCardSub: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
  disabledBadgeAbsolute: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.borderSoft,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  disabledBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textTertiary,
    marginVertical: 2,
  },
});
