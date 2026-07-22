import React, { useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as supportApi from '@/api/support';
import type { TicketStatus, TicketPriority, TicketCategory } from '@/api/support';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  PriorityBadge,
  ScreenContainer,
  SearchBar,
} from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { HeaderHomeButton } from '@/components/layout/HeaderHomeButton';
import { colors, radii, spacing, toneColors } from '@/theme';
import { formatDateTime } from '@/utils/formatters';
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_TONE } from '../utils/ticketLabels';

type QuickFilter = 'ALL' | 'NEW' | 'CRITICAL' | 'IN_PROGRESS';

export function TicketListScreen({ isQa = false }: { isQa?: boolean }) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const resolvedIsQa = isQa || route.name === 'QaReports';

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TicketStatus | undefined>(undefined);
  const [priority, setPriority] = useState<TicketPriority | undefined>(undefined);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['support-tickets', resolvedIsQa, search, status, priority],
    queryFn: () =>
      resolvedIsQa
        ? supportApi.getQaReports({ search: search || undefined, status, priority, size: 50 })
        : supportApi.getTickets({ search: search || undefined, status, priority, size: 50 }),
  });

  const handleQuickFilter = (type: QuickFilter) => {
    setQuickFilter(type);
    if (type === 'NEW') {
      setStatus('ABIERTO' as TicketStatus);
      setPriority(undefined);
    } else if (type === 'CRITICAL') {
      setStatus(undefined);
      setPriority('CRITICA' as TicketPriority);
    } else if (type === 'IN_PROGRESS') {
      setStatus('EN_PROCESO' as TicketStatus);
      setPriority(undefined);
    } else {
      setStatus(undefined);
      setPriority(undefined);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <ScreenContainer padded={false}>
      <AppHeader
        title={resolvedIsQa ? 'Reportes QA e Incidencias' : 'Bandeja de Tickets de Soporte'}
        onBack={() => navigation.goBack()}
        right={<HeaderHomeButton />}
      />

      <View style={styles.body}>
        {/* Chips de Filtro Rápido Fijos Arriba */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickFilterContainer}
          contentContainerStyle={styles.quickFilterScroll}
        >
          <Pressable
            style={[styles.quickChip, quickFilter === 'ALL' && styles.quickChipActive]}
            onPress={() => handleQuickFilter('ALL')}
          >
            <Text style={[styles.quickChipText, quickFilter === 'ALL' && styles.quickChipTextActive]}>Todos</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, quickFilter === 'NEW' && styles.quickChipActiveNew]}
            onPress={() => handleQuickFilter('NEW')}
          >
            <Icon name="chatbubble-ellipses" size={13} color={quickFilter === 'NEW' ? colors.white : colors.brand} />
            <Text style={[styles.quickChipText, quickFilter === 'NEW' && styles.quickChipTextActive]}>🔥 Nuevos</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, quickFilter === 'CRITICAL' && styles.quickChipActiveCritical]}
            onPress={() => handleQuickFilter('CRITICAL')}
          >
            <Icon name="alert-circle" size={13} color={quickFilter === 'CRITICAL' ? colors.white : colors.danger} />
            <Text style={[styles.quickChipText, quickFilter === 'CRITICAL' && styles.quickChipTextActive]}>⚠️ SLA Crítico</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, quickFilter === 'IN_PROGRESS' && styles.quickChipActiveProgress]}
            onPress={() => handleQuickFilter('IN_PROGRESS')}
          >
            <Icon name="time" size={13} color={quickFilter === 'IN_PROGRESS' ? colors.white : colors.warning} />
            <Text style={[styles.quickChipText, quickFilter === 'IN_PROGRESS' && styles.quickChipTextActive]}>En proceso</Text>
          </Pressable>
        </ScrollView>

        {/* Buscador Integrado */}
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar ticket, cliente, folio o motivo..." />
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
            ListEmptyComponent={<EmptyState title="Sin tickets" description="No hay atenciones para los filtros aplicados." />}
            renderItem={({ item }) => {
              const isExpanded = expandedId === item.id;

              return (
                <Card style={styles.card}>
                  {/* Vista Resumida General (Plegada) */}
                  <Pressable style={styles.cardSummaryHeader} onPress={() => toggleExpand(item.id)}>
                    <View style={styles.summaryTopRow}>
                      <View style={styles.idBadge}>
                        <Text style={styles.idBadgeText}>#{item.externalId}</Text>
                      </View>
                      <View style={styles.badgesRow}>
                        <PriorityBadge priority={item.priority} />
                        <Badge label={STATUS_LABELS[item.status]} tone={STATUS_TONE[item.status]} />
                      </View>
                    </View>

                    <Text style={styles.reporterName}>{item.reporterName}</Text>
                    <Text style={styles.reasonText} numberOfLines={1}>{item.reason}</Text>

                    <View style={styles.summaryBottomRow}>
                      <View style={styles.metaWrap}>
                        <Icon name="time-outline" size={12} color={colors.textTertiary} />
                        <Text style={styles.metaText}>{formatDateTime(item.updatedAt)}</Text>
                      </View>
                      <View style={styles.expandToggleBtn}>
                        <Text style={styles.expandToggleText}>{isExpanded ? 'Ocultar ∧' : 'Ver Detalle ∨'}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {/* Contenido Desplegable al Presionar */}
                  {isExpanded ? (
                    <View style={styles.expandedContent}>
                      {/* Sección 1: Datos Completos del Registro */}
                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>📋 Información Detallada del Ticket</Text>
                        <View style={styles.infoGrid}>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Folio Ticket:</Text> #{item.externalId}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Solicitante / Cliente:</Text> {item.reporterName}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Categoría:</Text> {CATEGORY_LABELS[item.category]}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Prioridad Atencion:</Text> {item.priority}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Motivo Completo:</Text> {item.reason}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Asignado a:</Text> {(item as any).assignedTo || 'Equipo Soporte'}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Fecha de Registro:</Text> {formatDateTime(item.createdAt)}</Text>
                        </View>
                      </View>

                      {/* Sección 2: Acciones Directas */}
                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>⚡ Acción de Respuesta</Text>
                        <Button
                          label="💬 Atender y Responder Ticket →"
                          onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
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
  quickChipActiveNew: { backgroundColor: colors.brand, borderColor: colors.brand },
  quickChipActiveCritical: { backgroundColor: colors.danger, borderColor: colors.danger },
  quickChipActiveProgress: { backgroundColor: colors.warning, borderColor: colors.warning },
  quickChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  quickChipTextActive: { color: colors.white },
  searchWrap: { marginBottom: spacing.sm },
  listContent: { paddingBottom: spacing.huge },
  card: { padding: 0, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardSummaryHeader: { padding: spacing.md, backgroundColor: colors.surface },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  idBadge: { backgroundColor: toneColors.brand.bg, paddingHorizontal: spacing.sm, height: 22, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  idBadgeText: { fontSize: 11, fontWeight: '800', color: colors.brand },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  reporterName: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  reasonText: { fontSize: 12.5, color: colors.textSecondary, marginBottom: spacing.xs },
  summaryBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  metaWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: colors.textTertiary },
  expandToggleBtn: { backgroundColor: toneColors.brand.bg, paddingHorizontal: spacing.sm, height: 26, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  expandToggleText: { fontSize: 11.5, fontWeight: '700', color: colors.brand },
  expandedContent: { padding: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  sectionBox: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSoft, gap: spacing.xs },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xxs },
  infoGrid: { gap: 4 },
  infoText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  boldText: { fontWeight: '700', color: colors.textPrimary },
});
