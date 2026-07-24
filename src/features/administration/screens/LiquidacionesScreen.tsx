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
  MetricCard,
  ScreenContainer,
} from '@/components/shared';
import { colors, radii, spacing, toneColors } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getSettlements } from '../utils/settlements';
import { LiquidationDocumentModal } from '../components/LiquidationDocumentModal';

type Tab = 'PENDIENTE_LIQUIDACION' | 'EN_LIQUIDACION' | 'LIQUIDADO';

interface SellerGroup {
  key: string;
  seller: string;
  sellerEmail?: string;
  sellerTaxId?: string;
  total: number;
  settlements: Settlement[];
}

function matchRetiro(withdrawals: RetiroAdminResponse[], target: { seller: string; sellerEmail?: string; sellerTaxId?: string }): RetiroAdminResponse | undefined {
  const normEmail = target.sellerEmail?.toLowerCase().trim();
  const normTaxId = target.sellerTaxId?.replace(/[^0-9kK]/g, '').toLowerCase().trim();
  const normSeller = target.seller?.toLowerCase().trim();

  return withdrawals.find((retiro) => {
    const rEmail = retiro.email?.toLowerCase().trim();
    const rTaxId = retiro.rut?.replace(/[^0-9kK]/g, '').toLowerCase().trim();
    const rSeller = retiro.nombreTienda?.toLowerCase().trim();

    return (
      (normEmail && rEmail === normEmail) ||
      (normTaxId && rTaxId === normTaxId) ||
      (normSeller && rSeller === normSeller)
    );
  });
}

