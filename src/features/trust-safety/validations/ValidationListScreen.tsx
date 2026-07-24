import React, { useRef, useState } from 'react';
import { FlatList, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as validationsApi from '@/api/validations';
import { downloadAndShareFile } from '@/api/uploads';
import { ValidationStatus } from '@/types/validation';
import {
  Badge,
  Button,
  Card,
  ConfirmActionSheet,
  ConfirmActionSheetHandle,
  EmptyState,
  Icon,
  Input,
  LoadingState,
  MetricCard,
  ScreenContainer,
  showToast,
} from '@/components/shared';
import { colors, radii, spacing, toneColors } from '@/theme';
import { formatDateTime } from '@/utils/formatters';
import { VALIDATION_STATUS_LABELS, VALIDATION_STATUS_TONE } from '../utils/labels';

type QuickStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface DocumentTarget {
  name: string;
  store: string;
  url?: string;
}

export function ValidationListScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<QuickStatusFilter>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [notesMap, setNotesMap] = useState<Record<number, string>>({});
  const confirmRef = useRef<ConfirmActionSheetHandle>(null);

  const { data: storeValidations, isLoading } = useQuery({
    queryKey: ['store-validations'],
    queryFn: () => validationsApi.getStoreValidations(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['store-validations'] });
    queryClient.invalidateQueries({ queryKey: ['validations'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: number) => validationsApi.approveValidation(id),
    onSuccess: () => {
      showToast('Tienda aprobada exitosamente', 'success');
      invalidate();
    },
    onError: () => showToast('No se pudo aprobar la tienda', 'error'),
  });

  const correctionMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => validationsApi.requestCorrection(id, notes),
    onSuccess: () => {
      showToast('Corrección solicitada al vendedor', 'success');
      invalidate();
    },
    onError: () => showToast('No se pudo solicitar la corrección', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => validationsApi.rejectValidation(id, notes),
    onSuccess: () => {
      showToast('Solicitud de tienda rechazada', 'success');
      invalidate();
    },
    onError: () => showToast('No se pudo rechazar', 'error'),
  });

  const items = [...(storeValidations ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const filteredItems = items.filter((item) => {
    if (statusFilter === 'PENDING') return item.status === ValidationStatus.PENDIENTE;
    if (statusFilter === 'APPROVED') return item.status === ValidationStatus.APROBADA;
    if (statusFilter === 'REJECTED') return item.status === ValidationStatus.RECHAZADA || item.status === ValidationStatus.POR_CORREGIR;
    return true;
  });

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleOpenDocument = async (doc: DocumentTarget) => {
    if (!doc.url) {
      showToast('El vendedor no ha cargado el archivo de este documento aún', 'error');
      return;
    }

    try {
      if (doc.url.startsWith('http')) {
        await Linking.openURL(doc.url);
      } else {
        const cleanName = `${doc.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        await downloadAndShareFile(doc.url, cleanName);
      }
    } catch {
      showToast('No se pudo abrir el archivo del documento', 'error');
    }
  };

  const pendingCount = items.filter((i) => i.status === ValidationStatus.PENDIENTE).length;
  const approvedCount = items.filter((i) => i.status === ValidationStatus.APROBADA).length;
  const rejectedCount = items.filter((i) => i.status === ValidationStatus.RECHAZADA || i.status === ValidationStatus.POR_CORREGIR).length;

  return (
    <ScreenContainer edges={['bottom', 'left', 'right']} padded={false}>
      <View style={styles.body}>
        <View style={styles.metricsRow}>
          <MetricCard label="Pendientes" value={pendingCount} icon="time-outline" tone="warning" />
          <MetricCard label="Aprobadas" value={approvedCount} icon="checkmark-circle-outline" tone="success" />
          <MetricCard label="Rechazadas" value={rejectedCount} icon="alert-circle-outline" tone="danger" />
        </View>
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
            style={[styles.quickChip, statusFilter === 'PENDING' && styles.quickChipActivePending]}
            onPress={() => setStatusFilter('PENDING')}
          >
            <Icon name="time" size={13} color={statusFilter === 'PENDING' ? colors.white : colors.warning} />
            <Text style={[styles.quickChipText, statusFilter === 'PENDING' && styles.quickChipTextActive]}>⏳ Pendientes</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, statusFilter === 'APPROVED' && styles.quickChipActiveApproved]}
            onPress={() => setStatusFilter('APPROVED')}
          >
            <Icon name="checkmark-circle" size={13} color={statusFilter === 'APPROVED' ? colors.white : colors.success} />
            <Text style={[styles.quickChipText, statusFilter === 'APPROVED' && styles.quickChipTextActive]}>✅ Aprobados</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, statusFilter === 'REJECTED' && styles.quickChipActiveRejected]}
            onPress={() => setStatusFilter('REJECTED')}
          >
            <Icon name="alert-circle" size={13} color={statusFilter === 'REJECTED' ? colors.white : colors.danger} />
            <Text style={[styles.quickChipText, statusFilter === 'REJECTED' && styles.quickChipTextActive]}>❌ Rechazados</Text>
          </Pressable>
        </ScrollView>

        <Text style={styles.fifoNoticeText}>
          📋 Mostrando solicitudes más antiguas primero (Prioridad de atención FIFO).
        </Text>

        {isLoading ? (
          <LoadingState />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={filteredItems}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState title="Sin validaciones" description="No hay solicitudes para el filtro seleccionado." />}
            renderItem={({ item }) => {
              const isExpanded = expandedId === item.id;
              const notes = notesMap[item.id] ?? '';

              return (
                <Card style={styles.card}>
                  <Pressable style={styles.cardSummaryHeader} onPress={() => toggleExpand(item.id)}>
                    <View style={styles.summaryTopRow}>
                      <View style={styles.storeNameWrap}>
                        <Text style={styles.storeName}>{item.sellerName}</Text>
                        <Text style={styles.docCountText}>{item.documents.length} documentos presentados</Text>
                      </View>
                      <Badge label={VALIDATION_STATUS_LABELS[item.status]} tone={VALIDATION_STATUS_TONE[item.status]} />
                    </View>
                    <View style={styles.summaryBottomRow}>
                      <View style={styles.dateWrap}>
                        <Icon name="calendar-outline" size={12} color={colors.textTertiary} />
                        <Text style={styles.dateText}>Solicitado: {formatDateTime(item.createdAt)}</Text>
                      </View>
                      <View style={styles.expandToggleBtn}>
                        <Text style={styles.expandToggleText}>{isExpanded ? 'Ocultar ∧' : 'Ver Solicitud ∨'}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {isExpanded ? (
                    <View style={styles.expandedContent}>
                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>👤 Datos del Solicitante</Text>
                        <View style={styles.infoGrid}>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Representante:</Text> {item.representativeName}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>RUT:</Text> {item.rut}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Contacto:</Text> {item.email} · {item.phone}</Text>
                          <Text style={styles.infoText}><Text style={styles.boldText}>Ubicación:</Text> {item.regionCity}</Text>
                        </View>
                      </View>

                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>📁 Documentos Adjuntos para Revisión</Text>
                        {item.documents.map((doc) => (
                          <View key={doc.id} style={styles.docRow}>
                            <View style={styles.docInfo}>
                              <Icon name="document-text" size={16} color={colors.brand} />
                              <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                            </View>
                            <Pressable
                              style={styles.reviewDocBtn}
                              onPress={() => void handleOpenDocument({ name: doc.name, store: item.sellerName, url: doc.url })}
                            >
                              <Icon name="eye" size={13} color={colors.brand} />
                              <Text style={styles.reviewDocBtnText}>Revisar</Text>
                            </Pressable>
                          </View>
                        ))}
                      </View>

                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>✍️ Observaciones y Evaluación</Text>
                        <Input
                          placeholder="Escribe notas si solicitas corrección o rechazas..."
                          value={notes}
                          onChangeText={(text) => setNotesMap((prev) => ({ ...prev, [item.id]: text }))}
                          multiline
                        />
                        <View style={styles.actionsGroup}>
                          <Button
                            label="Aprobar Tienda"
                            style={styles.approveBtn}
                            loading={approveMutation.isPending}
                            onPress={() =>
                              confirmRef.current?.open({
                                title: 'Aprobar Solicitud de Tienda',
                                description: `¿Deseas aprobar la solicitud de ${item.sellerName}?`,
                                confirmLabel: 'Aprobar',
                                onConfirm: () => approveMutation.mutateAsync(item.id).then(() => undefined),
                              })
                            }
                          />
                          <View style={styles.secondaryActionsRow}>
                            <Button
                              label="Pedir corrección"
                              variant="secondary"
                              style={styles.actionBtnHalf}
                              loading={correctionMutation.isPending}
                              onPress={() => correctionMutation.mutate({ id: item.id, notes })}
                            />
                            <Button
                              label="Rechazar"
                              variant="danger"
                              style={styles.actionBtnHalf}
                              loading={rejectMutation.isPending}
                              onPress={() => rejectMutation.mutate({ id: item.id, notes })}
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : null}
                </Card>
              );
            }}
          />
        )}
      </View>

      <ConfirmActionSheet ref={confirmRef} />
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
  quickChipActivePending: { backgroundColor: colors.warning, borderColor: colors.warning },
  quickChipActiveApproved: { backgroundColor: colors.success, borderColor: colors.success },
  quickChipActiveRejected: { backgroundColor: colors.danger, borderColor: colors.danger },
  quickChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  quickChipTextActive: { color: colors.white },
  fifoNoticeText: { fontSize: 11, color: colors.textTertiary, marginBottom: spacing.sm, marginTop: spacing.xxs },
  listContent: { paddingBottom: spacing.huge },
  card: { padding: 0, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardSummaryHeader: { padding: spacing.md, backgroundColor: colors.surface },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  storeNameWrap: { flex: 1, paddingRight: spacing.sm },
  storeName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  docCountText: { fontSize: 12, color: colors.brand, fontWeight: '600', marginTop: 1 },
  summaryBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  dateWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: colors.textTertiary },
  expandToggleBtn: { backgroundColor: toneColors.brand.bg, paddingHorizontal: spacing.sm, height: 26, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  expandToggleText: { fontSize: 11.5, fontWeight: '700', color: colors.brand },
  expandedContent: { padding: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  sectionBox: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSoft, gap: spacing.xs },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xxs },
  infoGrid: { gap: 4 },
  infoText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  boldText: { fontWeight: '700', color: colors.textPrimary },
  docRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    backgroundColor: colors.bg, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.borderSoft, marginBottom: spacing.xxs,
  },
  docInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1, paddingRight: spacing.xs },
  docName: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  reviewDocBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: toneColors.brand.bg, borderWidth: 1,
    borderColor: colors.brand, paddingHorizontal: spacing.sm, height: 26, borderRadius: radii.pill,
  },
  reviewDocBtnText: { fontSize: 11, fontWeight: '700', color: colors.brand },
  actionsGroup: { gap: spacing.sm, marginTop: spacing.xs },
  approveBtn: { backgroundColor: colors.success },
  secondaryActionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtnHalf: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalContainer: { width: '100%', backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, flex: 1 },
  modalStoreSub: { fontSize: 12, color: colors.textSecondary },
  previewBox: { backgroundColor: colors.bg, borderRadius: radii.md, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  previewBoxTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs },
  previewBoxSub: { fontSize: 11.5, color: colors.textSecondary, textAlign: 'center', lineHeight: 16 },
  validBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: toneColors.success.bg,
    paddingHorizontal: spacing.sm, height: 24, borderRadius: radii.pill, marginTop: spacing.xs,
  },
  validBadgeText: { fontSize: 11, fontWeight: '700', color: colors.success },
});
