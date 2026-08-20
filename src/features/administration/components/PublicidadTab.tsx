import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import * as adminApi from '@/api/administration';
import type { AdvertisingOrder } from '@/types/administration';
import {
  Card,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  MetricCard,
  SearchBar,
} from '@/components/shared';
import { colors, radii, spacing, toneColors } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Compras de fichas para publicar avisos. Es el equivalente móvil del tab
 * "Publicidad" de Pedidos en el backoffice web.
 */
export function PublicidadTab() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdvertisingOrder | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['advertising-orders'],
    queryFn: adminApi.getAdvertisingOrders,
  });

  const rows = useMemo(() => {
    const all = data?.compras ?? [];
    const term = normalize(search);
    if (!term) return all;
    return all.filter((row) =>
      [row.codigo, row.comprador, row.correo, row.pack, row.metodoPago].some((value) =>
        normalize(value).includes(term),
      ),
    );
  }, [data, search]);

  /** Las métricas siguen a lo filtrado, para que cuadren con la lista. */
  const metrics = useMemo(() => {
    const sum = (pick: (row: AdvertisingOrder) => number) =>
      rows.reduce((total, row) => total + (pick(row) || 0), 0);
    return {
      cantidad: rows.length,
      monto: sum((row) => row.montoPagado),
      ganancia: sum((row) => row.montoNeto),
      comision: sum((row) => row.comisionPasarela),
      fichas: sum((row) => row.cantidadFichas),
    };
  }, [rows]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <View style={styles.container}>
      <View style={styles.metricsRow}>
        <MetricCard label="Compras" value={metrics.cantidad} icon="cart-outline" tone="warning" style={styles.metric} />
        <MetricCard label="Monto" value={formatCurrency(metrics.monto)} icon="wallet-outline" tone="brand" style={styles.metric} />
        <MetricCard label="Ganancia" value={formatCurrency(metrics.ganancia)} icon="trending-up-outline" tone="success" style={styles.metric} />
        <MetricCard label="Pasarela" value={formatCurrency(metrics.comision)} icon="card-outline" tone="danger" style={styles.metric} />
      </View>

      <Text style={styles.hint}>{metrics.fichas.toLocaleString('es-CL')} fichas vendidas en el período</Text>

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por código, comprador o correo..." />
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="Sin compras de publicidad"
            description={
              search
                ? 'No hay compras que coincidan con la búsqueda.'
                : 'Todavía no se han registrado compras de fichas.'
            }
          />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardTopRow}>
              <Text style={styles.codigo}>{item.codigo}</Text>
              <View style={styles.estadoPill}>
                <Text style={styles.estadoText}>{item.estado}</Text>
              </View>
            </View>

            <Text style={styles.comprador} numberOfLines={1}>
              {item.comprador ?? 'Sin registrar'}
            </Text>
            <Text style={styles.correo} numberOfLines={1}>
              {item.correo ?? '—'}
            </Text>

            <View style={styles.amountsRow}>
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Pagado</Text>
                <Text style={styles.amountValue}>{formatCurrency(item.montoPagado)}</Text>
              </View>
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Pasarela</Text>
                <Text style={[styles.amountValue, styles.negative]}>− {formatCurrency(item.comisionPasarela)}</Text>
              </View>
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Ganancia</Text>
                <Text style={[styles.amountValue, styles.positive]}>{formatCurrency(item.montoNeto)}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.metaText}>
                {item.cantidadFichas.toLocaleString('es-CL')} fichas · {formatDateTime(item.fecha)}
              </Text>
              <Pressable
                style={styles.detailBtn}
                onPress={() => setSelected(item)}
                accessibilityRole="button"
                accessibilityLabel={`Ver resumen de ${item.codigo}`}
              >
                <Icon name="eye" size={14} color={colors.brand} />
                <Text style={styles.detailBtnText}>Ver resumen</Text>
              </Pressable>
            </View>
          </Card>
        )}
      />

      <Modal visible={Boolean(selected)} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Compra de publicidad</Text>
                <Text style={styles.modalSubtitle}>{selected?.codigo}</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setSelected(null)} accessibilityLabel="Cerrar">
                <Icon name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {selected ? (
              <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Primero la plata: cómo se descompone el pago. */}
                <View style={styles.highlightsRow}>
                  <View style={styles.highlight}>
                    <Text style={styles.highlightLabel}>Monto pagado</Text>
                    <Text style={styles.highlightValue}>{formatCurrency(selected.montoPagado)}</Text>
                  </View>
                  <View style={[styles.highlight, styles.highlightNegative]}>
                    <Text style={styles.highlightLabel}>Comisión pasarela</Text>
                    <Text style={[styles.highlightValue, styles.negative]}>− {formatCurrency(selected.comisionPasarela)}</Text>
                  </View>
                  <View style={[styles.highlight, styles.highlightPositive]}>
                    <Text style={styles.highlightLabel}>Ganancia</Text>
                    <Text style={[styles.highlightValue, styles.positive]}>{formatCurrency(selected.montoNeto)}</Text>
                  </View>
                </View>

                <DetailSection
                  icon="person-outline"
                  title="Quién pagó"
                  rows={[
                    ['Nombre', selected.comprador ?? 'Sin registrar'],
                    ['Correo', selected.correo ?? '—'],
                    ['Usuario', selected.usuarioId ? `#${selected.usuarioId}` : 'Sin sesión asociada'],
                  ]}
                />

                <DetailSection
                  icon="wallet-outline"
                  title="Compra"
                  rows={[
                    ['Código', selected.codigo],
                    ['Fecha de pago', formatDateTime(selected.fecha)],
                    ['Pack', selected.pack ?? '—'],
                    ['Fichas', selected.cantidadFichas.toLocaleString('es-CL')],
                  ]}
                />

                <DetailSection
                  icon="receipt-outline"
                  title="Pago"
                  rows={[
                    ['Método', selected.metodoPago ?? '—'],
                    ['Referencia pasarela', selected.referenciaPago ?? '—'],
                    ['Estado', selected.estado],
                  ]}
                />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailSection({
  icon,
  title,
  rows,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  rows: [string, string][];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon name={icon} size={15} color={colors.brand} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {rows.map(([label, value], index) => (
        <View key={label} style={[styles.sectionRow, index === rows.length - 1 && styles.sectionRowLast]}>
          <Text style={styles.sectionLabel}>{label}</Text>
          <Text style={styles.sectionValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  metricsRow: { flexDirection: 'row', gap: spacing.xxs, marginBottom: spacing.xs },
  metric: { flex: 1, minWidth: 0 },
  hint: { fontSize: 11.5, color: colors.textTertiary, marginBottom: spacing.xs },
  searchWrap: { marginBottom: spacing.sm },
  listContent: { paddingBottom: spacing.huge },
  card: { padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.xxs },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codigo: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  estadoPill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.pill, backgroundColor: toneColors.success.bg },
  estadoText: { fontSize: 11, fontWeight: '700', color: colors.success },
  comprador: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  correo: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.xs },
  amountsRow: { flexDirection: 'row', gap: spacing.xs },
  amountBox: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  amountLabel: { fontSize: 10, color: colors.textTertiary, fontWeight: '600' },
  amountValue: { fontSize: 12.5, fontWeight: '800', color: colors.textPrimary },
  negative: { color: colors.danger },
  positive: { color: colors.success },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    marginTop: spacing.xxs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  metaText: { fontSize: 11.5, color: colors.textTertiary, flex: 1 },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: toneColors.brand.bg,
  },
  detailBtnText: { fontSize: 11.5, fontWeight: '700', color: colors.brand },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  modalSubtitle: { fontSize: 12.5, color: colors.textSecondary },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  modalContent: { padding: spacing.md, gap: spacing.md },
  highlightsRow: { flexDirection: 'row', gap: spacing.xs },
  highlight: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.bg,
    gap: 2,
  },
  highlightNegative: { borderColor: toneColors.danger.fg, backgroundColor: toneColors.danger.bg },
  highlightPositive: { borderColor: toneColors.success.fg, backgroundColor: toneColors.success.bg },
  highlightLabel: { fontSize: 10.5, fontWeight: '600', color: colors.textTertiary },
  highlightValue: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  section: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  sectionTitle: { fontSize: 12.5, fontWeight: '800', color: colors.brand, textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  sectionRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  sectionLabel: { fontSize: 12, color: colors.textSecondary },
  sectionValue: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, flex: 1, textAlign: 'right' },
});
