import React, { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as validationsApi from '@/api/validations';
import type { ValidationResponse } from '@/types/validation';
import {
  Badge,
  Button,
  Card,
  ConfirmActionSheet,
  ConfirmActionSheetHandle,
  EmptyState,
  Input,
  LoadingState,
  PaginationFooter,
  ScreenContainer,
  showToast,
} from '@/components/shared';
import { colors, spacing, typography } from '@/theme';
import { formatDate } from '@/utils/formatters';
import { VALIDATION_STATUS_LABELS, VALIDATION_STATUS_TONE } from '../utils/labels';

export function ValidationListScreen() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ValidationResponse | null>(null);
  const [notes, setNotes] = useState('');
  const confirmRef = useRef<ConfirmActionSheetHandle>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['validations', page],
    queryFn: () => validationsApi.getValidations(page, 15),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['validations'] });
    setSelected(null);
    setNotes('');
  };

  const approveMutation = useMutation({
    mutationFn: (id: number) => validationsApi.approveValidation(id),
    onSuccess: () => {
      showToast('Validación aprobada', 'success');
      invalidate();
    },
    onError: () => showToast('No se pudo aprobar', 'error'),
  });

  const correctionMutation = useMutation({
    mutationFn: () => validationsApi.requestCorrection(selected!.id, notes),
    onSuccess: () => {
      showToast('Corrección solicitada', 'success');
      invalidate();
    },
    onError: () => showToast('No se pudo solicitar la corrección', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => validationsApi.rejectValidation(selected!.id, notes),
    onSuccess: () => {
      showToast('Validación rechazada', 'success');
      invalidate();
    },
    onError: () => showToast('No se pudo rechazar', 'error'),
  });

  const confirmApprove = (item: ValidationResponse) => {
    confirmRef.current?.open({
      title: 'Aprobar validación',
      description: `${item.sellerName} · ${item.documentType}`,
      confirmLabel: 'Aprobar',
      onConfirm: () => approveMutation.mutateAsync(item.id).then(() => undefined),
    });
  };

  return (
    <ScreenContainer>
      {isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={data?.content ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title="Sin validaciones" description="No hay documentos pendientes de validación." />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={typography.subtitle}>{item.sellerName}</Text>
                <Badge label={VALIDATION_STATUS_LABELS[item.status]} tone={VALIDATION_STATUS_TONE[item.status]} />
              </View>
              <Text style={typography.bodySm}>{item.documentType}</Text>
              <Text style={typography.caption}>Vence {formatDate(item.dueAt)}</Text>

              {selected?.id === item.id ? (
                <View style={styles.actionsPanel}>
                  <Input placeholder="Notas (para corrección o rechazo)" value={notes} onChangeText={setNotes} multiline />
                  <View style={styles.actionsRow}>
                    <Button
                      label="Pedir corrección"
                      variant="secondary"
                      style={styles.actionButton}
                      loading={correctionMutation.isPending}
                      onPress={() => correctionMutation.mutate()}
                    />
                    <Button
                      label="Rechazar"
                      variant="danger"
                      style={styles.actionButton}
                      loading={rejectMutation.isPending}
                      onPress={() => rejectMutation.mutate()}
                    />
                  </View>
                  <Button label="Cancelar" variant="ghost" onPress={() => setSelected(null)} />
                </View>
              ) : (
                <View style={styles.actionsRow}>
                  <Button label="Aprobar" style={styles.actionButton} onPress={() => confirmApprove(item)} />
                  <Button label="Revisar" variant="secondary" style={styles.actionButton} onPress={() => setSelected(item)} />
                </View>
              )}
            </Card>
          )}
          ListFooterComponent={data ? <PaginationFooter page={page} totalPages={data.totalPages} onChange={setPage} /> : null}
        />
      )}
      <ConfirmActionSheet ref={confirmRef} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingTop: spacing.md, paddingBottom: spacing.huge },
  card: { gap: spacing.xs, marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionsPanel: { gap: spacing.sm, marginTop: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionButton: { flex: 1 },
});
