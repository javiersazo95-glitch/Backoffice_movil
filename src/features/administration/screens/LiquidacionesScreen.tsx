import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as adminApi from '@/api/administration';
import type { RetiroAdminResponse, Settlement } from '@/types/administration';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  ScreenContainer,
} from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { HeaderHomeButton } from '@/components/layout/HeaderHomeButton';
import { colors, radii, spacing, toneColors } from '@/theme';
import { formatCurrency } from '@/utils/formatters';
import { getSettlements } from '../utils/settlements';
import { LiquidationDocumentModal } from '../components/LiquidationDocumentModal';

type Tab = 'EN_LIQUIDACION' | 'LIQUIDADO';

interface SellerGroup {
  key: string;
  seller: string;
  sellerEmail?: string;
  sellerTaxId?: string;
  total: number;
  settlements: Settlement[];
}

function matchRetiro(withdrawals: RetiroAdminResponse[], group: SellerGroup): RetiroAdminResponse | undefined {
  return withdrawals.find(
    (retiro) =>
      (group.sellerEmail && retiro.email === group.sellerEmail) ||
      (group.sellerTaxId && retiro.rut === group.sellerTaxId) ||
      retiro.nombreTienda === group.seller,
  );
}

export function LiquidacionesScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('EN_LIQUIDACION');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [documentTarget, setDocumentTarget] = useState<RetiroAdminResponse | null>(null);

  const { data: bootstrap, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-bootstrap'],
    queryFn: adminApi.getBootstrap,
  });

  const { data: withdrawals } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: adminApi.getWithdrawals,
  });

  const settlements = useMemo(
    () => (bootstrap ? getSettlements(bootstrap.orders, bootstrap.settlementStatuses ?? {}) : []),
    [bootstrap],
  );

  const filtered = useMemo(
    () => settlements.filter((settlement) => settlement.liquidationStatus === tab),
    [settlements, tab],
  );

  const groups = useMemo(() => {
    const map = new Map<string, SellerGroup>();
    filtered.forEach((settlement) => {
      const key = settlement.sellerEmail || settlement.sellerTaxId || settlement.seller;
      const current = map.get(key) ?? {
        key,
        seller: settlement.seller,
        sellerEmail: settlement.sellerEmail,
        sellerTaxId: settlement.sellerTaxId,
        total: 0,
        settlements: [],
      };
      current.settlements.push(settlement);
      current.total += settlement.sellerPayout;
      map.set(key, current);
    });
    return Array.from(map.values());
  }, [filtered]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <ScreenContainer padded={false}>
      <AppHeader title="Liquidaciones a Vendedores" onBack={() => navigation.goBack()} right={<HeaderHomeButton />} />

      <View style={styles.body}>
        {/* Chips de Estado Fijos Arriba */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickFilterContainer}
          contentContainerStyle={styles.quickFilterScroll}
        >
          <Pressable
            style={[styles.quickChip, tab === 'EN_LIQUIDACION' && styles.quickChipActivePending]}
            onPress={() => setTab('EN_LIQUIDACION')}
          >
            <Icon name="time" size={13} color={tab === 'EN_LIQUIDACION' ? colors.white : colors.warning} />
            <Text style={[styles.quickChipText, tab === 'EN_LIQUIDACION' && styles.quickChipTextActive]}>⏳ En liquidación</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, tab === 'LIQUIDADO' && styles.quickChipActiveDone]}
            onPress={() => setTab('LIQUIDADO')}
          >
            <Icon name="checkmark-circle" size={13} color={tab === 'LIQUIDADO' ? colors.white : colors.success} />
            <Text style={[styles.quickChipText, tab === 'LIQUIDADO' && styles.quickChipTextActive]}>✅ Liquidados</Text>
          </Pressable>
        </ScrollView>

        <FlatList
          style={{ flex: 1 }}
          data={groups}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title="Sin liquidaciones" description="No hay liquidaciones en este estado." />}
          renderItem={({ item }) => {
            const isExpanded = expanded.has(item.key);
            const retiro = withdrawals ? matchRetiro(withdrawals, item) : undefined;

            return (
              <Card style={styles.card}>
                {/* Cabecera Resumida Plegada */}
                <Pressable
                  style={styles.cardSummaryHeader}
                  onPress={() =>
                    setExpanded((current) => {
                      const next = new Set(current);
                      next.has(item.key) ? next.delete(item.key) : next.add(item.key);
                      return next;
                    })
                  }
                >
                  <View style={styles.summaryTopRow}>
                    <Text style={styles.sellerTitle}>{item.seller}</Text>
                    <Badge label={tab === 'EN_LIQUIDACION' ? 'Pendiente' : 'Liquidado'} tone={tab === 'EN_LIQUIDACION' ? 'warning' : 'success'} />
                  </View>

                  <Text style={styles.summarySubText}>
                    {item.settlements.length} transacciones por liquidar
                  </Text>

                  <View style={styles.summaryBottomRow}>
                    <Text style={styles.totalText}>Monto Payout: <Text style={styles.totalHighlight}>{formatCurrency(item.total)}</Text></Text>
                    <View style={styles.expandToggleBtn}>
                      <Text style={styles.expandToggleText}>{isExpanded ? 'Ocultar ∧' : 'Ver Detalle ∨'}</Text>
                    </View>
                  </View>
                </Pressable>

                {/* Contenido Desplegable al Presionar */}
                {isExpanded ? (
                  <View style={styles.expandedContent}>
                    <View style={styles.sectionBox}>
                      <Text style={styles.sectionTitle}>📋 Desglose de Vistas y Órdenes Incluidas</Text>
                      {item.settlements.map((settlement) => (
                        <View key={settlement.id} style={styles.settlementRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.settlementIdText}>#{settlement.id} · Pedido #{settlement.orderId}</Text>
                            <Text style={styles.settlementSubText}>
                              Venta total: {formatCurrency(settlement.saleTotal)} · Payout neto: {formatCurrency(settlement.sellerPayout)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    <View style={styles.sectionBox}>
                      <Text style={styles.sectionTitle}>📄 Documentos de Liquidación (Boleta / Factura)</Text>
                      {retiro ? (
                        <Button
                          label={retiro.documentoLiquidacionCompleto ? '✅ Boleta/Factura Registrada (Ver/Editar)' : '📄 Emitir / Cargar Boleta o Factura'}
                          variant={retiro.documentoLiquidacionCompleto ? 'secondary' : 'primary'}
                          onPress={() => setDocumentTarget(retiro)}
                        />
                      ) : (
                        <Badge label="Sin solicitud de retiro activa" tone="neutral" />
                      )}
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          }}
        />
      </View>

      <LiquidationDocumentModal visible={!!documentTarget} retiro={documentTarget} onClose={() => setDocumentTarget(null)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xs, justifyContent: 'flex-start' },
  quickFilterContainer: { flexGrow: 0, flexShrink: 0, height: 38, marginBottom: spacing.xs },
  quickFilterScroll: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingHorizontal: spacing.md, height: 32,
    borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  quickChipActivePending: { backgroundColor: colors.warning, borderColor: colors.warning },
  quickChipActiveDone: { backgroundColor: colors.success, borderColor: colors.success },
  quickChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  quickChipTextActive: { color: colors.white },
  listContent: { paddingBottom: spacing.huge },
  card: { padding: 0, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardSummaryHeader: { padding: spacing.md, backgroundColor: colors.surface },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  sellerTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  summarySubText: { fontSize: 12.5, color: colors.textSecondary, marginBottom: spacing.xs },
  summaryBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  totalText: { fontSize: 12, color: colors.textSecondary },
  totalHighlight: { fontSize: 14, fontWeight: '800', color: colors.brand },
  expandToggleBtn: { backgroundColor: toneColors.brand.bg, paddingHorizontal: spacing.sm, height: 26, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  expandToggleText: { fontSize: 11.5, fontWeight: '700', color: colors.brand },
  expandedContent: { padding: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  sectionBox: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSoft, gap: spacing.xs },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xxs },
  settlementRow: { backgroundColor: colors.bg, padding: spacing.xs, borderRadius: radii.sm, marginBottom: 4 },
  settlementIdText: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  settlementSubText: { fontSize: 11, color: colors.textSecondary },
});
