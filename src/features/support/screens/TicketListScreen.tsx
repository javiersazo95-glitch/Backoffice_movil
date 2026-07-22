import React, { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as supportApi from '@/api/support';
import type { TicketStatus, TicketPriority, TicketCategory } from '@/api/support';
import {
  Badge,
  EmptyState,
  ErrorState,
  FilterGroup,
  FilterSheet,
  FilterSheetHandle,
  Icon,
  ListItemCard,
  LoadingState,
  PaginationFooter,
  PriorityBadge,
  ScreenContainer,
  SearchBar,
} from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { colors, spacing } from '@/theme';
import { formatDateTime } from '@/utils/formatters';
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_TONE, SUPPORT_STATUS_OPTIONS } from '../utils/ticketLabels';

interface TicketListScreenProps {
  isQa?: boolean;
}

const PRIORITY_OPTIONS: TicketPriority[] = ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'];
const CATEGORY_OPTIONS: TicketCategory[] = ['FALLA_TECNICA', 'SOLICITUD_AYUDA', 'CONSULTA'];

export function TicketListScreen({ isQa = false }: TicketListScreenProps) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const resolvedIsQa = isQa || (route.name === 'QaReports');
  const filterSheetRef = useRef<FilterSheetHandle>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TicketStatus | undefined>(undefined);
  const [priority, setPriority] = useState<TicketPriority | undefined>(undefined);
  const [category, setCategory] = useState<TicketCategory | undefined>(undefined);
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['support-tickets', resolvedIsQa, search, status, priority, category, page],
    queryFn: () =>
      resolvedIsQa
        ? supportApi.getQaReports({ search: search || undefined, status, priority, page, size: 15 })
        : supportApi.getTickets({ search: search || undefined, status, priority, category, page, size: 15 }),
  });

  const groups: FilterGroup[] = [
    {
      key: 'status',
      label: 'Estado',
      value: status,
      options: SUPPORT_STATUS_OPTIONS.map((value) => ({ value, label: STATUS_LABELS[value] })),
      onChange: (value) => setStatus(value as TicketStatus | undefined),
    },
    {
      key: 'priority',
      label: 'Prioridad',
      value: priority,
      options: PRIORITY_OPTIONS.map((value) => ({ value, label: value })),
      onChange: (value) => setPriority(value as TicketPriority | undefined),
    },
    ...(resolvedIsQa
      ? []
      : [
          {
            key: 'category',
            label: 'Categoría',
            value: category,
            options: CATEGORY_OPTIONS.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
            onChange: (value: string | undefined) => setCategory(value as TicketCategory | undefined),
          },
        ]),
  ];

  return (
    <ScreenContainer padded={false}>
      <AppHeader title={resolvedIsQa ? 'Reportes QA' : 'Tickets de soporte'} onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <SearchBar
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                setPage(0);
              }}
              placeholder="Buscar por motivo, vendedor…"
            />
          </View>
          <Pressable style={styles.filterButton} onPress={() => filterSheetRef.current?.open()}>
            <Icon name="options-outline" size={20} color={colors.brand} />
          </Pressable>
        </View>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={data?.content ?? []}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={<EmptyState title="Sin tickets" description="No hay tickets para los filtros seleccionados." />}
            renderItem={({ item }) => (
              <ListItemCard
                title={`#${item.externalId} · ${item.reporterName}`}
                subtitle={item.reason}
                meta={formatDateTime(item.updatedAt)}
                rightBadge={
                  <View style={styles.badgeColumn}>
                    <StatusBadgeWithLabel status={item.status} />
                    <PriorityBadge priority={item.priority} />
                  </View>
                }
                onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
              />
            )}
            ListFooterComponent={data ? <PaginationFooter page={page} totalPages={data.totalPages} onChange={setPage} /> : null}
          />
        )}
      </View>

      <FilterSheet
        ref={filterSheetRef}
        groups={groups}
        onApply={() => setPage(0)}
        onClear={() => {
          setStatus(undefined);
          setPriority(undefined);
          setCategory(undefined);
          setPage(0);
        }}
      />
    </ScreenContainer>
  );
}

function StatusBadgeWithLabel({ status }: { status: TicketStatus }) {
  return <Badge label={STATUS_LABELS[status]} tone={STATUS_TONE[status]} />;
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchInput: { flex: 1 },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  badgeColumn: { gap: spacing.xs, alignItems: 'flex-end' },
});
