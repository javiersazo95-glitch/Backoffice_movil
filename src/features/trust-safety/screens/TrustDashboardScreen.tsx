import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '@/api/dashboard';
import { Badge, ErrorState, LoadingState, MetricCard, ScreenContainer } from '@/components/shared';
import { colors, spacing, typography } from '@/theme';
import { TRUST_LEVEL_LABELS, TRUST_LEVEL_TONE } from '../utils/labels';

export function TrustDashboardScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trust-dashboard-summary'],
    queryFn: dashboardApi.getSummary,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <Text style={typography.title}>Confianza y Mediación</Text>
        <View style={styles.trustRow}>
          <Text style={styles.trustScore}>{data.trustScore}</Text>
          <Badge label={`Confianza ${TRUST_LEVEL_LABELS[data.trustLevel]}`} tone={TRUST_LEVEL_TONE[data.trustLevel]} />
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="Vendedores activos" value={data.activeSellers} icon="people-outline" tone="brand" />
        <MetricCard label="Suspendidos" value={data.suspendedSellers} icon="ban-outline" tone="danger" />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard label="Mediaciones abiertas" value={data.openMediations} icon="scale-outline" tone="violet" />
        <MetricCard label="Alertas críticas" value={data.criticalAlerts} icon="alert-circle-outline" tone="danger" />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard label="Validaciones pendientes" value={data.validationsPending} icon="document-text-outline" tone="warning" />
        <MetricCard label="Riesgo vendedores" value={data.sellerRisks} icon="warning-outline" tone="warning" />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard label="Docs. por vencer" value={data.expiringDocuments} icon="time-outline" tone="info" />
        <MetricCard label="Reclamos sin responder" value={data.unansweredClaims} icon="chatbox-ellipses-outline" tone="danger" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.lg, marginBottom: spacing.lg, gap: spacing.sm },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  trustScore: { ...typography.displaySm, color: colors.brand },
  metricsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
});
