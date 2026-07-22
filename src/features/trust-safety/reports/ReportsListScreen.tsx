import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as reportsApi from '@/api/reports';
import { Badge, EmptyState, ListItemCard, LoadingState, MetricCard, PaginationFooter, ScreenContainer } from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { HeaderHomeButton } from '@/components/layout/HeaderHomeButton';
import { spacing } from '@/theme';
import { formatDate } from '@/utils/formatters';

export function ReportsListScreen() {
  const navigation = useNavigation<any>();
  const [page, setPage] = useState(0);

  const { data: summary } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: reportsApi.getReportsSummary,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['reports', page],
    queryFn: () => reportsApi.getReports({ page, size: 15 }),
  });

  return (
    <ScreenContainer padded={false}>
      <AppHeader
        title="Reportes y Métricas"
        onBack={() => navigation.goBack()}
        right={<HeaderHomeButton />}
      />

      <View style={styles.body}>
        {summary ? (
          <View style={styles.summaryRow}>
            <MetricCard label="Total reportes" value={summary.totalReportes} icon="flag-outline" tone="brand" />
            <MetricCard label="De compradores" value={summary.reportesCompradores} icon="person-outline" tone="info" />
            <MetricCard label="De vendedores" value={summary.reportesVendedores} icon="storefront-outline" tone="warning" />
          </View>
        ) : null}

        {isLoading ? (
          <LoadingState />
        ) : (
          <FlatList
            data={data?.content ?? []}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState title="Sin reportes" description="No hay reportes registrados." />}
            renderItem={({ item }) => (
              <ListItemCard
                title={item.motivo}
                subtitle={`${item.reportanteName} → ${item.reportadoName}`}
                meta={formatDate(item.fechaCreacion)}
                rightBadge={<Badge label={item.reportadoType === 'VENDEDOR' ? 'Vendedor' : 'Comprador'} tone="neutral" />}
                showChevron={false}
              />
            )}
            ListFooterComponent={data ? <PaginationFooter page={page} totalPages={data.totalPages} onChange={setPage} /> : null}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: spacing.lg },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md, marginBottom: spacing.md },
  listContent: { paddingBottom: spacing.huge },
});
