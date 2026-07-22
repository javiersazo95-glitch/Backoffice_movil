import React, { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as permissionsApi from '@/api/permissions';
import type { BackofficeArea, BackofficePermissionSlot } from '@/types/auth';
import {
  Badge,
  Card,
  EmptyState,
  FilterGroup,
  FilterSheet,
  FilterSheetHandle,
  Icon,
  LoadingState,
  PaginationFooter,
  SearchBar,
  showToast,
} from '@/components/shared';
import { colors, spacing, typography } from '@/theme';

const AREA_LABELS: Record<BackofficeArea, string> = {
  ADMINISTRACION_CONTABLE: 'Administración Contable',
  SOPORTE: 'Soporte',
  MEDIACION_CONFIANZA: 'Confianza y Mediación',
};

const SLOT_LABELS: Record<BackofficePermissionSlot, string> = {
  OPERADOR: 'Operador',
  QA: 'QA',
};

export function UsersListView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [area, setArea] = useState<BackofficeArea | 'All'>('All');
  const [slot, setSlot] = useState<BackofficePermissionSlot | 'All'>('All');
  const [page, setPage] = useState(0);
  const filterSheetRef = useRef<FilterSheetHandle>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['permission-users', search, area, slot, page],
    queryFn: () => permissionsApi.listPermissionUsers({ search: search || undefined, area, slot, page, size: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ userId, permissionId }: { userId: number; permissionId: number }) =>
      permissionsApi.deleteUserPermission(userId, permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-users'] });
      showToast('Permiso eliminado', 'success');
    },
    onError: () => showToast('No se pudo eliminar el permiso', 'error'),
  });

  const groups: FilterGroup[] = [
    {
      key: 'area',
      label: 'Área',
      value: area === 'All' ? undefined : area,
      options: Object.entries(AREA_LABELS).map(([value, label]) => ({ value, label })),
      onChange: (value) => setArea((value as BackofficeArea) ?? 'All'),
    },
    {
      key: 'slot',
      label: 'Ranura',
      value: slot === 'All' ? undefined : slot,
      options: Object.entries(SLOT_LABELS).map(([value, label]) => ({ value, label })),
      onChange: (value) => setSlot((value as BackofficePermissionSlot) ?? 'All'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <SearchBar
            value={search}
            onChangeText={(value) => {
              setSearch(value);
              setPage(0);
            }}
            placeholder="Correo o nombre…"
          />
        </View>
        <Pressable style={styles.filterButton} onPress={() => filterSheetRef.current?.open()}>
          <Icon name="options-outline" size={20} color={colors.brand} />
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={data?.content ?? []}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<EmptyState title="Sin usuarios" description="No hay usuarios para los filtros seleccionados." />}
          renderItem={({ item }) => (
            <Card style={styles.userCard}>
              <Text style={typography.subtitle}>{item.email}</Text>
              <Text style={typography.bodySm}>{item.fullName}</Text>
              <View style={styles.chips}>
                {item.permissions.length === 0 ? (
                  <Text style={typography.caption}>Sin permisos</Text>
                ) : (
                  item.permissions.map((permission) => (
                    <View key={permission.id ?? `${permission.area}-${permission.slot}`} style={styles.chip}>
                      <Badge label={`${AREA_LABELS[permission.area]} · ${SLOT_LABELS[permission.slot]}`} tone={permission.slot === 'QA' ? 'danger' : 'brand'} />
                      {typeof permission.id === 'number' ? (
                        <Pressable
                          hitSlop={8}
                          onPress={() => deleteMutation.mutate({ userId: item.id, permissionId: permission.id! })}
                          style={styles.chipRemove}
                        >
                          <Icon name="close-circle" size={16} color={colors.danger} />
                        </Pressable>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            </Card>
          )}
          ListFooterComponent={
            data ? <PaginationFooter page={page} totalPages={data.totalPages} onChange={setPage} /> : null
          }
        />
      )}

      <FilterSheet
        ref={filterSheetRef}
        groups={groups}
        onApply={(selected) => {
          setArea((selected.area as BackofficeArea) ?? 'All');
          setSlot((selected.slot as BackofficePermissionSlot) ?? 'All');
          setPage(0);
        }}
        onClear={() => {
          setArea('All');
          setSlot('All');
          setPage(0);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  userCard: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  chipRemove: { padding: spacing.xxs },
});
