import React, { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as sellersApi from '@/api/sellers';
import { SellerStatus } from '@/types/seller';
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
import { SELLER_STATUS_LABELS, SELLER_STATUS_TONE, TRUST_LEVEL_LABELS, TRUST_LEVEL_TONE } from '../utils/labels';

export function SellerListScreen() {
  const navigation = useNavigation<any>();
  const filterSheetRef = useRef<FilterSheetHandle>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SellerStatus | undefined>(undefined);
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trust-sellers', search, status, page],
    queryFn: () => sellersApi.getSellers({ search: search || undefined, status, page, size: 15 }),
  });

  const groups: FilterGroup[] = [
    {
      key: 'status',
      label: 'Estado',
      value: status,
      options: Object.values(SellerStatus).map((value) => ({ value, label: SELLER_STATUS_LABELS[value] })),
      onChange: (value) => setStatus(value as SellerStatus | undefined),
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
            placeholder="Tienda, RUT o correo…"
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
          ListEmptyComponent={<EmptyState title="Sin vendedores" description="No hay vendedores para tu búsqueda." />}
          renderItem={({ item }) => (
            <ListItemCard
              title={item.storeName}
              subtitle={`${item.city} · ${item.rut}`}
              meta={`Confianza ${TRUST_LEVEL_LABELS[item.trustLevel]} · ${item.rating.toFixed(1)}★`}
              rightBadge={<Badge label={SELLER_STATUS_LABELS[item.status]} tone={SELLER_STATUS_TONE[item.status]} />}
              onPress={() => navigation.navigate('SellerDetail', { sellerId: item.id })}
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
