import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as adminApi from '@/api/administration';
import type { RetiroAdminResponse, Settlement } from '@/types/administration';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  ScreenContainer,
  SegmentedTabs,
} from '@/components/shared';
import { colors, spacing, typography } from '@/theme';
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
    <ScreenContainer>
      <View style={styles.tabsWrap}>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'EN_LIQUIDACION', label: 'En liquidación' },
            { value: 'LIQUIDADO', label: 'Liquidado' },
          ]}
        />
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.key}
        ListEmptyComponent={<EmptyState title="Sin liquidaciones" description="No hay liquidaciones en este estado." />}
        renderItem={({ item }) => {
          const isExpanded = expanded.has(item.key);
          const retiro = withdrawals ? matchRetiro(withdrawals, item) : undefined;
          return (
            <Card style={styles.card}>
              <Pressable
                style={styles.headerRow}
                onPress={() =>
                  setExpanded((current) => {
                    const next = new Set(current);
                    next.has(item.key) ? next.delete(item.key) : next.add(item.key);
                    return next;
                  })
                }
              >
                <View style={styles.headerTexts}>
                  <Text style={typography.subtitle}>{item.seller}</Text>
                  <Text style={typography.bodySm}>{item.settlements.length} liquidaciones · {formatCurrency(item.total)}</Text>
                </View>
                <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
              </Pressable>

              {isExpanded ? (
                <View style={styles.detailList}>
                  {item.settlements.map((settlement) => (
                    <View key={settlement.id} style={styles.detailRow}>
                      <View style={styles.detailTexts}>
                        <Text style={typography.bodySm}>{settlement.id} · Pedido {settlement.orderId}</Text>
                        <Text style={typography.caption}>
                          Venta {formatCurrency(settlement.saleTotal)} · Ganancia {formatCurrency(settlement.netSettlement)}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {retiro ? (
                    <Pressable style={styles.docButton} onPress={() => setDocumentTarget(retiro)}>
                      <Icon
                        name={retiro.documentoLiquidacionCompleto ? 'checkmark-circle' : 'receipt-outline'}
                        size={16}
                        color={retiro.documentoLiquidacionCompleto ? colors.success : colors.brand}
                      />
                      <Text style={styles.docButtonText}>
                        {retiro.documentoLiquidacionCompleto ? 'Boleta/factura registrada' : 'Emitir boleta o factura'}
                      </Text>
                    </Pressable>
                  ) : (
                    <Badge label="Sin retiro activo para emitir documento" tone="neutral" />
                  )}
                </View>
              ) : null}
            </Card>
          );
        }}
      />

      <LiquidationDocumentModal visible={!!documentTarget} retiro={documentTarget} onClose={() => setDocumentTarget(null)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabsWrap: { paddingTop: spacing.md, marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTexts: { gap: spacing.xxs },
  detailList: { marginTop: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailTexts: { gap: spacing.xxs },
  docButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  docButtonText: { ...typography.bodySm, color: colors.brand, fontWeight: '600', textTransform: 'none' },
});
