import React, { useState } from 'react';
import { FlatList, StyleSheet, Switch, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as foundersApi from '@/api/founders';
import { Card, EmptyState, Icon, LoadingState, PaginationFooter, SearchBar, SegmentedTabs, showToast } from '@/components/shared';
import { colors, spacing, toneColors, typography } from '@/theme';
import { formatDate } from '@/utils/formatters';

type FounderFilter = 'ALL' | 'FOUNDER' | 'NON_FOUNDER';

export function FoundersView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FounderFilter>('ALL');
  const [page, setPage] = useState(0);

  const { data: config } = useQuery({
    queryKey: ['founder-config'],
    queryFn: foundersApi.getFounderConfig,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['founder-sellers', search, filter, page],
    queryFn: () => foundersApi.listFounders({ search: search || undefined, status: filter, page, size: 10 }),
  });

  const configMutation = useMutation({
    mutationFn: foundersApi.updateFounderConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['founder-config'] });
      showToast('Ranura general actualizada', 'success');
    },
    onError: () => showToast('No se pudo actualizar la ranura general', 'error'),
  });

  const founderMutation = useMutation({
    mutationFn: ({ sellerId, founder }: { sellerId: number; founder: boolean }) => foundersApi.setFounder(sellerId, founder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['founder-sellers'] });
      showToast('Condición Fundador actualizada', 'success');
    },
    onError: () => showToast('No se pudo actualizar al vendedor', 'error'),
  });

  return (
    <View style={styles.container}>
      <Card style={styles.generalCard}>
        <View style={styles.generalHeader}>
          <View style={styles.crownWrap}>
            <Icon name="ribbon-outline" size={18} color={toneColors.warning.fg} />
          </View>
          <View style={styles.generalTexts}>
            <Text style={typography.subtitle}>Ranura general</Text>
            <Text style={[typography.bodySm, styles.generalDescription]}>
              Los vendedores que se registren mientras esté activa recibirán la condición Fundador.
            </Text>
          </View>
        </View>
        <Switch
          value={config?.founderForNewSellers ?? false}
          disabled={!config || configMutation.isPending}
          onValueChange={(value) => configMutation.mutate(value)}
          trackColor={{ true: colors.brand, false: colors.border }}
        />
      </Card>

      <SearchBar
        value={search}
        onChangeText={(value) => {
          setSearch(value);
          setPage(0);
        }}
        placeholder="Usuario, tienda o correo…"
      />

      <SegmentedTabs
        value={filter}
        onChange={(value) => {
          setFilter(value);
          setPage(0);
        }}
        options={[
          { value: 'ALL', label: 'Todos' },
          { value: 'FOUNDER', label: 'Fundadores' },
          { value: 'NON_FOUNDER', label: 'No fundadores' },
        ]}
      />

      {isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={data?.content ?? []}
          keyExtractor={(item) => String(item.sellerId)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title="Sin vendedores" description="No hay vendedores para los filtros seleccionados." />}
          renderItem={({ item }) => (
            <Card style={styles.sellerCard}>
              <View style={styles.sellerRow}>
                <View style={styles.sellerTexts}>
                  <Text style={typography.subtitle}>{item.storeName}</Text>
                  <Text style={typography.bodySm}>{item.userName}</Text>
                  <Text style={typography.caption}>{item.email}</Text>
                  <Text style={typography.caption}>
                    Registrado: {formatDate(item.registeredAt)}
                    {item.founder ? ` · ${item.founderDays} días como fundador` : ''}
                  </Text>
                </View>
                <Switch
                  value={item.founder}
                  disabled={founderMutation.isPending}
                  onValueChange={(value) => founderMutation.mutate({ sellerId: item.sellerId, founder: value })}
                  trackColor={{ true: colors.brand, false: colors.border }}
                />
              </View>
            </Card>
          )}
          ListFooterComponent={data ? <PaginationFooter page={page} totalPages={data.totalPages} onChange={setPage} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.md },
  generalCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceAlt },
  generalHeader: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  crownWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: toneColors.warning.bg, alignItems: 'center', justifyContent: 'center' },
  generalTexts: { flex: 1, gap: spacing.xxs },
  generalDescription: { textTransform: 'none' },
  listContent: { paddingTop: spacing.sm },
  sellerCard: { marginBottom: spacing.md },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sellerTexts: { flex: 1, gap: spacing.xxs },
});
