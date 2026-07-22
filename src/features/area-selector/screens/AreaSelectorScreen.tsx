import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Role } from '@/types/auth';
import { RootStackParamList } from '@/navigation/types';
import { Avatar, Card, Icon, IconName, ScreenContainer } from '@/components/shared';
import { colors, radii, spacing, toneColors, typography, StatusTone } from '@/theme';
import { ProfileSheet, ProfileSheetHandle } from '../components/ProfileSheet';

type AreaKey = 'administracion' | 'soporte' | 'confianza';

interface AreaCard {
  key: AreaKey;
  title: string;
  description: string;
  icon: IconName;
  route: keyof RootStackParamList;
  tone: StatusTone;
}

const areas: AreaCard[] = [
  {
    key: 'administracion',
    title: 'Administración Contable',
    description: 'Pedidos, retiros, pagos y liquidaciones.',
    icon: 'wallet-outline',
    route: 'Administracion',
    tone: 'success',
  },
  {
    key: 'soporte',
    title: 'Soporte',
    description: 'Tickets, chats y atención a vendedores.',
    icon: 'headset-outline',
    route: 'Soporte',
    tone: 'info',
  },
  {
    key: 'confianza',
    title: 'Confianza y Mediación',
    description: 'Vendedores, mediaciones, validaciones y alertas.',
    icon: 'scale-outline',
    route: 'Confianza',
    tone: 'violet',
  },
];

export function AreaSelectorScreen() {
  const { user, logout } = useAuth();
  const { isAreaEnabled } = usePermissions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const profileSheetRef = useRef<ProfileSheetHandle>(null);
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  return (
    <ScreenContainer scroll={false} padded={false}>
      <View style={styles.header}>
        <View>
          <Text style={typography.bodySm}>Bienvenido</Text>
          <Text style={typography.title}>{user?.fullName ?? 'Backoffice'}</Text>
        </View>
        <Pressable onPress={() => profileSheetRef.current?.open()} hitSlop={8}>
          <Avatar initials={user?.initials ?? 'AR'} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Accesos principales</Text>
        <Text style={styles.sectionSubtitle}>Ingresa al área que necesitas operar.</Text>

        {areas.map((area) => {
          const enabled = isAreaEnabled(area.key, user);
          const palette = toneColors[area.tone];
          return (
            <Card
              key={area.key}
              onPress={enabled ? () => navigation.navigate(area.route as never) : undefined}
              style={styles.areaCard}
            >
              <View style={styles.areaRow}>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: enabled ? palette.bg : colors.borderSoft },
                  ]}
                >
                  <Icon name={enabled ? area.icon : 'lock-closed-outline'} size={22} color={enabled ? palette.fg : colors.textTertiary} />
                </View>
                <View style={styles.areaTexts}>
                  <Text style={typography.subtitle}>{area.title}</Text>
                  <Text style={[typography.bodySm, styles.areaDescription]}>{area.description}</Text>
                </View>
                <Icon
                  name={enabled ? 'chevron-forward' : 'lock-closed-outline'}
                  size={18}
                  color={colors.textTertiary}
                />
              </View>
              {!enabled ? <Text style={styles.noAccess}>Sin acceso — solicítalo a tu administrador.</Text> : null}
            </Card>
          );
        })}

        {isSuperAdmin ? (
          <Card
            onPress={() => navigation.navigate('Permissions')}
            style={styles.bannerCard}
          >
            <View style={styles.areaRow}>
              <View style={[styles.iconWrap, { backgroundColor: toneColors.brand.bg }]}>
                <Icon name="key-outline" size={22} color={toneColors.brand.fg} />
              </View>
              <View style={styles.areaTexts}>
                <Text style={typography.subtitle}>Gestión de Permisos</Text>
                <Text style={[typography.bodySm, styles.areaDescription]}>
                  Administra accesos por correo, área y ranura operativa.
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </Card>
        ) : null}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  sectionTitle: { ...typography.title, marginBottom: spacing.xxs },
  sectionSubtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  areaCard: { marginBottom: spacing.md },
  bannerCard: { marginTop: spacing.md, borderColor: colors.brand, borderWidth: 1 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: { width: 48, height: 48, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  areaTexts: { flex: 1, gap: spacing.xxs },
  areaDescription: { textTransform: 'none' },
  noAccess: { ...typography.caption, color: colors.danger, marginTop: spacing.sm, textTransform: 'none' },
});
