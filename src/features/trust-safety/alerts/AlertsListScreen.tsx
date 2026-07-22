import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as alertsApi from '@/api/alerts';
import { Badge, Button, Card, EmptyState, LoadingState, PaginationFooter, ScreenContainer, SearchBar, showToast } from '@/components/shared';
import { colors, spacing, typography } from '@/theme';
import { formatDateTime } from '@/utils/formatters';
import { ALERT_SEVERITY_LABELS, ALERT_SEVERITY_TONE } from '../utils/labels';

export function AlertsListScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['trust-alerts', search, page],
    queryFn: () => alertsApi.getAlerts(search || undefined, undefined, page, 15),
  });

  const reviewMutation = useMutation({
    mutationFn: (id: number) => alertsApi.markAsReviewed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trust-alerts'] });
      showToast('Alerta marcada como revisada', 'success');
    },
    onError: () => showToast('No se pudo actualizar la alerta', 'error'),
  });

  return (
    <ScreenContainer>
      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={(value) => {
            setSearch(value);
            setPage(0);
          }}
          placeholder="Vendedor o señal…"
        />
      </View>

      {isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={data?.content ?? []}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<EmptyState title="Sin alertas" description="No hay alertas de riesgo activas." />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={typography.subtitle}>{item.sellerName}</Text>
                <Badge label={ALERT_SEVERITY_LABELS[item.severity]} tone={ALERT_SEVERITY_TONE[item.severity]} />
              </View>
              <Text style={typography.bodySm}>{item.signalType}</Text>
              <Text style={typography.bodySm}>{item.evidence}</Text>
              <Text style={typography.caption}>{formatDateTime(item.createdAt)}</Text>
              {!item.reviewed ? (
                <Button
                  label="Marcar como revisada"
                  variant="secondary"
                  style={styles.action}
                  loading={reviewMutation.isPending}
                  onPress={() => reviewMutation.mutate(item.id)}
                />
              ) : (
                <Badge label="Revisada" tone="success" />
              )}
            </Card>
          )}
          ListFooterComponent={data ? <PaginationFooter page={page} totalPages={data.totalPages} onChange={setPage} /> : null}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingTop: spacing.md },
  card: { gap: spacing.xs, marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  action: { marginTop: spacing.sm },
});
