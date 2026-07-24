import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '@/api/dashboard';
import { ErrorState, Icon, LoadingState, ScreenContainer } from '@/components/shared';
import { colors, radii, spacing, toneColors } from '@/theme';

export function TrustDashboardScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trust-dashboard-summary'],
    queryFn: dashboardApi.getSummary,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const trustScore = data?.trustScore ?? 100;
  const activeSellers = data?.activeSellers ?? 0;
  const suspendedSellers = data?.suspendedSellers ?? 0;
  const openMediations = data?.openMediations ?? 0;
  const validationsPending = data?.validationsPending ?? 0;

  return (
    <ScreenContainer edges={['bottom', 'left', 'right']} scroll={false} padded={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner de Bienvenida y Score */}
        <View style={styles.scoreHeroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroSubtitle}>Centro de Control Operativo</Text>
            <Text style={styles.heroTitle}>Confianza y Mediación</Text>
            <View style={styles.trustPill}>
              <Icon name="shield-checkmark" size={14} color={colors.success} />
              <Text style={styles.trustPillText}>Índice de Confianza: {trustScore}%</Text>
            </View>
          </View>
          <View style={styles.heroScoreCircle}>
            <Text style={styles.heroScoreNumber}>{trustScore}</Text>
            <Text style={styles.heroScoreLabel}>Puntos</Text>
          </View>
        </View>

        {/* Métricas Principales (Todas Clickeables) */}
        <Text style={styles.sectionHeader}>Estado del Ecosistema (Toca para ingresar)</Text>
        <View style={styles.grid}>
          <Pressable style={styles.metricCard} onPress={() => navigation.navigate('Vendedores')}>
            <View style={[styles.iconBadge, { backgroundColor: colors.infoSoft }]}>
              <Icon name="people" size={18} color={colors.brand} />
            </View>
            <Text style={styles.metricValue}>{activeSellers}</Text>
            <Text style={styles.metricLabel}>Vendedores activos</Text>
          </Pressable>

          <Pressable style={styles.metricCard} onPress={() => navigation.navigate('Mediaciones')}>
            <View style={[styles.iconBadge, { backgroundColor: colors.warningSoft }]}>
              <Icon name="time" size={18} color={colors.warning} />
            </View>
            <Text style={styles.metricValue}>{openMediations}</Text>
            <Text style={styles.metricLabel}>En disputa</Text>
          </Pressable>

          <Pressable style={styles.metricCard} onPress={() => navigation.navigate('Mediaciones')}>
            <View style={[styles.iconBadge, { backgroundColor: colors.violetSoft }]}>
              <Icon name="scale" size={18} color={colors.violet} />
            </View>
            <Text style={styles.metricValue}>{openMediations}</Text>
            <Text style={styles.metricLabel}>En mediación</Text>
          </Pressable>

          <Pressable style={styles.metricCard} onPress={() => navigation.navigate('Vendedores')}>
            <View style={[styles.iconBadge, { backgroundColor: colors.dangerSoft }]}>
              <Icon name="ban" size={18} color={colors.danger} />
            </View>
            <Text style={styles.metricValue}>{suspendedSellers}</Text>
            <Text style={styles.metricLabel}>Suspendidos</Text>
          </Pressable>
        </View>

        {/* Acciones Rápidas Operativas */}
        <Text style={styles.sectionHeader}>Gestión y Respuesta Rápida</Text>
        <View style={styles.actionCardsGroup}>
          <Pressable style={styles.actionCard} onPress={() => navigation.navigate('Mediaciones')}>
            <View style={[styles.actionIconBox, { backgroundColor: toneColors.violet.bg }]}>
              <Icon name="scale" size={22} color={colors.violet} />
            </View>
            <View style={styles.actionTextWrap}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionTitle}>Atender Mediaciones y Disputas</Text>
                <View style={styles.countBadgeViolet}>
                  <Text style={styles.countBadgeText}>{openMediations}</Text>
                </View>
              </View>
              <Text style={styles.actionDesc}>Revisar reclamos, enviar mensajes y resolver disputas activas.</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.violet} />
          </Pressable>

          <Pressable style={styles.actionCard} onPress={() => navigation.navigate('Validaciones')}>
            <View style={[styles.actionIconBox, { backgroundColor: toneColors.warning.bg }]}>
              <Icon name="document-text" size={22} color={colors.warning} />
            </View>
            <View style={styles.actionTextWrap}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionTitle}>Validaciones de Vendedores</Text>
                <View style={styles.countBadgeWarning}>
                  <Text style={styles.countBadgeText}>{validationsPending}</Text>
                </View>
              </View>
              <Text style={styles.actionDesc}>Aprobar o rechazar documentación de ingreso de tiendas.</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.warning} />
          </Pressable>

          <Pressable style={styles.actionCard} onPress={() => navigation.navigate('Vendedores')}>
            <View style={[styles.actionIconBox, { backgroundColor: toneColors.brand.bg }]}>
              <Icon name="storefront" size={22} color={colors.brand} />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Directorio de Vendedores</Text>
              <Text style={styles.actionDesc}>Consultar reputación, historial y estados de cuentas.</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.brand} />
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  scoreHeroCard: {
    backgroundColor: colors.brand,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    elevation: 4,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  heroLeft: { flex: 1, gap: 4 },
  heroSubtitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: colors.white },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    height: 24,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  trustPillText: { color: colors.success, fontSize: 11, fontWeight: '700' },
  heroScoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScoreNumber: { fontSize: 20, fontWeight: '900', color: colors.white },
  heroScoreLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: -2 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    elevation: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  actionCardsGroup: { gap: spacing.md },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: { flex: 1, gap: 2 },
  actionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  actionDesc: { fontSize: 11.5, color: colors.textSecondary, lineHeight: 16 },
  countBadgeViolet: {
    backgroundColor: colors.violet,
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeWarning: {
    backgroundColor: colors.warning,
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { fontSize: 10, fontWeight: '800', color: colors.white },
});
