import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as adminApi from '@/api/administration';
import { Card, ErrorState, LoadingState, MetricCard, ScreenContainer } from '@/components/shared';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatters';
import { getCurrentCycleRange } from '../utils/cycle';

export function ResumenScreen() {
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

  return (
    <ScreenContainer scroll>
      <View style={styles.content}>
        <Text style={typography.title}>Resumen</Text>
        <Text style={styles.subtitle}>Estado del ciclo de pagos actual.</Text>

        <View style={styles.metricsRow}>
          <MetricCard label="Retiros pendientes" value={pending.length} icon="cash-outline" tone="warning" />
          <MetricCard label="Monto pendiente" value={formatCurrency(pendingTotal)} icon="wallet-outline" tone="brand" />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard label="Docs. incompletos" value={incompleteDocs} icon="document-text-outline" tone={incompleteDocs > 0 ? 'danger' : 'success'} />
          <MetricCard label="Pagos registrados" value={payments?.length ?? 0} icon="receipt-outline" tone="info" />
        </View>

        {lastPayment ? (
          <Card style={styles.lastPaymentCard}>
            <Text style={typography.subtitle}>Último pago procesado</Text>
            <Text style={styles.lastPaymentAmount}>{formatCurrency(lastPayment.montoTotal)}</Text>
            <Text style={typography.bodySm}>{lastPayment.retiros.length} retiros incluidos</Text>
          </Card>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.huge },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  metricsRow: { flexDirection: 'row', gap: spacing.md },
  lastPaymentCard: { gap: spacing.xxs, marginTop: spacing.sm },
  lastPaymentAmount: { ...typography.displaySm, color: colors.brand },
});
