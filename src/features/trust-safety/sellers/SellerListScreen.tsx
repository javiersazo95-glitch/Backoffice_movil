import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as sellersApi from '@/api/sellers';
import { SellerStatus } from '@/types/seller';
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
import { SELLER_STATUS_LABELS, SELLER_STATUS_TONE, TRUST_LEVEL_LABELS } from '../utils/labels';

type QuickStatusFilter = 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED';

export function SellerListScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuickStatusFilter>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const statusParam =
    statusFilter === 'APPROVED'
      ? SellerStatus.APROBADO
      : statusFilter === 'PENDING'
      ? SellerStatus.POR_CORREGIR
      : statusFilter === 'REJECTED'
      ? SellerStatus.RECHAZADO
      : undefined;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trust-sellers', search, statusParam],
    queryFn: () => sellersApi.getSellers({ search: search || undefined, status: statusParam, size: 50 }),
  });

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const sellers = data?.content ?? [];
  const activeSellers = sellers.filter((s) => s.status === SellerStatus.APROBADO).length;
  const activeMediations = sellers.reduce((sum, s) => sum + (s.mediationCount ?? 0), 0);
  const disputeCount = sellers.reduce((sum, s) => sum + (s.claimsCount ?? 0), 0);

  return (
    <ScreenContainer edges={['bottom', 'left', 'right']} padded={false}>
      <View style={styles.body}>
        {/* Fila de Métricas Rápida sin Scroll Horizontal */}
        <View style={styles.metricsRow}>
          <MetricCard label="Activos" value={activeSellers} icon="people-outline" tone="success" />
          <MetricCard label="Mediaciones" value={activeMediations} icon="shield-outline" tone="brand" />
          <MetricCard label="En disputa" value={disputeCount} icon="time-outline" tone="warning" />
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
            style={[styles.quickChip, statusFilter === 'APPROVED' && styles.quickChipActiveApproved]}
            onPress={() => setStatusFilter('APPROVED')}
          >
            <Icon name="checkmark-circle" size={13} color={statusFilter === 'APPROVED' ? colors.white : colors.success} />
            <Text style={[styles.quickChipText, statusFilter === 'APPROVED' && styles.quickChipTextActive]}>✅ Aprobados</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, statusFilter === 'PENDING' && styles.quickChipActivePending]}
            onPress={() => setStatusFilter('PENDING')}
          >
            <Icon name="time" size={13} color={statusFilter === 'PENDING' ? colors.white : colors.warning} />
            <Text style={[styles.quickChipText, statusFilter === 'PENDING' && styles.quickChipTextActive]}>⏳ Por corregir</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, statusFilter === 'REJECTED' && styles.quickChipActiveRejected]}
            onPress={() => setStatusFilter('REJECTED')}
          >
            <Icon name="alert-circle" size={13} color={statusFilter === 'REJECTED' ? colors.white : colors.danger} />
            <Text style={[styles.quickChipText, statusFilter === 'REJECTED' && styles.quickChipTextActive]}>❌ Rechazados</Text>
          </Pressable>
        </ScrollView>

        <SearchBar placeholder="Buscar comercio por nombre o RUT..." value={search} onChangeText={setSearch} />

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={sellers}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState title="Sin resultados" description="No se encontraron comercios para la búsqueda." />}
            renderItem={({ item }) => {
              const isExpanded = expandedId === item.id;
              return (
                <Card style={styles.card}>
                  <Pressable style={styles.cardSummaryHeader} onPress={() => toggleExpand(item.id)}>
                    <View style={styles.summaryTopRow}>
                      <View style={styles.storeNameWrap}>
                        <Text style={styles.storeName}>{item.storeName}</Text>
                        <Text style={styles.rutText}>{item.rut} · {item.city}</Text>
                      </View>
                      <Badge label={SELLER_STATUS_LABELS[item.status]} tone={SELLER_STATUS_TONE[item.status]} />
                    </View>
                    <View style={styles.summaryBottomRow}>
                      <View style={styles.trustWrap}>
                        <Text style={styles.trustLabel}>Score Confianza: <Text style={styles.trustValue}>{item.trustScore}%</Text></Text>
                      </View>
                      <View style={styles.expandToggleBtn}>
                        <Text style={styles.expandToggleText}>{isExpanded ? 'Ocultar ∧' : 'Ver Ficha ∨'}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {isExpanded ? (
                    <View style={styles.expandedContent}>
                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>📊 Métricas de Desempeño</Text>
                        <View style={styles.infoGrid}>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Reclamos:</Text> {item.claimsCount} · <Text style={styles.boldText}>Mediaciones:</Text> {item.mediationCount}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Devoluciones:</Text> {item.returnsCount} · <Text style={styles.boldText}>Tickets abiertos:</Text> {item.openTickets}</Text>
                        </View>
                      </View>

                      <Button
                        label="Ver Perfil Completo del Vendedor"
                        variant="secondary"
                        onPress={() => navigation.navigate('SellerDetail', { sellerId: item.id })}
                      />
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
  quickChipActiveApproved: { backgroundColor: colors.success, borderColor: colors.success },
  quickChipActivePending: { backgroundColor: colors.warning, borderColor: colors.warning },
  quickChipActiveRejected: { backgroundColor: colors.danger, borderColor: colors.danger },
  quickChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  quickChipTextActive: { color: colors.white },
  listContent: { paddingBottom: spacing.huge, paddingTop: spacing.xs },
  card: { padding: 0, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardSummaryHeader: { padding: spacing.md, backgroundColor: colors.surface },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  storeNameWrap: { flex: 1, paddingRight: spacing.sm },
  storeName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  rutText: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  summaryBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  trustWrap: { flexDirection: 'row', alignItems: 'center' },
  trustLabel: { fontSize: 12, color: colors.textSecondary },
  trustValue: { fontSize: 13, fontWeight: '800', color: colors.brand },
  expandToggleBtn: { backgroundColor: toneColors.brand.bg, paddingHorizontal: spacing.sm, height: 26, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  expandToggleText: { fontSize: 11.5, fontWeight: '700', color: colors.brand },
  expandedContent: { padding: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  sectionBox: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSoft, gap: spacing.xs },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xxs },
  infoGrid: { gap: 4 },
  infoText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  boldText: { fontWeight: '700', color: colors.textPrimary },
});
