import React, { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as mediationsApi from '@/api/mediations';
import { MediationStatus } from '@/types/mediation';
import {
  Badge,
  EmptyState,
  ErrorState,
  FilterGroup,
  FilterSheet,
  FilterSheetHandle,
  Icon,
  ListItemCard,
  LoadingState,
  PaginationFooter,
  ScreenContainer,
  SearchBar,
} from '@/components/shared';
import { colors, spacing } from '@/theme';
import { formatDate } from '@/utils/formatters';
import { MEDIATION_STATUS_LABELS, MEDIATION_STATUS_TONE } from '../utils/labels';

export function MediationListScreen() {
  const navigation = useNavigation<any>();
  const filterSheetRef = useRef<FilterSheetHandle>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MediationStatus | undefined>(undefined);
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['mediations', search, status, page],
    queryFn: () => mediationsApi.getMediations({ search: search || undefined, status, page, size: 15 }),
  });

  const groups: FilterGroup[] = [
    {
      key: 'status',
      label: 'Estado',
      value: status,
      options: Object.values(MediationStatus).map((value) => ({ value, label: MEDIATION_STATUS_LABELS[value] })),
      onChange: (value) => setStatus(value as MediationStatus | undefined),
    },
  ];

  return (
    <ScreenContainer>
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <SearchBar
            value={search}
            onChangeText={(value) => {
              setSearch(value);
              setPage(0);
            }}
            placeholder="Pedido, vendedor o motivo…"
          />
        </View>
        <Pressable style={styles.filterButton} onPress={() => filterSheetRef.current?.open()}>
          <Icon name="options-outline" size={20} color={colors.brand} />
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={data?.content ?? []}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<EmptyState title="Sin mediaciones" description="No hay casos para los filtros seleccionados." />}
          renderItem={({ item }) => (
            <ListItemCard
              title={`${item.sellerName} · Pedido ${item.orderId}`}
              subtitle={item.reason}
              meta={formatDate(item.updatedAt)}
              rightBadge={
                <Badge
                  label={item.accountBlocked ? 'Cuenta bloqueada' : MEDIATION_STATUS_LABELS[item.status]}
                  tone={item.accountBlocked ? 'danger' : MEDIATION_STATUS_TONE[item.status]}
                />
              }
              onPress={() => navigation.navigate('MediationDetail', { mediationId: item.id })}
            />
          )}
          ListFooterComponent={data ? <PaginationFooter page={page} totalPages={data.totalPages} onChange={setPage} /> : null}
        />
      )}

      <FilterSheet ref={filterSheetRef} groups={groups} onApply={() => setPage(0)} onClear={() => { setStatus(undefined); setPage(0); }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md },
  searchInput: { flex: 1 },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
});
