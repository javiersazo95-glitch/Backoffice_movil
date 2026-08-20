import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as adminApi from '@/api/administration';
import type { Order, OrderStatus } from '@/types/administration';
import { Badge, Card, EmptyState, ErrorState, Icon, LoadingState, MetricCard, ScreenContainer, SearchBar, SegmentedTabs, StatusBadge } from '@/components/shared';
import { PublicidadTab } from '../components/PublicidadTab';
import { colors, radii, spacing, toneColors } from '@/theme';
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

type QuickFilter = 'ALL' | 'PENDING' | 'SHIPPED' | 'DONE' | 'DISPUTE';

export function PedidosScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** Ventas de repuestos o compras de publicidad. */
  const [ordersTab, setOrdersTab] = useState<'pedidos' | 'publicidad'>('pedidos');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-bootstrap'],
    queryFn: adminApi.getBootstrap,
  });

  const orders: Order[] = useMemo(() => {
    let all = data?.orders ?? [];

    if (quickFilter === 'PENDING') {
      all = all.filter((o) => o.status === 'Pendiente' || o.status === 'Preparando');
    } else if (quickFilter === 'SHIPPED') {
      all = all.filter((o) => o.status === 'Enviado');
    } else if (quickFilter === 'DONE') {
      all = all.filter((o) => o.status === 'Recibido' || o.status === 'Finalizado');
    } else if (quickFilter === 'DISPUTE') {
      all = all.filter((o) => o.status === 'En mediación' || o.status === 'En disputa');
    }

    if (!search.trim()) return all;
    const query = search.trim().toLowerCase();
    return all.filter(
      (order) =>
        order.id.toLowerCase().includes(query) ||
        order.buyer.toLowerCase().includes(query) ||
        order.seller.toLowerCase().includes(query),
    );
  }, [data, search, quickFilter]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const ordersList = data?.orders ?? [];
  const totalOrders = ordersList.length;
  const receivedOrders = ordersList.filter((o: Order) => o.status === 'Recibido' || o.status === 'Finalizado').length;
  const shippingOrders = ordersList.filter((o: Order) => o.status === 'Enviado' || o.status === 'Preparando').length;

  const tabs = (
    <View style={styles.tabsWrap}>
      <SegmentedTabs
        options={[
          { value: 'pedidos', label: 'Pedidos' },
          { value: 'publicidad', label: 'Publicidad' },
        ]}
        value={ordersTab}
        onChange={setOrdersTab}
      />
    </View>
  );

  // El tab de publicidad trae sus propios datos, así que no depende de que
  // haya cargado el bootstrap de pedidos.
  if (ordersTab === 'publicidad') {
    return (
      <ScreenContainer edges={['bottom', 'left', 'right']} padded={false}>
        <View style={styles.body}>
          {tabs}
          <PublicidadTab />
        </View>
      </ScreenContainer>
    );
  }

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <ScreenContainer edges={['bottom', 'left', 'right']} padded={false}>
      <View style={styles.body}>
        {tabs}
        <View style={styles.metricsRow}>
          <MetricCard label="Total pedidos" value={totalOrders} icon="receipt-outline" tone="brand" />
          <MetricCard label="Recibidos" value={receivedOrders} icon="checkmark-circle-outline" tone="success" />
          <MetricCard label="En despacho" value={shippingOrders} icon="car-outline" tone="info" />
        </View>
        {/* Chips de Filtro Rápido Fijos Arriba */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickFilterContainer}
          contentContainerStyle={styles.quickFilterScroll}
        >
          <Pressable
            style={[styles.quickChip, quickFilter === 'ALL' && styles.quickChipActive]}
            onPress={() => setQuickFilter('ALL')}
          >
            <Text style={[styles.quickChipText, quickFilter === 'ALL' && styles.quickChipTextActive]}>Todos</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, quickFilter === 'PENDING' && styles.quickChipActivePending]}
            onPress={() => setQuickFilter('PENDING')}
          >
            <Icon name="time" size={13} color={quickFilter === 'PENDING' ? colors.white : colors.warning} />
            <Text style={[styles.quickChipText, quickFilter === 'PENDING' && styles.quickChipTextActive]}>⏳ Pendientes</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, quickFilter === 'SHIPPED' && styles.quickChipActiveShipped]}
            onPress={() => setQuickFilter('SHIPPED')}
          >
            <Icon name="bus" size={13} color={quickFilter === 'SHIPPED' ? colors.white : colors.brand} />
            <Text style={[styles.quickChipText, quickFilter === 'SHIPPED' && styles.quickChipTextActive]}>🚚 Enviados</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, quickFilter === 'DONE' && styles.quickChipActiveDone]}
            onPress={() => setQuickFilter('DONE')}
          >
            <Icon name="checkmark-circle" size={13} color={quickFilter === 'DONE' ? colors.white : colors.success} />
            <Text style={[styles.quickChipText, quickFilter === 'DONE' && styles.quickChipTextActive]}>✅ Finalizados</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, quickFilter === 'DISPUTE' && styles.quickChipActiveDispute]}
            onPress={() => setQuickFilter('DISPUTE')}
          >
            <Icon name="alert-circle" size={13} color={quickFilter === 'DISPUTE' ? colors.white : colors.danger} />
            <Text style={[styles.quickChipText, quickFilter === 'DISPUTE' && styles.quickChipTextActive]}>⚠️ Disputa/Mediación</Text>
          </Pressable>
        </ScrollView>

        {/* Buscador Integrado */}
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por pedido, comprador o tienda..." />
        </View>

        <FlatList
          style={{ flex: 1 }}
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title="Sin pedidos" description="No hay pedidos para tu búsqueda." />}
          renderItem={({ item }) => {
            const isExpanded = expandedId === item.id;

            return (
              <Card style={styles.card}>
                {/* Cabecera Plegada Resumida */}
                <Pressable style={styles.cardSummaryHeader} onPress={() => toggleExpand(item.id)}>
                  <View style={styles.summaryTopRow}>
                    <Text style={styles.orderTitle}>Pedido #{item.id}</Text>
                    <StatusBadge status={item.status} toneOverride={STATUS_TONE[item.status]} />
                  </View>

                  <Text style={styles.partiesText}>{item.buyer} → {item.seller}</Text>

                  <View style={styles.summaryBottomRow}>
                    <Text style={styles.metaText}>Monto: <Text style={styles.boldText}>{formatCurrency(item.total)}</Text> · {formatDate(item.date)}</Text>
                    <View style={styles.expandToggleBtn}>
                      <Text style={styles.expandToggleText}>{isExpanded ? 'Ocultar ∧' : 'Ver Pedido ∨'}</Text>
                    </View>
                  </View>
                </Pressable>

                {/* Contenido Desplegable */}
                {isExpanded ? (
                  <View style={styles.expandedContent}>
                    <View style={styles.sectionBox}>
                      <Text style={styles.sectionTitle}>🛒 Detalle de Transacción</Text>
                      <View style={styles.infoGrid}>
                        <Text style={styles.infoText}><Text style={styles.boldText}>Número de Orden:</Text> #{item.id}</Text>
                        <Text style={styles.infoText}><Text style={styles.boldText}>Comprador Registrado:</Text> {item.buyer}</Text>
                        <Text style={styles.infoText}><Text style={styles.boldText}>Tienda Vendedora:</Text> {item.seller}</Text>
                        <Text style={styles.infoText}><Text style={styles.boldText}>Monto Bruto Venta:</Text> {formatCurrency(item.total)}</Text>
                        <Text style={styles.infoText}><Text style={styles.boldText}>Fecha de Emisión:</Text> {formatDate(item.date)}</Text>
                        <Text style={styles.infoText}><Text style={styles.boldText}>Estado Logístico:</Text> {item.status}</Text>
                      </View>
                    </View>

                    <View style={styles.sectionBox}>
                      <Text style={styles.sectionTitle}>⚡ Operaciones Directas</Text>
                      <Pressable
                        style={styles.detailActionBtn}
                        onPress={() => navigation.navigate('Liquidaciones')}
                      >
                        <Icon name="receipt" size={14} color={colors.white} />
                        <Text style={styles.detailActionBtnText}>Ver Liquidación de Tienda →</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          }}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xs, justifyContent: 'flex-start' },
  tabsWrap: { marginBottom: spacing.sm },
  metricsRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  quickFilterContainer: { flexGrow: 0, flexShrink: 0, height: 38, marginBottom: spacing.xs },
  quickFilterScroll: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingHorizontal: spacing.md, height: 32,
    borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  quickChipActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  quickChipActivePending: { backgroundColor: colors.warning, borderColor: colors.warning },
  quickChipActiveShipped: { backgroundColor: colors.brand, borderColor: colors.brand },
  quickChipActiveDone: { backgroundColor: colors.success, borderColor: colors.success },
  quickChipActiveDispute: { backgroundColor: colors.danger, borderColor: colors.danger },
  quickChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  quickChipTextActive: { color: colors.white },
  searchWrap: { marginBottom: spacing.sm },
  listContent: { paddingBottom: spacing.huge },
  card: { padding: 0, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardSummaryHeader: { padding: spacing.md, backgroundColor: colors.surface },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  orderTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  partiesText: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs },
  summaryBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  metaText: { fontSize: 11.5, color: colors.textTertiary },
  expandToggleBtn: { backgroundColor: toneColors.brand.bg, paddingHorizontal: spacing.sm, height: 26, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  expandToggleText: { fontSize: 11.5, fontWeight: '700', color: colors.brand },
  expandedContent: { padding: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  sectionBox: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSoft, gap: spacing.xs },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xxs },
  infoGrid: { gap: 4 },
  infoText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  boldText: { fontWeight: '700', color: colors.textPrimary },
  detailActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    backgroundColor: colors.brand, paddingHorizontal: spacing.md, height: 38, borderRadius: radii.md,
  },
  detailActionBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.white },
});
