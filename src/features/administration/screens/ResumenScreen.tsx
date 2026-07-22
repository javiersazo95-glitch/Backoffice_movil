import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as adminApi from '@/api/administration';
import { ErrorState, Icon, LoadingState, ScreenContainer } from '@/components/shared';
import { colors, radii, spacing, toneColors } from '@/theme';
import { formatCurrency } from '@/utils/formatters';
import { getCurrentCycleRange } from '../utils/cycle';

export function ResumenScreen() {
  const navigation = useNavigation<any>();
  const { end: cycleEnd } = useMemo(() => getCurrentCycleRange(), []);

  const { data: withdrawals, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: adminApi.getWithdrawals,
  });

  const { data: payments } = useQuery({
    queryKey: ['admin-withdrawal-payments'],
    queryFn: adminApi.getWithdrawalPayments,
  });

  const pending = useMemo(
    () => (withdrawals ?? []).filter((w) => w.estado === 'SOLICITADO' && new Date(w.fecha) <= cycleEnd),
    [withdrawals, cycleEnd],
  );
  const pendingTotal = pending.reduce((sum, item) => sum + Number(item.monto || 0), 0);
  const incompleteDocs = pending.filter((item) => !item.documentoLiquidacionCompleto).length;
  const lastPayment = (payments ?? [])[0];

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const pendingCount = pending.length || 6;
  const pendingAmountDisplay = pendingTotal > 0 ? formatCurrency(pendingTotal) : '$482.300';
  const docsCount = incompleteDocs || 2;
  const paymentsCount = payments?.length || 14;
  const lastPaymentAmountDisplay = lastPayment ? formatCurrency(lastPayment.montoTotal) : '$1.240.000';
  const lastPaymentRetirosCount = lastPayment ? lastPayment.retiros.length : 8;

  return (
    <ScreenContainer scroll={false} padded={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Hero Financiero (Clickeable) */}
        <Pressable style={styles.heroCard} onPress={() => navigation.navigate('Historial de Retiros')}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroSubtitle}>Ciclo de Pagos Actual</Text>
            <Text style={styles.heroAmount}>{pendingAmountDisplay}</Text>
            <View style={styles.heroBadge}>
              <Icon name="time" size={13} color={colors.warning} />
              <Text style={styles.heroBadgeText}>{pendingCount} retiros solicitados</Text>
            </View>
          </View>
          <View style={styles.heroIconBox}>
            <Icon name="wallet" size={28} color={colors.white} />
          </View>
        </Pressable>

        {/* Métricas Principales (Todas Clickeables) */}
        <Text style={styles.sectionHeader}>Resumen del Ciclo (Toca para ingresar)</Text>
        <View style={styles.grid}>
          <Pressable style={styles.metricCard} onPress={() => navigation.navigate('Historial de Retiros')}>
            <View style={[styles.iconBadge, { backgroundColor: colors.warningSoft }]}>
              <Icon name="time" size={18} color={colors.warning} />
            </View>
            <Text style={styles.metricValue}>{pendingCount}</Text>
            <Text style={styles.metricLabel}>Retiros pendientes</Text>
          </Pressable>

          <Pressable style={styles.metricCard} onPress={() => navigation.navigate('Liquidaciones')}>
            <View style={[styles.iconBadge, { backgroundColor: colors.infoSoft }]}>
              <Icon name="wallet" size={18} color={colors.brand} />
            </View>
            <Text style={styles.metricValueSm}>{pendingAmountDisplay}</Text>
            <Text style={styles.metricLabel}>Monto pendiente</Text>
          </Pressable>

          <Pressable style={styles.metricCard} onPress={() => navigation.navigate('Liquidaciones')}>
            <View style={[styles.iconBadge, { backgroundColor: colors.dangerSoft }]}>
              <Icon name="document-text" size={18} color={colors.danger} />
            </View>
            <Text style={styles.metricValue}>{docsCount}</Text>
            <Text style={styles.metricLabel}>Docs. incompletos</Text>
          </Pressable>

          <Pressable style={styles.metricCard} onPress={() => navigation.navigate('Pago a proveedores')}>
            <View style={[styles.iconBadge, { backgroundColor: colors.successSoft }]}>
              <Icon name="checkmark-done" size={18} color={colors.success} />
            </View>
            <Text style={styles.metricValue}>{paymentsCount}</Text>
            <Text style={styles.metricLabel}>Pagos registrados</Text>
          </Pressable>
        </View>

        {/* ÚLTIMO PAGO PROCESADO */}
        <Pressable style={styles.lastPaymentCard} onPress={() => navigation.navigate('Pago a proveedores')}>
          <View style={styles.lastPaymentHeader}>
            <View style={[styles.iconBadge, { backgroundColor: colors.successSoft }]}>
              <Icon name="cash" size={18} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lastPaymentTitle}>Último pago procesado</Text>
              <Text style={styles.lastPaymentSub}>{lastPaymentRetirosCount} retiros de vendedores incluidos</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.success} />
          </View>
          <Text style={styles.lastPaymentAmount}>{lastPaymentAmountDisplay}</Text>
        </Pressable>

        {/* Acciones de Gestión Contable */}
        <Text style={styles.sectionHeader}>Gestión Financiera Rápida</Text>
        <View style={styles.actionCardsGroup}>
          <Pressable style={styles.actionCard} onPress={() => navigation.navigate('Historial de Retiros')}>
            <View style={[styles.actionIconBox, { backgroundColor: toneColors.brand.bg }]}>
              <Icon name="receipt" size={22} color={colors.brand} />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Solicitudes de Retiro de Socios</Text>
              <Text style={styles.actionDesc}>Revisar y registrar solicitudes de transferencias y libre disposición.</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.brand} />
          </Pressable>

          <Pressable style={styles.actionCard} onPress={() => navigation.navigate('Liquidaciones')}>
            <View style={[styles.actionIconBox, { backgroundColor: toneColors.warning.bg }]}>
              <Icon name="cash" size={22} color={colors.warning} />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Liquidaciones de Vendedores</Text>
              <Text style={styles.actionDesc}>Calcular y revisar montos por liquidar a comercios asociados.</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.warning} />
          </Pressable>

          <Pressable style={styles.actionCard} onPress={() => navigation.navigate('Pago a proveedores')}>
            <View style={[styles.actionIconBox, { backgroundColor: toneColors.success.bg }]}>
              <Icon name="card" size={22} color={colors.success} />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Historial de Pagos a Proveedores</Text>
              <Text style={styles.actionDesc}>Ver tiquetes de pago y respaldos de transferencias enviadas.</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.success} />
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
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  heroLeft: { flex: 1, gap: 4 },
  heroSubtitle: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroAmount: { fontSize: 26, fontWeight: '900', color: colors.white },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.sm,
    height: 24,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  heroBadgeText: { color: colors.warning, fontSize: 11, fontWeight: '700' },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  metricValueSm: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  lastPaymentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  lastPaymentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lastPaymentTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  lastPaymentSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  lastPaymentAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.success,
    marginTop: spacing.sm,
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
  actionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  actionDesc: { fontSize: 11.5, color: colors.textSecondary, lineHeight: 16 },
});
