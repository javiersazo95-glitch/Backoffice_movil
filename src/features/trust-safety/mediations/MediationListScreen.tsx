import React, { useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as mediationsApi from '@/api/mediations';
import { MediationStatus, type MediationResponse } from '@/types/mediation';
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
import { HeaderHomeButton } from '@/components/layout/HeaderHomeButton';
import { AppHeader } from '@/components/layout/AppHeader';
import { colors, radii, spacing, toneColors } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { MEDIATION_STATUS_LABELS, MEDIATION_STATUS_TONE } from '../utils/labels';

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

  const allItems = [...(data?.content ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const filteredItems = allItems.filter((item) => {
    if (statusFilter === 'DISPUTE') {
      return (
        item.status === MediationStatus.EN_DISPUTA ||
        item.status === MediationStatus.ESPERANDO_VENDEDOR ||
        item.status === MediationStatus.ESCALADO ||
        item.displayStatus === 'En disputa'
      );
    }
    if (statusFilter === 'MEDIATION') {
      return item.status === MediationStatus.EN_MEDIACION || item.displayStatus === 'En mediación';
    }
    if (statusFilter === 'RESOLVED') {
      return (
        item.status === MediationStatus.RESUELTA ||
        item.status === MediationStatus.CERRADA ||
        item.displayStatus === 'Resuelta' ||
        item.displayStatus === 'Cerrada'
      );
    }
    return true;
  });

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <ScreenContainer padded={false}>
      {/* Cabecera Única */}
      <AppHeader title="Mediaciones y Disputas" onBack={() => navigation.goBack()} right={<HeaderHomeButton />} />

      <View style={styles.body}>
        {/* Chips de Filtro Rápido Fijos Arriba (Mismo estilo que Validaciones) */}
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
            <Text style={[styles.quickChipText, statusFilter === 'DISPUTE' && styles.quickChipTextActive]}>⚡ En disputa</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, statusFilter === 'MEDIATION' && styles.quickChipActiveMediation]}
            onPress={() => setStatusFilter('MEDIATION')}
          >
            <Icon name="scale" size={13} color={statusFilter === 'MEDIATION' ? colors.white : colors.violet} />
            <Text style={[styles.quickChipText, statusFilter === 'MEDIATION' && styles.quickChipTextActive]}>⚖️ En mediación</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, statusFilter === 'RESOLVED' && styles.quickChipActiveResolved]}
            onPress={() => setStatusFilter('RESOLVED')}
          >
            <Icon name="checkmark-circle" size={13} color={statusFilter === 'RESOLVED' ? colors.white : colors.success} />
            <Text style={[styles.quickChipText, statusFilter === 'RESOLVED' && styles.quickChipTextActive]}>✅ Resueltos</Text>
          </Pressable>
        </ScrollView>

        {/* Buscador Integrado */}
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
              const isDispute =
                item.status === MediationStatus.EN_DISPUTA ||
                item.status === MediationStatus.ESPERANDO_VENDEDOR ||
                item.status === MediationStatus.ESCALADO ||
                item.displayStatus === 'En disputa';

              return (
                <Card style={styles.card}>
                  {/* Vista Resumida General (Siempre visible) */}
                  <Pressable style={styles.cardSummaryHeader} onPress={() => toggleExpand(item.id)}>
                    <View style={styles.summaryTopRow}>
                      <View style={styles.idBadgeWrap}>
                        <Text style={styles.externalIdText}>#{item.externalId}</Text>
                        <Text style={styles.partiesText}>{item.buyer ?? 'Comprador'} vs {item.sellerName}</Text>
                      </View>
                      <Badge
                        label={item.accountBlocked ? 'Cuenta bloqueada' : isDispute ? 'En disputa' : MEDIATION_STATUS_LABELS[item.status]}
                        tone={item.accountBlocked ? 'danger' : isDispute ? 'warning' : MEDIATION_STATUS_TONE[item.status]}
                      />
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
                        <Text style={styles.expandToggleText}>{isExpanded ? 'Ocultar ∧' : 'Ver Caso ∨'}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {/* Contenido Desplegable al Presionar */}
                  {isExpanded ? (
                    <View style={styles.expandedContent}>
                      {/* Sección 1: Datos Generales del Registro */}
                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>📋 Información Detallada del Registro</Text>
                        <View style={styles.infoGrid}>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Folio de Mediación:</Text> #{item.externalId}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Comprador Afectado:</Text> {item.buyer ?? 'Juan Pérez'}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Tienda / Vendedor:</Text> {item.sellerName} (ID: {item.sellerId})</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Pedido Asociado:</Text> #{item.orderId}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Monto en Reclamo:</Text> {formatCurrency(item.amount)}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Etapa del Proceso:</Text> {item.stage}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Motivo:</Text> {item.reason}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Última Actualización:</Text> {formatDateTime(item.updatedAt)}</Text>
                        </View>
                      </View>

                      {/* Sección 2: Acciones Directas de Gestión y Respuesta */}
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
  quickFilterContainer: { flexGrow: 0, flexShrink: 0, height: 38, marginBottom: spacing.xs },
  quickFilterScroll: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingHorizontal: spacing.md, height: 32,
    borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  quickChipActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  quickChipActiveDispute: { backgroundColor: colors.warning, borderColor: colors.warning },
  quickChipActiveMediation: { backgroundColor: colors.violet, borderColor: colors.violet },
  quickChipActiveResolved: { backgroundColor: colors.success, borderColor: colors.success },
  quickChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  quickChipTextActive: { color: colors.white },
  searchWrap: { marginBottom: spacing.sm },
  listContent: { paddingBottom: spacing.huge },
  card: { padding: 0, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardSummaryHeader: { padding: spacing.md, backgroundColor: colors.surface },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  idBadgeWrap: { flex: 1, paddingRight: spacing.sm },
  externalIdText: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  partiesText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginTop: 1 },
  reasonSummaryText: { fontSize: 12.5, color: colors.textPrimary, marginVertical: spacing.xs, lineHeight: 17 },
  summaryBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  amountWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amountLabel: { fontSize: 11, color: colors.textTertiary },
  amountValue: { fontSize: 13, fontWeight: '800', color: colors.brand },
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
