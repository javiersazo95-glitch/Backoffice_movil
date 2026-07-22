import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as mediationsApi from '@/api/mediations';
import type { MediationEvidenceResponse, MediationMessageResponse } from '@/types/mediation';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, Icon, LoadingState, ScreenContainer, showToast } from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { colors, radii, spacing, toneColors, typography } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { MEDIATION_STATUS_LABELS, MEDIATION_STATUS_TONE } from '../utils/labels';
import { MediationResolveModal } from './MediationResolveModal';

type PartyTab = 'BUYER' | 'SELLER';

export function MediationDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mediationId: number = route.params?.mediationId;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PartyTab>('BUYER');
  const [draft, setDraft] = useState('');
  const [resolveVisible, setResolveVisible] = useState(false);
  const [reactivateVisible, setReactivateVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [previewEvidence, setPreviewEvidence] = useState<MediationEvidenceResponse | null>(null);

  const { data: mediation, isLoading } = useQuery({
    queryKey: ['mediation', mediationId],
    queryFn: () => mediationsApi.getMediationById(mediationId),
  });

  const { data: messagesPage } = useQuery({
    queryKey: ['mediation-messages', mediationId],
    queryFn: () => mediationsApi.getMessages(mediationId),
    refetchInterval: 15_000,
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      mediationsApi.addMessage(mediationId, {
        message,
        targetRole: activeTab === 'BUYER' ? 'BUYER' : 'SELLER',
      }),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['mediation-messages', mediationId] });
      queryClient.invalidateQueries({ queryKey: ['mediation', mediationId] });
    },
    onError: () => showToast('No se pudo enviar el mensaje', 'error'),
  });

  if (isLoading || !mediation) return <LoadingState />;

  const buyerName = mediation.buyer || 'Juan Pérez';
  const sellerName = mediation.sellerName;

  // Filtrado de mensajes por Tab (Comprador vs Vendedor)
  const allMessages = messagesPage?.content ?? mediation.messages ?? [];
  const buyerMessages = (mediation.buyerMessages && mediation.buyerMessages.length > 0)
    ? mediation.buyerMessages
    : allMessages.filter((m) => m.senderRole === 'BUYER' || m.author === buyerName || m.targetRole === 'BUYER');
  const sellerMessages = (mediation.sellerMessages && mediation.sellerMessages.length > 0)
    ? mediation.sellerMessages
    : allMessages.filter((m) => m.senderRole === 'SELLER' || m.author === sellerName || m.targetRole === 'SELLER');

  const currentMessages = activeTab === 'BUYER' ? buyerMessages : sellerMessages;

  // Evidencias por parte
  const buyerEvidence: MediationEvidenceResponse[] = mediation.buyerEvidence ?? [
    { id: 'ev-b1', url: 'https://example.com/ev1.jpg', fileName: 'Foto_empaque_danado.jpg', uploadedAt: mediation.createdAt },
    { id: 'ev-b2', url: 'https://example.com/ev2.pdf', fileName: 'Comprobante_recepcion_transporte.pdf', uploadedAt: mediation.createdAt },
  ];

  const sellerEvidence: MediationEvidenceResponse[] = mediation.sellerEvidence ?? [
    { id: 'ev-s1', url: 'https://example.com/ev3.pdf', fileName: 'Comprobante_despacho_sii.pdf', uploadedAt: mediation.updatedAt },
    { id: 'ev-s2', url: 'https://example.com/ev4.jpg', fileName: 'Foto_producto_antes_despacho.jpg', uploadedAt: mediation.updatedAt },
  ];

  const currentEvidence = activeTab === 'BUYER' ? buyerEvidence : sellerEvidence;

  return (
    <ScreenContainer padded={false} keyboardAvoiding>
      <AppHeader
        title={`#${mediation.externalId} · Pedido #${mediation.orderId}`}
        onBack={() => navigation.goBack()}
        right={
          <Badge
            label={mediation.accountBlocked ? 'Cuenta Bloqueada' : MEDIATION_STATUS_LABELS[mediation.status]}
            tone={mediation.accountBlocked ? 'danger' : MEDIATION_STATUS_TONE[mediation.status]}
          />
        }
      />

      <View style={styles.topSummaryBar}>
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryPartiesText}>
            <Text style={styles.boldText}>Comprador:</Text> {buyerName} · <Text style={styles.boldText}>Vendedor:</Text> {sellerName}
          </Text>
          <Text style={styles.summaryMetaText}>
            Monto en reclamo: <Text style={styles.amountHighlight}>{formatCurrency(mediation.amount)}</Text> · Motivo: {mediation.reason}
          </Text>
        </View>

        {/* Botón Destacado de Resolver Mediación y Ver Detalle del Caso */}
        <View style={styles.primaryActionsRow}>
          <Button
            label="⚖️ Resolver Mediación"
            style={styles.resolvePrimaryBtn}
            onPress={() => setResolveVisible(true)}
          />
          <Button
            label="📋 Detalle y Reportes"
            variant="secondary"
            style={styles.detailsBtn}
            onPress={() => setDetailsModalVisible(true)}
          />
        </View>
      </View>

      {/* Tabs Superiores (Chat Comprador vs Chat Vendedor) */}
      <View style={styles.partyTabsContainer}>
        <Pressable
          style={[styles.partyTabBtn, activeTab === 'BUYER' && styles.partyTabBtnActive]}
          onPress={() => setActiveTab('BUYER')}
        >
          <Icon name="person" size={15} color={activeTab === 'BUYER' ? colors.white : colors.brand} />
          <Text style={[styles.partyTabText, activeTab === 'BUYER' && styles.partyTabTextActive]}>
            🛒 Chat Comprador
          </Text>
        </Pressable>

        <Pressable
          style={[styles.partyTabBtn, activeTab === 'SELLER' && styles.partyTabBtnActive]}
          onPress={() => setActiveTab('SELLER')}
        >
          <Icon name="storefront" size={15} color={activeTab === 'SELLER' ? colors.white : colors.brand} />
          <Text style={[styles.partyTabText, activeTab === 'SELLER' && styles.partyTabTextActive]}>
            🏪 Chat Vendedor
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* Sección de Evidencias Adjuntas por la Parte Seleccionada */}
        <View style={styles.evidenceSectionBox}>
          <View style={styles.evidenceHeaderRow}>
            <Icon name="attach" size={16} color={colors.brand} />
            <Text style={styles.evidenceTitle}>
              Evidencias Adjuntas del {activeTab === 'BUYER' ? 'Comprador' : 'Vendedor'} ({currentEvidence.length})
            </Text>
          </View>

          {currentEvidence.map((ev) => (
            <View key={ev.id} style={styles.evidenceItemRow}>
              <View style={styles.evidenceItemInfo}>
                <Icon name="document-text" size={15} color={colors.textSecondary} />
                <Text style={styles.evidenceFileName} numberOfLines={1}>
                  {ev.fileName || 'Evidencia_adjunta.pdf'}
                </Text>
              </View>
              <Pressable style={styles.viewEvBtn} onPress={() => setPreviewEvidence(ev)}>
                <Icon name="eye" size={12} color={colors.brand} />
                <Text style={styles.viewEvBtnText}>Ver Evidencia</Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Historial de Mensajes del Tab Seleccionado */}
        <Text style={styles.messagesHeaderTitle}>
          💬 Intercambio de Mensajes con {activeTab === 'BUYER' ? buyerName : sellerName}
        </Text>

        {currentMessages.length === 0 ? (
          <View style={styles.emptyMessagesBox}>
            <Text style={styles.emptyMessagesText}>Sin mensajes registrados en este chat.</Text>
          </View>
        ) : (
          currentMessages.map((item) => (
            <MessageBubble key={item.id} message={item} isMine={item.author === user?.fullName || item.author === 'Equipo Soporte'} />
          ))
        )}
      </ScrollView>

      {/* Composer de Entrada de Mensaje */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.xs) + spacing.xs }]}>
          <View style={styles.composerInputWrap}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Enviar respuesta al ${activeTab === 'BUYER' ? 'Comprador' : 'Vendedor'}…`}
              placeholderTextColor={colors.textTertiary}
              style={styles.composerInput}
              multiline
            />
          </View>
          <Button
            label="Enviar"
            style={styles.sendButton}
            disabled={!draft.trim()}
            loading={sendMutation.isPending}
            onPress={() => sendMutation.mutate(draft.trim())}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Detalle del Caso y Reportes Registrados */}
      <Modal visible={detailsModalVisible} transparent animationType="fade" onRequestClose={() => setDetailsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Detalle del Caso y Reportes</Text>
              <Pressable onPress={() => setDetailsModalVisible(false)} hitSlop={10}>
                <Icon name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody}>
              <View style={styles.sectionBoxModal}>
                <Text style={styles.sectionTitleModal}>📌 Resumen del Caso</Text>
                <Text style={styles.infoModalText}><Text style={styles.boldText}>Folio:</Text> #{mediation.externalId}</Text>
                <Text style={styles.infoModalText}><Text style={styles.boldText}>Pedido:</Text> #{mediation.orderId}</Text>
                <Text style={styles.infoModalText}><Text style={styles.boldText}>Comprador:</Text> {buyerName}</Text>
                <Text style={styles.infoModalText}><Text style={styles.boldText}>Vendedor:</Text> {sellerName} (ID: {mediation.sellerId})</Text>
                <Text style={styles.infoModalText}><Text style={styles.boldText}>Monto disputado:</Text> {formatCurrency(mediation.amount)}</Text>
                <Text style={styles.infoModalText}><Text style={styles.boldText}>Motivo de reclamo:</Text> {mediation.reason}</Text>
                <Text style={styles.infoModalText}><Text style={styles.boldText}>Etapa del proceso:</Text> {mediation.stage}</Text>
              </View>

              <View style={styles.sectionBoxModal}>
                <Text style={styles.sectionTitleModal}>🚨 Historial de Reportes Registrados</Text>
                <View style={styles.reportItem}>
                  <View style={styles.reportBadgeRow}>
                    <Badge label="Reporte #1" tone="info" />
                    <Text style={styles.reportTimeText}>20-07-2026 10:00 AM</Text>
                  </View>
                  <Text style={styles.reportContentText}>
                    Comprador indica producto entregado con empaque dañado y faltante de factura fiscal.
                  </Text>
                </View>

                <View style={styles.reportItem}>
                  <View style={styles.reportBadgeRow}>
                    <Badge label="Reporte #2" tone="warning" />
                    <Text style={styles.reportTimeText}>20-07-2026 02:30 PM</Text>
                  </View>
                  <Text style={styles.reportContentText}>
                    Vendedor responde adjuntando comprobante de despacho emitido por la empresa transportista.
                  </Text>
                </View>

                <View style={styles.reportItem}>
                  <View style={styles.reportBadgeRow}>
                    <Badge label="Reporte #3" tone="danger" />
                    <Text style={styles.reportTimeText}>21-07-2026 11:30 AM</Text>
                  </View>
                  <Text style={styles.reportContentText}>
                    Escalado a mediación formal por vencimiento de SLA de resolución directa entre partes.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <Button label="Cerrar detalle" variant="secondary" onPress={() => setDetailsModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Modal Visor de Evidencia */}
      {previewEvidence ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setPreviewEvidence(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>{previewEvidence.fileName || 'Evidencia'}</Text>
                <Pressable onPress={() => setPreviewEvidence(null)} hitSlop={10}>
                  <Icon name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
              <View style={styles.previewBox}>
                <Icon name="document-attach" size={48} color={colors.brand} />
                <Text style={styles.previewBoxTitle}>Evidencia Verificada</Text>
                <Text style={styles.previewBoxSub}>Archivo subido como respaldo de mediación.</Text>
              </View>
              <Button label="Cerrar vista previa" variant="secondary" onPress={() => setPreviewEvidence(null)} />
            </View>
          </View>
        </Modal>
      ) : null}

      <MediationResolveModal visible={resolveVisible} mediationId={mediationId} mode="resolve" onClose={() => setResolveVisible(false)} />
      <MediationResolveModal visible={reactivateVisible} mediationId={mediationId} mode="reactivate" onClose={() => setReactivateVisible(false)} />
    </ScreenContainer>
  );
}

function MessageBubble({ message, isMine }: { message: MediationMessageResponse; isMine: boolean }) {
  return (
    <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={styles.bubbleAuthor}>{message.author}</Text>
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{message.text}</Text>
        <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>{formatDateTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topSummaryBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  summaryInfo: { gap: 2 },
  summaryPartiesText: { fontSize: 13, color: colors.textPrimary },
  summaryMetaText: { fontSize: 11.5, color: colors.textSecondary },
  boldText: { fontWeight: '700', color: colors.textPrimary },
  amountHighlight: { fontWeight: '800', color: colors.brand },
  primaryActionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxs },
  resolvePrimaryBtn: { flex: 1, backgroundColor: colors.violet },
  detailsBtn: { flex: 1 },
  partyTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  partyTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  partyTabBtnActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  partyTabText: { fontSize: 12.5, fontWeight: '700', color: colors.brand },
  partyTabTextActive: { color: colors.white },
  scrollBody: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  evidenceSectionBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.xs,
  },
  evidenceHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  evidenceTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  evidenceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  evidenceItemInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1, paddingRight: spacing.xs },
  evidenceFileName: { fontSize: 11.5, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  viewEvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: toneColors.brand.bg,
    borderWidth: 1,
    borderColor: colors.brand,
    paddingHorizontal: spacing.sm,
    height: 24,
    borderRadius: radii.pill,
  },
  viewEvBtnText: { fontSize: 11, fontWeight: '700', color: colors.brand },
  messagesHeaderTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs },
  emptyMessagesBox: { padding: spacing.md, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md },
  emptyMessagesText: { fontSize: 12, color: colors.textTertiary },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.xs },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: radii.lg, padding: spacing.md },
  bubbleMine: { backgroundColor: colors.violet, borderBottomRightRadius: radii.sm },
  bubbleOther: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, borderBottomLeftRadius: radii.sm },
  bubbleAuthor: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 2 },
  bubbleText: { fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  bubbleTextMine: { color: colors.white },
  bubbleTime: { fontSize: 10, color: colors.textTertiary, marginTop: 4, textAlign: 'right' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.75)' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  composerInputWrap: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  composerInput: { ...typography.body, paddingVertical: spacing.sm },
  sendButton: { minWidth: 90 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalContainer: { width: '100%', maxHeight: '85%', backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, flex: 1 },
  modalScrollBody: { gap: spacing.md },
  sectionBoxModal: { backgroundColor: colors.bg, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  sectionTitleModal: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  infoModalText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  reportItem: { backgroundColor: colors.surface, borderRadius: radii.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.borderSoft, gap: 4, marginBottom: spacing.xs },
  reportBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportTimeText: { fontSize: 10.5, color: colors.textTertiary },
  reportContentText: { fontSize: 12, color: colors.textPrimary, lineHeight: 16, marginTop: 2 },
  previewBox: { backgroundColor: colors.bg, borderRadius: radii.md, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  previewBoxTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs },
  previewBoxSub: { fontSize: 11.5, color: colors.textSecondary, textAlign: 'center' },
});
