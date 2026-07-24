import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as mediationsApi from '@/api/mediations';
import { MediationStatus } from '@/types/mediation';
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
  SearchBar,
} from '@/components/shared';
import { colors, radii, spacing, toneColors } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import {
  getMediationDisplayStatus,
  getMediationDisplayTone,
  MEDIATION_STATUS_LABELS,
  MEDIATION_STATUS_TONE,
  normalizeVisibleMediationStatus,
} from '../utils/labels';

type QuickStatusFilter = 'ALL' | 'DISPUTE' | 'MEDIATION' | 'RESOLVED';

export function MediationListScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuickStatusFilter>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['mediations', search],
    queryFn: () => mediationsApi.getMediations({ search: search || undefined, size: 50 }),
  });

  const rawItems = data?.content ?? [];
  const allItems = rawItems
    .map((item) => {
      const normStatus = normalizeVisibleMediationStatus(item.status, item.mediationStarted);
      return {
        ...item,
        status: normStatus,
      };
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const filteredItems = allItems.filter((item) => {
    if (statusFilter === 'DISPUTE') {
      return (
        item.status === MediationStatus.EN_DISPUTA ||
        item.status === MediationStatus.ESPERANDO_VENDEDOR ||
        item.status === MediationStatus.ESCALADO
      );
    }
    if (statusFilter === 'MEDIATION') {
      return item.status === MediationStatus.EN_MEDIACION;
    }
    if (statusFilter === 'RESOLVED') {
      return item.status === MediationStatus.RESUELTA || item.status === MediationStatus.CERRADA;
    }
    return true;
  });

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const disputeCount = allItems.filter(
    (i) =>
      i.status === MediationStatus.EN_DISPUTA ||
      i.status === MediationStatus.ESPERANDO_VENDEDOR ||
      i.status === MediationStatus.ESCALADO,
  ).length;
  const mediationCount = allItems.filter((i) => i.status === MediationStatus.EN_MEDIACION).length;
  const resolvedCount = allItems.filter(
    (i) => i.status === MediationStatus.RESUELTA || i.status === MediationStatus.CERRADA,
  ).length;

  return (
    <ScreenContainer edges={['bottom', 'left', 'right']} padded={false}>
      <View style={styles.body}>
        <View style={styles.metricsRow}>
          <MetricCard label="En disputa" value={disputeCount} icon="time-outline" tone="warning" />
          <MetricCard label="En mediación" value={mediationCount} icon="shield-outline" tone="brand" />
          <MetricCard label="Resueltas" value={resolvedCount} icon="checkmark-circle-outline" tone="success" />
        </View>

        {/* Chips de Filtro Rápido Fijos Arriba */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickFilterContainer}
          contentContainerStyle={styles.quickFilterScroll}
        >
          <Pressable
            style={[styles.quickChip, statusFilter === 'ALL' && styles.quickChipActive]}
            onPress={() => setStatusFilter('ALL')}
          >
            <Text style={[styles.quickChipText, statusFilter === 'ALL' && styles.quickChipTextActive]}>Todos</Text>
          </Pressable>

          <Pressable
            style={[styles.quickChip, statusFilter === 'DISPUTE' && styles.quickChipActiveDispute]}
            onPress={() => setStatusFilter('DISPUTE')}
          >
            <Icon name="time" size={13} color={statusFilter === 'DISPUTE' ? colors.white : colors.warning} />
            <Text style={[styles.quickChipText, statusFilter === 'DISPUTE' && styles.quickChipTextActive]}>⏳ En disputa ({disputeCount})</Text>
          </Pressable>

          <Pressable
            style={[styles.quickChip, statusFilter === 'MEDIATION' && styles.quickChipActiveMediation]}
            onPress={() => setStatusFilter('MEDIATION')}
          >
            <Icon name="shield-checkmark" size={13} color={statusFilter === 'MEDIATION' ? colors.white : colors.violet} />
            <Text style={[styles.quickChipText, statusFilter === 'MEDIATION' && styles.quickChipTextActive]}>⚖️ En mediación ({mediationCount})</Text>
          </Pressable>

          <Pressable
            style={[styles.quickChip, statusFilter === 'RESOLVED' && styles.quickChipActiveDone]}
            onPress={() => setStatusFilter('RESOLVED')}
          >
            <Icon name="checkmark-circle" size={13} color={statusFilter === 'RESOLVED' ? colors.white : colors.success} />
            <Text style={[styles.quickChipText, statusFilter === 'RESOLVED' && styles.quickChipTextActive]}>✅ Resueltas ({resolvedCount})</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por folio, tienda, comprador o pedido..."
          />
        </View>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={filteredItems}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState title="Sin registros" description="No se encontraron mediaciones o disputas para los filtros aplicados." />}
            renderItem={({ item }) => {
              const isExpanded = expandedId === item.id;
              const displayLabel = getMediationDisplayStatus(item.status, item.mediationStarted, item.accountBlocked);
              const displayTone = getMediationDisplayTone(item.status, item.mediationStarted, item.accountBlocked);

              return (
                <Card style={styles.card}>
                  <Pressable style={styles.cardSummaryHeader} onPress={() => toggleExpand(item.id)}>
                    <View style={styles.summaryTopRow}>
                      <View style={styles.idBadgeWrap}>
                        <Text style={styles.externalIdText}>#{item.externalId}</Text>
                        <Text style={styles.partiesText}>{item.buyer ?? 'Comprador'} vs {item.sellerName}</Text>
                      </View>
                      <Badge label={displayLabel} tone={displayTone} />
                    </View>

                    <Text style={styles.reasonSummaryText} numberOfLines={1}>
                      Pedido #{item.orderId} · {item.reason}
                    </Text>

                    <View style={styles.summaryBottomRow}>
                      <View style={styles.amountWrap}>
                        <Text style={styles.amountLabel}>Monto disputado:</Text>
                        <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text>
                      </View>
                      <View style={styles.expandToggleBtn}>
                        <Text style={styles.expandToggleText}>{isExpanded ? 'Ocultar ∧' : 'Ver Ficha ∨'}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {isExpanded ? (
                    <View style={styles.expandedContent}>
                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>📋 Información General del Reclamo</Text>
                        <View style={styles.infoGrid}>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Pedido:</Text> #{item.orderId}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Comprador:</Text> {item.buyer ?? 'Comprador'}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Vendedor:</Text> {item.sellerName}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Motivo:</Text> {item.reason}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Última Actualización:</Text> {formatDateTime(item.updatedAt)}</Text>
                        </View>
                      </View>

                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>⚡ Acciones Directas de Atención</Text>
                        <Button
                          label="Abrir Chat Completo y Evidencias →"
                          style={styles.chatActionBtn}
                          onPress={() => navigation.navigate('MediationDetail', { mediationId: item.id })}
                        />
                      </View>
                    </View>
                  ) : null}
                </Card>
              );
            }}
          />
        )}
      </View>
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
  quickChipActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  quickChipActiveDispute: { backgroundColor: colors.warning, borderColor: colors.warning },
  quickChipActiveMediation: { backgroundColor: colors.violet, borderColor: colors.violet },
  quickChipActiveDone: { backgroundColor: colors.success, borderColor: colors.success },
  quickChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  quickChipTextActive: { color: colors.white },
  searchWrap: { marginBottom: spacing.xs },
  listContent: { paddingBottom: spacing.huge, paddingTop: spacing.xs },
  card: { padding: 0, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardSummaryHeader: { padding: spacing.md, backgroundColor: colors.surface },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  idBadgeWrap: { flex: 1, paddingRight: spacing.sm },
  externalIdText: { fontSize: 13, fontWeight: '800', color: colors.brand },
  partiesText: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginTop: 1 },
  reasonSummaryText: { fontSize: 12.5, color: colors.textSecondary, marginBottom: spacing.xs },
  summaryBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  amountWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amountLabel: { fontSize: 12, color: colors.textSecondary },
  amountValue: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  expandToggleBtn: { backgroundColor: toneColors.brand.bg, paddingHorizontal: spacing.sm, height: 26, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  expandToggleText: { fontSize: 11.5, fontWeight: '700', color: colors.brand },
  expandedContent: { padding: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  sectionBox: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSoft, gap: spacing.xs },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xxs },
  infoGrid: { gap: 4 },
  infoText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  boldText: { fontWeight: '700', color: colors.textPrimary },
  chatActionBtn: { marginTop: spacing.xs },
});
