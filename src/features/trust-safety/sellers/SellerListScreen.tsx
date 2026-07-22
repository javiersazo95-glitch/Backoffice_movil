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
  ScreenContainer,
  SearchBar,
} from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { HeaderHomeButton } from '@/components/layout/HeaderHomeButton';
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

  return (
    <ScreenContainer padded={false}>
      <AppHeader title="Directorio de Vendedores" onBack={() => navigation.goBack()} right={<HeaderHomeButton />} />

      <View style={styles.body}>
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

        {/* Buscador Integrado */}
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar tienda, RUT, ciudad o correo..." />
        </View>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={data?.content ?? []}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState title="Sin vendedores" description="No hay tiendas para los filtros aplicados." />}
            renderItem={({ item }) => {
              const isExpanded = expandedId === item.id;

              return (
                <Card style={styles.card}>
                  {/* Vista Resumida Plegada */}
                  <Pressable style={styles.cardSummaryHeader} onPress={() => toggleExpand(item.id)}>
                    <View style={styles.summaryTopRow}>
                      <View style={styles.storeNameWrap}>
                        <Text style={styles.storeName}>{item.storeName}</Text>
                        <Text style={styles.storeSubText}>{item.city} · RUT {item.rut}</Text>
                      </View>
                      <Badge label={SELLER_STATUS_LABELS[item.status]} tone={SELLER_STATUS_TONE[item.status]} />
                    </View>

                    <View style={styles.summaryBottomRow}>
                      <View style={styles.trustWrap}>
                        <Icon name="shield-checkmark" size={12} color={colors.success} />
                        <Text style={styles.trustText}>Confianza {TRUST_LEVEL_LABELS[item.trustLevel]} · {item.rating.toFixed(1)}★</Text>
                      </View>
                      <View style={styles.expandToggleBtn}>
                        <Text style={styles.expandToggleText}>{isExpanded ? 'Ocultar ∧' : 'Ver Tienda ∨'}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {/* Contenido Desplegable */}
                  {isExpanded ? (
                    <View style={styles.expandedContent}>
                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>🏪 Ficha Resumida de la Tienda</Text>
                        <View style={styles.infoGrid}>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Razón Social:</Text> {item.storeName}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>RUT Empresa:</Text> {item.rut}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Ciudad / Ubicación:</Text> {item.city}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Índice de Confianza:</Text> {TRUST_LEVEL_LABELS[item.trustLevel]}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Reputación en Plataforma:</Text> {item.rating.toFixed(1)} / 5.0 (Calificación alta)</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Estado de Cuenta:</Text> {SELLER_STATUS_LABELS[item.status]}</Text>
                        </View>
                      </View>

                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>⚡ Gestión de Cuenta</Text>
                        <Button
                          label="🏪 Ver Ficha Completa del Vendedor →"
                          onPress={() => navigation.navigate('SellerDetail', { sellerId: item.id })}
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
  searchWrap: { marginBottom: spacing.sm },
  listContent: { paddingBottom: spacing.huge },
  card: { padding: 0, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardSummaryHeader: { padding: spacing.md, backgroundColor: colors.surface },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  storeNameWrap: { flex: 1, paddingRight: spacing.sm },
  storeName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  storeSubText: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  summaryBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  trustWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { fontSize: 11, color: colors.textTertiary },
  expandToggleBtn: { backgroundColor: toneColors.brand.bg, paddingHorizontal: spacing.sm, height: 26, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  expandToggleText: { fontSize: 11.5, fontWeight: '700', color: colors.brand },
  expandedContent: { padding: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  sectionBox: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSoft, gap: spacing.xs },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xxs },
  infoGrid: { gap: 4 },
  infoText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  boldText: { fontWeight: '700', color: colors.textPrimary },
});
