import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as adminApi from '@/api/administration';
import type { Order, OrderStatus } from '@/types/administration';
import { EmptyState, ErrorState, ListItemCard, LoadingState, ScreenContainer, SearchBar, StatusBadge } from '@/components/shared';
import { spacing } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/formatters';

const STATUS_TONE: Record<OrderStatus, 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'neutral'> = {
  Pendiente: 'warning',
  Preparando: 'info',
  Enviado: 'info',
  Recibido: 'success',
  Finalizado: 'success',
  'En mediación': 'violet',
  'En disputa': 'danger',
  Cancelado: 'neutral',
  'Cancelado parcialmente': 'neutral',
};

export function PedidosScreen() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-bootstrap'],
    queryFn: adminApi.getBootstrap,
  });

  const orders: Order[] = useMemo(() => {
    const all = data?.orders ?? [];
    if (!search.trim()) return all;
    const query = search.trim().toLowerCase();
    return all.filter(
      (order) =>
        order.id.toLowerCase().includes(query) ||
        order.buyer.toLowerCase().includes(query) ||
        order.seller.toLowerCase().includes(query),
    );
  }, [data, search]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <ScreenContainer>
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Pedido, comprador o vendedor…" />
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title="Sin pedidos" description="No hay pedidos para tu búsqueda." />}
        renderItem={({ item }) => (
          <ListItemCard
            title={`Pedido ${item.id}`}
            subtitle={`${item.buyer} → ${item.seller}`}
            meta={`${formatCurrency(item.total)} · ${formatDate(item.date)}`}
            rightBadge={<StatusBadge status={item.status} toneOverride={STATUS_TONE[item.status]} />}
            showChevron={false}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingTop: spacing.md },
});
