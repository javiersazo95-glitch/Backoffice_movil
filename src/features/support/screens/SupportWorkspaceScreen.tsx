import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as supportApi from '@/api/support';
import { Button, ErrorState, LoadingState, MetricCard, ScreenContainer } from '@/components/shared';
import { colors, spacing, typography } from '@/theme';

export function SupportWorkspaceScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['support-workspace'],
    queryFn: supportApi.getWorkspace,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <Text style={typography.title}>Soporte</Text>
        <Text style={styles.subtitle}>Tickets, casos y atención a vendedores.</Text>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="Tickets nuevos" value={data.newTickets} icon="mail-unread-outline" tone="info" />
        <MetricCard label="Abiertos" value={data.openTickets} icon="folder-open-outline" tone="brand" />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard label="Urgentes" value={data.urgentTickets} icon="alert-circle-outline" tone="danger" />
        <MetricCard label="Total" value={data.totalTickets} icon="albums-outline" tone="neutral" />
      </View>

      <Button
        label="Ver todos los tickets"
        fullWidth
        style={styles.action}
        onPress={() => navigation.navigate('TicketList')}
      />
      <Button
        label="Reportes QA"
        variant="secondary"
        fullWidth
        style={styles.action}
        onPress={() => navigation.navigate('QaReports')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.lg, marginBottom: spacing.lg },
  subtitle: { ...typography.body, color: colors.textSecondary },
  metricsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  action: { marginTop: spacing.sm },
});