export function LiquidacionesScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('PENDIENTE_LIQUIDACION');
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

  // Filtrado según las 3 etapas exactas del flujo de negocio y backend:
  // 1. PENDIENTE_LIQUIDACION: Pedidos finalizados sin solicitud de retiro del vendedor.
  // 2. EN_LIQUIDACION: Vendedor solicitó retiro (con solicitud activa).
  // 3. LIQUIDADO: Pago procesado y completado.
  const filtered = useMemo(() => {
    return settlements.filter((settlement) => {
      const retiro = withdrawals ? matchRetiro(withdrawals, settlement) : undefined;
      const hasActiveWithdrawal = Boolean(retiro && (retiro.estado === 'SOLICITADO' || retiro.estado === 'EN_PROCESO'));
      const isPaidOut = Boolean(retiro && retiro.estado === 'PAGADO') || settlement.liquidationStatus === 'LIQUIDADO';

      if (tab === 'PENDIENTE_LIQUIDACION') {
        return !hasActiveWithdrawal && !isPaidOut && settlement.liquidationStatus !== 'LIQUIDADO';
      }
      if (tab === 'EN_LIQUIDACION') {
        return hasActiveWithdrawal && !isPaidOut;
      }
      if (tab === 'LIQUIDADO') {
        return isPaidOut;
      }
      return true;
    });
  }, [settlements, withdrawals, tab]);

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

  const pendingCount = settlements.filter((s) => {
    const r = withdrawals ? matchRetiro(withdrawals, s) : undefined;
    return !r && s.liquidationStatus !== 'LIQUIDADO';
  }).length;
  const inLiquidationCount = settlements.filter((s) => {
    const r = withdrawals ? matchRetiro(withdrawals, s) : undefined;
    return Boolean(r && (r.estado === 'SOLICITADO' || r.estado === 'EN_PROCESO'));
  }).length;
  const paidCount = settlements.filter((s) => {
    const r = withdrawals ? matchRetiro(withdrawals, s) : undefined;
    return Boolean(r && r.estado === 'PAGADO') || s.liquidationStatus === 'LIQUIDADO';
  }).length;

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <ScreenContainer edges={['bottom', 'left', 'right']} padded={false}>
      <View style={styles.body}>
        <View style={styles.metricsRow}>
          <MetricCard label="Pendientes" value={pendingCount} icon="time-outline" tone="warning" />
          <MetricCard label="En liquidación" value={inLiquidationCount} icon="document-text-outline" tone="brand" />
          <MetricCard label="Liquidados" value={paidCount} icon="checkmark-circle-outline" tone="success" />
        </View>
        {/* 3 Pestañas de Estado según Backend Web */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickFilterContainer}
          contentContainerStyle={styles.quickFilterScroll}
        >
          <Pressable
            style={[styles.quickChip, tab === 'PENDIENTE_LIQUIDACION' && styles.quickChipActiveWarning]}
            onPress={() => setTab('PENDIENTE_LIQUIDACION')}
          >
            <Icon name="time" size={13} color={tab === 'PENDIENTE_LIQUIDACION' ? colors.white : colors.warning} />
            <Text style={[styles.quickChipText, tab === 'PENDIENTE_LIQUIDACION' && styles.quickChipTextActive]}>
              ⏳ Pendiente liquidación
            </Text>
          </Pressable>

          <Pressable
            style={[styles.quickChip, tab === 'EN_LIQUIDACION' && styles.quickChipActiveInfo]}
            onPress={() => setTab('EN_LIQUIDACION')}
          >
            <Icon name="document-text" size={13} color={tab === 'EN_LIQUIDACION' ? colors.white : colors.brand} />
            <Text style={[styles.quickChipText, tab === 'EN_LIQUIDACION' && styles.quickChipTextActive]}>
              📑 En liquidación
            </Text>
          </Pressable>

          <Pressable
            style={[styles.quickChip, tab === 'LIQUIDADO' && styles.quickChipActiveDone]}
            onPress={() => setTab('LIQUIDADO')}
          >
            <Icon name="checkmark-circle" size={13} color={tab === 'LIQUIDADO' ? colors.white : colors.success} />
            <Text style={[styles.quickChipText, tab === 'LIQUIDADO' && styles.quickChipTextActive]}>
              ✅ Liquidados
            </Text>
          </Pressable>
        </ScrollView>

        <FlatList
          style={{ flex: 1 }}
          data={groups}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              title="Sin liquidaciones"
              description={
                tab === 'PENDIENTE_LIQUIDACION'
                  ? 'No hay pedidos finalizados pendientes por solicitar retiro.'
                  : tab === 'EN_LIQUIDACION'
                  ? 'No hay solicitudes de retiro activas en proceso de liquidación.'
                  : 'No hay liquidaciones pagadas registradas.'
              }
            />
          }
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
                    <Badge
                      label={
                        tab === 'PENDIENTE_LIQUIDACION'
                          ? 'Pendiente Retiro'
                          : tab === 'EN_LIQUIDACION'
                          ? 'En Liquidación'
                          : 'Liquidado'
                      }
                      tone={
                        tab === 'PENDIENTE_LIQUIDACION'
                          ? 'warning'
                          : tab === 'EN_LIQUIDACION'
                          ? 'info'
                          : 'success'
                      }
                    />
                  </View>

                  <Text style={styles.summarySubText}>
                    {item.settlements.length} pedidos finalizados · Payout estimado
                  </Text>

                  <View style={styles.summaryBottomRow}>
                    <Text style={styles.totalText}>
                      Monto Payout: <Text style={styles.totalHighlight}>{formatCurrency(item.total)}</Text>
                    </Text>
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
                              Venta total: {formatCurrency(settlement.saleTotal)} · Comisión RepuesTop: {formatCurrency(settlement.commission)} · Payout neto: {formatCurrency(settlement.sellerPayout)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    <View style={styles.sectionBox}>
                      <Text style={styles.sectionTitle}>📄 Documentos de Liquidación (Boleta / Factura)</Text>
                      {retiro ? (
                        <Button
                          label={
                            retiro.documentoLiquidacionCompleto
                              ? '✅ Boleta/Factura Registrada (Ver/Editar)'
                              : '📄 Emitir / Cargar Boleta o Factura'
                          }
                          variant={retiro.documentoLiquidacionCompleto ? 'secondary' : 'primary'}
                          onPress={() => setDocumentTarget(retiro)}
                        />
                      ) : (
                        <View style={styles.noWithdrawalBanner}>
                          <Icon name="information-circle" size={15} color={colors.textSecondary} />
                          <Text style={styles.noWithdrawalText}>
                            El vendedor aún no ha iniciado una solicitud de retiro para estos fondos.
                          </Text>
                        </View>
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
  metricsRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  quickFilterContainer: { flexGrow: 0, flexShrink: 0, height: 38, marginBottom: spacing.xs },
  quickFilterScroll: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingHorizontal: spacing.md, height: 32,
    borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  quickChipActiveWarning: { backgroundColor: colors.warning, borderColor: colors.warning },
  quickChipActiveInfo: { backgroundColor: colors.brand, borderColor: colors.brand },
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
  noWithdrawalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bg,
    padding: spacing.xs,
    borderRadius: radii.sm,
  },
  noWithdrawalText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    flex: 1,
  },
});
