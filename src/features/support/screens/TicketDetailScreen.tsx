import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as supportApi from '@/api/support';
import type { TicketMessage, TicketStatus } from '@/api/support';
import { useAuth } from '@/context/AuthContext';
import {
  Badge,
  FilePickerButton,
  FilePickerHandle,
  Icon,
  LoadingState,
  PriorityBadge,
  ScreenContainer,
  showToast,
} from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { HeaderHomeButton } from '@/components/layout/HeaderHomeButton';
import { colors, radii, spacing, toneColors, typography } from '@/theme';
import { formatDateTime } from '@/utils/formatters';
import { CATEGORY_LABELS, REPORTER_LABELS, STATUS_LABELS, STATUS_TONE } from '../utils/ticketLabels';

const QUICK_RESPONSES = [
  'Solicitud recibida. Estamos revisando tu caso.',
  'Verificamos tu información y el pago fue procesado correctamente.',
  'Derivado al equipo técnico con prioridad de revisión.',
  'Caso resuelto con éxito. Si necesitas algo más, escríbenos.',
];

export function TicketDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const ticketId: number = route.params?.ticketId;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const filePickerRef = useRef<FilePickerHandle>(null);
  const [draft, setDraft] = useState('');

  const { data: ticket, isLoading: loadingTicket } = useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: () => supportApi.getTicketById(ticketId),
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['support-ticket-messages', ticketId],
    queryFn: () => supportApi.getTicketMessages(ticketId),
    refetchInterval: 15_000,
  });

  const sendMutation = useMutation({
    mutationFn: (mensaje: string) =>
      supportApi.sendTicketMessage(ticketId, { autorTipo: 'SOPORTE', autorNombre: user?.fullName, mensaje }),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['support-ticket-messages', ticketId] });
    },
    onError: () => showToast('No se pudo enviar el mensaje', 'error'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => supportApi.updateTicketStatus(ticketId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      showToast('Estado del ticket actualizado', 'success');
    },
    onError: () => showToast('No se pudo actualizar el estado', 'error'),
  });

  const attachMutation = useMutation({
    mutationFn: async (file: Parameters<typeof supportApi.uploadDocument>[0]) => {
      const uploaded = await supportApi.uploadDocument(file, 'support-tickets');
      return supportApi.sendTicketMessage(ticketId, {
        autorTipo: 'SOPORTE',
        autorNombre: user?.fullName,
        mensaje: `Archivo adjunto: ${uploaded.filename ?? uploaded.url}`,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support-ticket-messages', ticketId] }),
    onError: () => showToast('No se pudo adjuntar el archivo', 'error'),
  });

  if (loadingTicket || !ticket) return <LoadingState />;

  return (
    <ScreenContainer padded={false} keyboardAvoiding>
      <AppHeader
        title={`#${ticket.externalId}`}
        onBack={() => navigation.goBack()}
        right={<HeaderHomeButton />}
      />

      {/* Selector Rápido de Estados */}
      <View style={styles.statusBarRow}>
        <Text style={styles.statusBarLabel}>Estado:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsScroll}>
          <Pressable
            style={[styles.statusChip, ticket.status === 'EN_PROCESO' && styles.statusChipActive]}
            onPress={() => statusMutation.mutate('EN_PROCESO')}
          >
            <Text style={[styles.statusChipText, ticket.status === 'EN_PROCESO' && styles.statusChipTextActive]}>
              ⚡ En proceso
            </Text>
          </Pressable>
          <Pressable
            style={[styles.statusChip, ticket.status === 'PENDIENTE_VENDEDOR' && styles.statusChipActiveWarning]}
            onPress={() => statusMutation.mutate('PENDIENTE_VENDEDOR')}
          >
            <Text style={[styles.statusChipText, ticket.status === 'PENDIENTE_VENDEDOR' && styles.statusChipTextActive]}>
              ⏳ Pendiente Vendedor
            </Text>
          </Pressable>
          <Pressable
            style={[styles.statusChip, ticket.status === 'RESUELTO' && styles.statusChipActiveSuccess]}
            onPress={() => statusMutation.mutate('RESUELTO')}
          >
            <Text style={[styles.statusChipText, ticket.status === 'RESUELTO' && styles.statusChipTextActive]}>
              ✅ Resolver
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Tarjeta Ordenada de Información del Ticket */}
      <View style={styles.ticketInfoCard}>
        <View style={styles.ticketInfoHeader}>
          <View style={styles.reporterPill}>
            <Icon name="person" size={13} color={colors.brand} />
            <Text style={styles.reporterPillText}>{REPORTER_LABELS[ticket.reporterType] || 'Usuario'}</Text>
          </View>
          <View style={styles.badgeWrap}>
            <PriorityBadge priority={ticket.priority} />
            <Badge label={STATUS_LABELS[ticket.status]} tone={STATUS_TONE[ticket.status]} />
          </View>
        </View>

        <Text style={styles.reporterName}>{ticket.reporterName}</Text>

        <View style={styles.reasonBox}>
          <Text style={styles.reasonTitle}>Motivo de la consulta:</Text>
          <Text style={styles.reasonBody}>{ticket.reason}</Text>
        </View>

        <View style={styles.infoMetaRow}>
          <Text style={styles.infoMetaText}>Categoría: {CATEGORY_LABELS[ticket.category]}</Text>
          <Text style={styles.infoMetaText}>Creado: {formatDateTime(ticket.createdAt)}</Text>
        </View>
      </View>

      {/* Chat / Historial de Mensajes */}
      {loadingMessages ? (
        <LoadingState />
      ) : (
        <FlatList
          style={styles.flex}
          data={[...(messages ?? [])].reverse()}
          keyExtractor={(item) => String(item.id)}
          inverted
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => <MessageBubble message={item} />}
        />
      )}

      {/* Píldoras de Respuesta Rápida en 1 Tap */}
      <View style={styles.quickResponsesWrap}>
        <Text style={styles.quickResponsesTitle}>Respuestas rápidas:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickResponsesScroll}>
          {QUICK_RESPONSES.map((res, i) => (
            <Pressable key={i} style={styles.quickResponsePill} onPress={() => setDraft(res)}>
              <Text style={styles.quickResponsePillText} numberOfLines={1}>
                ⚡ {res}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Composer de Respuesta */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.xs) + spacing.xs }]}>
          <Pressable style={styles.attachButton} onPress={() => filePickerRef.current?.open()}>
            <Icon name="attach-outline" size={20} color={colors.brand} />
          </Pressable>
          <View style={styles.composerInputWrap}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Escribe una respuesta al ticket..."
              placeholderTextColor={colors.textTertiary}
              style={styles.composerInput}
              multiline
            />
          </View>
          <Pressable
            style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
            disabled={!draft.trim() || sendMutation.isPending}
            onPress={() => sendMutation.mutate(draft.trim())}
          >
            <Icon name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <FilePickerButton
        ref={filePickerRef}
        label="Adjuntar al ticket"
        onPicked={(file) => attachMutation.mutate(file)}
      />
    </ScreenContainer>
  );
}

