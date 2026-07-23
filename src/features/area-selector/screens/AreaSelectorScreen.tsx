import React, { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Role } from '@/types/auth';
import { RootStackParamList } from '@/navigation/types';
import { BrandLogo, Icon, IconName, ScreenContainer } from '@/components/shared';
import { colors, radii, spacing, toneColors } from '@/theme';
import { ProfileSheet, ProfileSheetHandle } from '../components/ProfileSheet';

type AreaKey = 'administracion' | 'soporte' | 'confianza';

interface AreaCardItem {
  key: AreaKey;
  title: string;
  subtitle: string;
  description: string;
  badgeText: string;
  icon: IconName;
  route: keyof RootStackParamList;
  color: string;
  softBg: string;
  badgeBg: string;
}

const areas: AreaCardItem[] = [
  {
    key: 'soporte',
    title: 'Soporte Técnico',
    subtitle: 'Atención al Cliente y Vendedores',
    description: 'Mesa de ayuda para responder tickets, incidencias de pago y reportes QA en tiempo real.',
    badgeText: '🔥 5 Tickets Nuevos',
    icon: 'headset',
    route: 'Soporte',
    color: colors.brand,
    softBg: '#F0F6FF',
    badgeBg: toneColors.brand.bg,
  },
  {
    key: 'confianza',
    title: 'Confianza y Mediación',
    subtitle: 'Resolución de Casos y Disputas',
    description: 'Gestión de reclamos, mediación entre comprador/vendedor y aprobación de nuevas tiendas.',
    badgeText: '⚖️ 14 Casos Activos',
    icon: 'scale',
    route: 'Confianza',
    color: colors.violet,
    softBg: '#F5EFFF',
    badgeBg: toneColors.violet.bg,
  },
  {
    key: 'administracion',
    title: 'Administración Contable',
    subtitle: 'Finanzas y Gestión de Pagos',
    description: 'Control de retiros solicitados por vendedores, comprobantes de pago y estado del ciclo.',
    badgeText: '💰 $482.300 Pendiente',
    icon: 'wallet',
    route: 'Administracion',
    color: colors.success,
    softBg: '#EAF8F0',
    badgeBg: toneColors.success.bg,
  },
];

export function AreaSelectorScreen() {
  const { user, logout } = useAuth();
  const { isAreaEnabled } = usePermissions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const profileSheetRef = useRef<ProfileSheetHandle>(null);
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  const roleLabel =
    user?.role === Role.SUPER_ADMIN
      ? 'Administrador'
      : user?.role === Role.ADMIN
      ? 'Contabilidad'
      : user?.role === Role.OPERATOR
      ? 'Operador'
      : 'Usuario';

  const userName = user?.fullName?.split(' ')[0] ?? 'Usuario';

  return (
    <ScreenContainer scroll={false} padded={false}>
      {/* Header Superior Móvil */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <BrandLogo size={32} variant="mark" />
          <Text style={styles.brandTitle}>BackOffice</Text>
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

      <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {/* Banner de Saludo */}
        <View style={styles.greetingHeader}>
          <Text style={styles.greetingTitle}>¡Hola, {userName}! 👋</Text>
          <Text style={styles.greetingSubtitle}>
            Selecciona el área de trabajo para operar desde tu celular.
          </Text>
        </View>

        {/* Tarjetas de Áreas Móviles */}
        {areas.map((area) => {
          const enabled = isAreaEnabled(area.key, user);
          return (
            <Pressable
              key={area.key}
              disabled={!enabled}
              onPress={() => navigation.navigate(area.route as never)}
              style={({ pressed }) => [
                styles.moduleCard,
                !enabled && styles.moduleCardDisabled,
                pressed && enabled && styles.moduleCardPressed,
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.iconBox, { backgroundColor: enabled ? area.softBg : colors.borderSoft }]}>
                  <Icon
                    name={enabled ? area.icon : 'lock-closed'}
                    size={24}
                    color={enabled ? area.color : colors.textTertiary}
                  />
                </View>
                {enabled ? (
                  <View style={[styles.badgePill, { backgroundColor: area.badgeBg }]}>
                    <Text style={[styles.badgePillText, { color: area.color }]}>{area.badgeText}</Text>
                  </View>
                ) : (
                  <View style={styles.disabledPill}>
                    <Icon name="lock-closed" size={11} color={colors.textTertiary} />
                    <Text style={styles.disabledPillText}>Sin Acceso</Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardTitle}>{area.title}</Text>
              <Text style={styles.cardSubtitle}>{area.subtitle}</Text>
              <Text style={styles.cardDesc}>{area.description}</Text>

              <View style={styles.cardBottomRow}>
                {enabled ? (
                  <View style={[styles.actionBtn, { backgroundColor: area.color }]}>
                    <Text style={styles.actionBtnText}>Ingresar al Área</Text>
                    <Icon name="arrow-forward" size={14} color={colors.white} />
                  </View>
                ) : (
                  <View style={styles.disabledBtn}>
                    <Text style={styles.disabledBtnText}>Requiere Permisos</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}

        {/* Tarjeta de Gestión de Permisos */}
        {isSuperAdmin ? (
          <Pressable
            style={({ pressed }) => [styles.permissionCard, pressed && styles.moduleCardPressed]}
            onPress={() => navigation.navigate('Permissions')}
          >
            <View style={styles.permissionIconBox}>
              <Icon name="key" size={20} color={colors.warning} />
            </View>
            <View style={styles.permissionTexts}>
              <Text style={styles.permissionTitle}>Gestión de Permisos</Text>
              <Text style={styles.permissionDesc}>
                Administrar accesos por correo, área y ranura.
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.warning} />
          </Pressable>
        ) : null}

        <Text style={styles.footerCopyright}>
          RepuesTop BackOffice Móvil v1.0
        </Text>
      </ScrollView>

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
    paddingTop: spacing.md,
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
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
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
  contentScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  greetingHeader: {
    marginBottom: spacing.lg,
  },
  greetingTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  moduleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  moduleCardDisabled: {
    opacity: 0.6,
  },
  moduleCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    paddingHorizontal: spacing.md,
    height: 26,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  disabledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.borderSoft,
    paddingHorizontal: spacing.sm,
    height: 24,
    borderRadius: radii.pill,
  },
  disabledPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  cardBottomRow: {
    marginTop: 'auto',
  },
  actionBtn: {
    height: 42,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.white,
  },
  disabledBtn: {
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  permissionCard: {
    backgroundColor: toneColors.warning.bg,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  permissionIconBox: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTexts: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  permissionDesc: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footerCopyright: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
});
