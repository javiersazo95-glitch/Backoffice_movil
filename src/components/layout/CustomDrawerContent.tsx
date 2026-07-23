import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Avatar, BrandLogo, Icon, IconName } from '@/components/shared';
import { colors, radii, spacing, toneColors } from '@/theme';

interface DrawerItemConfig {
  name: string;
  label: string;
  icon: IconName;
  color: string;
  bgColor: string;
}

const DRAWER_ITEMS_MAP: Record<string, DrawerItemConfig> = {
  // Administración
  Resumen: { name: 'Resumen', label: 'Resumen Financiero', icon: 'apps', color: colors.brand, bgColor: toneColors.brand.bg },
  Pedidos: { name: 'Pedidos', label: 'Pedidos del Sistema', icon: 'cart', color: '#4F46E5', bgColor: '#EEF2FF' },
  Liquidaciones: { name: 'Liquidaciones', label: 'Liquidaciones Vendedores', icon: 'cash', color: colors.success, bgColor: toneColors.success.bg },
  Gastos: { name: 'Gastos', label: 'Gastos Operativos', icon: 'pie-chart', color: colors.danger, bgColor: toneColors.danger.bg },
  'Historial de Retiros': { name: 'Historial de Retiros', label: 'Historial de Retiros', icon: 'receipt', color: colors.warning, bgColor: toneColors.warning.bg },
  'Pago a proveedores': { name: 'Pago a proveedores', label: 'Pago a Proveedores', icon: 'card', color: '#0D9488', bgColor: '#CCFBF1' },

  // Confianza y Mediación
  Dashboard: { name: 'Dashboard', label: 'Dashboard de Confianza', icon: 'grid', color: colors.violet, bgColor: toneColors.violet.bg },
  Vendedores: { name: 'Vendedores', label: 'Directorio Vendedores', icon: 'storefront', color: colors.brand, bgColor: toneColors.brand.bg },
  Validaciones: { name: 'Validaciones', label: 'Validación de Ingreso', icon: 'shield-checkmark', color: colors.warning, bgColor: toneColors.warning.bg },
  Mediaciones: { name: 'Mediaciones', label: 'Casos y Disputas', icon: 'scale', color: '#5B21B6', bgColor: '#F3E8FF' },
  Reportes: { name: 'Reportes', label: 'Reportes y Métricas', icon: 'stats-chart', color: colors.success, bgColor: toneColors.success.bg },

  // Soporte Técnico
  SoporteWorkspace: { name: 'SoporteWorkspace', label: 'Mesa de Soporte', icon: 'headset', color: colors.brand, bgColor: toneColors.brand.bg },
  TicketList: { name: 'TicketList', label: 'Bandeja de Tickets', icon: 'chatbubbles', color: colors.warning, bgColor: toneColors.warning.bg },
  QaReports: { name: 'QaReports', label: 'Reportes QA', icon: 'bug', color: colors.danger, bgColor: toneColors.danger.bg },
};

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  areaTitle?: string;
}

export function CustomDrawerContent(props: CustomDrawerContentProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { state, navigation, areaTitle = 'Menú Principal' } = props;

  const roleLabel =
    user?.role === 'SUPER_ADMIN'
      ? 'Super Administrador'
      : user?.role === 'ADMIN'
      ? 'Administrador'
      : user?.role === 'OPERATOR'
      ? 'Operador'
      : 'Usuario';

  return (
    <View style={styles.container}>
      {/* Header Institucional de Área */}
      <View style={[styles.headerBanner, { paddingTop: Math.max(insets.top, spacing.md) + spacing.xs }]}>
        <View style={styles.brandRow}>
          <BrandLogo size={32} variant="mark" />
          <View>
            <Text style={styles.areaTitle}>{areaTitle}</Text>
            <Text style={styles.areaSubtitle}>RepuesTop BackOffice</Text>
          </View>
        </View>

        {/* Perfil del Operador */}
        <View style={styles.userCard}>
          <Avatar initials={user?.initials ?? 'AR'} size={36} />
          <View style={styles.userTextWrap}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.fullName ?? 'Usuario BackOffice'}
            </Text>
            <Text style={styles.userRole}>{roleLabel}</Text>
          </View>
        </View>
      </View>

      {/* Lista de Opciones Animada e Ilustrada */}
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollItems}>
        <Text style={styles.sectionHeader}>Navegación del Área</Text>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = DRAWER_ITEMS_MAP[route.name] ?? {
            name: route.name,
            label: route.name,
            icon: 'ellipse',
            color: colors.brand,
            bgColor: colors.brandSoft,
          };

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={({ pressed }) => [
                styles.drawerItem,
                isFocused && [styles.drawerItemActive, { borderColor: config.color }],
                pressed && styles.drawerItemPressed,
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: isFocused ? config.color : config.bgColor }]}>
                <Icon
                  name={config.icon}
                  size={18}
                  color={isFocused ? colors.white : config.color}
                />
              </View>
              <Text style={[styles.drawerItemText, isFocused && styles.drawerItemTextActive]}>
                {config.label}
              </Text>
              {isFocused ? (
                <View style={[styles.activeDot, { backgroundColor: config.color }]} />
              ) : (
                <Icon name="chevron-forward" size={14} color={colors.textTertiary} />
              )}
            </Pressable>
          );
        })}
      </DrawerContentScrollView>

      {/* Footer para Volver al Selector de Áreas */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          style={styles.homeBtn}
          onPress={() => navigation.navigate('AreaSelector' as never)}
        >
          <Icon name="home" size={18} color={colors.brand} />
          <Text style={styles.homeBtnText}>Volver al Menú Principal</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerBanner: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    gap: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  areaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  areaSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg,
    padding: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  userTextWrap: {
    flex: 1,
  },
  userName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userRole: {
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  scrollItems: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.sm,
  },
  drawerItemActive: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  drawerItemPressed: {
    opacity: 0.85,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  drawerItemTextActive: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: toneColors.brand.bg,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  homeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand,
  },
});
