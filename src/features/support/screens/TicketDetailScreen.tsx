import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as supportApi from '@/api/support';
import type { TicketMessage, TicketStatus } from '@/api/support';
import { useAuth } from '@/context/AuthContext';
import {
  Badge,
  Card,
  FilePickerButton,
  FilePickerHandle,
  Icon,
  LoadingState,
  ScreenContainer,
  SegmentedTabs,
  showToast,
} from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { colors, radii, spacing, typography } from '@/theme';
import { formatDateTime } from '@/utils/formatters';
import { CATEGORY_LABELS, PLATFORM_LABELS, REPORTER_LABELS, STATUS_LABELS, STATUS_TONE, SUPPORT_STATUS_OPTIONS } from '../utils/ticketLabels';

export function TicketDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const ticketId: number = route.params?.ticketId;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const filePickerRef = useRef<FilePickerHandle>(null);
  const [draft, setDraft] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

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
      showToast('Estado actualizado', 'success');
      setChangingStatus(false);
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
        right={
          <Pressable onPress={() => setChangingStatus((v) => !v)} hitSlop={8}>
            <Badge label={STATUS_LABELS[ticket.status]} tone={STATUS_TONE[ticket.status]} />
          </Pressable>
        }
      />

      <View style={styles.summary}>
        <Text style={typography.subtitle}>{ticket.reason}</Text>
        <Text style={styles.meta}>
          {REPORTER_LABELS[ticket.reporterType]} · {CATEGORY_LABELS[ticket.category]}
          {ticket.platform ? ` · ${PLATFORM_LABELS[ticket.platform]}` : ''}
        </Text>
        {ticket.sellerName ? <Text style={styles.meta}>Vendedor: {ticket.sellerName}</Text> : null}
      </View>

      {changingStatus ? (
        <Card style={styles.statusCard}>
          <Text style={typography.bodySm}>Cambiar estado</Text>
          <View style={styles.statusOptions}>
            {SUPPORT_STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => statusMutation.mutate(option)}
                style={[styles.statusChip, option === ticket.status && styles.statusChipActive]}
              >
                <Text style={styles.statusChipText}>{STATUS_LABELS[option]}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}

      {loadingMessages ? (
        <LoadingState />
      ) : (
        <FlatList
          data={[...(messages ?? [])].reverse()}
          keyExtractor={(item) => String(item.id)}
          inverted
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => <MessageBubble message={item} />}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.composer}>
          <Pressable style={styles.attachButton} onPress={() => filePickerRef.current?.open()}>
            <Icon name="attach-outline" size={20} color={colors.brand} />
          </Pressable>
          <View style={styles.composerInputWrap}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Escribe una respuesta…"
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
        <Text style={[styles.bubbleText, isSupport && styles.bubbleTextSupport]}>{message.mensaje}</Text>
        <Text style={[styles.bubbleTime, isSupport && styles.bubbleTimeSupport]}>{formatDateTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.xxs },
  meta: { ...typography.bodySm, textTransform: 'none' },
  statusCard: { marginHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  statusChipActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  statusChipText: { ...typography.caption, textTransform: 'none' },
  messagesList: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowSupport: { justifyContent: 'flex-end' },
  bubbleRowUser: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: radii.lg, padding: spacing.md },
  bubbleSupport: { backgroundColor: colors.brand, borderBottomRightRadius: radii.sm },
  bubbleUser: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, borderBottomLeftRadius: radii.sm },
  bubbleText: { ...typography.body },
  bubbleTextSupport: { color: colors.white },
  bubbleTime: { ...typography.caption, marginTop: spacing.xxs, textTransform: 'none' },
  bubbleTimeSupport: { color: 'rgba(255,255,255,0.75)' },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.surface,
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
});