function MessageBubble({ message }: { message: TicketMessage }) {
  const isSupport = message.autorTipo === 'SOPORTE';
  return (
    <View style={[styles.bubbleRow, isSupport ? styles.bubbleRowSupport : styles.bubbleRowUser]}>
      <View style={[styles.bubble, isSupport ? styles.bubbleSupport : styles.bubbleUser]}>
        <Text style={[styles.bubbleAuthor, isSupport && styles.bubbleAuthorSupport]}>{message.autorNombre || (isSupport ? 'Soporte' : 'Usuario')}</Text>
        <Text style={[styles.bubbleText, isSupport && styles.bubbleTextSupport]}>{message.mensaje}</Text>
        <Text style={[styles.bubbleTime, isSupport && styles.bubbleTimeSupport]}>{formatDateTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    gap: spacing.sm,
  },
  statusBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusChipsScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statusChip: {
    paddingHorizontal: spacing.md,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipActive: {
    backgroundColor: colors.brand,
  },
  statusChipActiveWarning: {
    backgroundColor: colors.warning,
  },
  statusChipActiveSuccess: {
    backgroundColor: colors.success,
  },
  statusChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusChipTextActive: {
    color: colors.white,
  },
  ticketInfoCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  ticketInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  reporterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: toneColors.brand.bg,
    paddingHorizontal: spacing.sm,
    height: 22,
    borderRadius: radii.pill,
  },
  reporterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reporterName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  reasonBox: {
    backgroundColor: colors.bg,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  reasonTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  reasonBody: {
    fontSize: 12.5,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  infoMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xxs,
  },
  infoMetaText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  messagesList: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowSupport: { justifyContent: 'flex-end' },
  bubbleRowUser: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: radii.lg, padding: spacing.md },
  bubbleSupport: { backgroundColor: colors.brand, borderBottomRightRadius: radii.sm },
  bubbleUser: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, borderBottomLeftRadius: radii.sm },
  bubbleAuthor: { fontSize: 10.5, fontWeight: '700', color: colors.textSecondary, marginBottom: 2 },
  bubbleAuthorSupport: { color: 'rgba(255,255,255,0.85)' },
  bubbleText: { ...typography.body },
  bubbleTextSupport: { color: colors.white },
  bubbleTime: { fontSize: 10, marginTop: spacing.xxs, color: colors.textTertiary },
  bubbleTimeSupport: { color: 'rgba(255,255,255,0.75)' },
  quickResponsesWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  quickResponsesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  quickResponsesScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  quickResponsePill: {
    backgroundColor: toneColors.brand.bg,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 240,
  },
  quickResponsePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brand,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  attachButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
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
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.4 },
  flex: { flex: 1 },
});
