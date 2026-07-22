import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as mediationsApi from '@/api/mediations';
import type { MediationMessageResponse } from '@/types/mediation';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, Icon, LoadingState, ScreenContainer, showToast } from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { colors, radii, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { MEDIATION_STATUS_LABELS, MEDIATION_STATUS_TONE } from '../utils/labels';
import { MediationResolveModal } from './MediationResolveModal';

export function MediationDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mediationId: number = route.params?.mediationId;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [resolveVisible, setResolveVisible] = useState(false);
  const [reactivateVisible, setReactivateVisible] = useState(false);

  const { data: mediation, isLoading } = useQuery({
    queryKey: ['mediation', mediationId],
    queryFn: () => mediationsApi.getMediationById(mediationId),
  });

  const { data: messagesPage, isLoading: loadingMessages } = useQuery({
    queryKey: ['mediation-messages', mediationId],
    queryFn: () => mediationsApi.getMessages(mediationId),
    refetchInterval: 15_000,
  });

  const initMutation = useMutation({
    mutationFn: () =>
      mediationsApi.initMediation(mediationId, {
        sellerId: mediation!.sellerId,
        title: mediation!.title,
        reason: mediation!.reason,
        orderId: mediation!.orderId,
        amount: String(mediation!.amount),
        message: 'Mediación iniciada desde la app móvil.',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediation', mediationId] });
      queryClient.invalidateQueries({ queryKey: ['mediations'] });
      showToast('Mediación iniciada', 'success');
    },
    onError: () => showToast('No se pudo iniciar la mediación', 'error'),
  });

  const blockMutation = useMutation({
    mutationFn: () => mediationsApi.blockAccount(mediationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediation', mediationId] });
      queryClient.invalidateQueries({ queryKey: ['mediations'] });
      showToast('Cuenta bloqueada', 'success');
    },
    onError: () => showToast('No se pudo bloquear la cuenta', 'error'),
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) => mediationsApi.addMessage(mediationId, { message }),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['mediation-messages', mediationId] });
    },
    onError: () => showToast('No se pudo enviar el mensaje', 'error'),
  });

  if (isLoading || !mediation) return <LoadingState />;

  return (
    <ScreenContainer padded={false} keyboardAvoiding>
      <AppHeader
        title={`Pedido ${mediation.orderId}`}
        onBack={() => navigation.goBack()}
        right={
          <Badge
            label={mediation.accountBlocked ? 'Bloqueada' : MEDIATION_STATUS_LABELS[mediation.status]}
            tone={mediation.accountBlocked ? 'danger' : MEDIATION_STATUS_TONE[mediation.status]}
          />
        }
      />

      <View style={styles.summary}>
        <Text style={typography.subtitle}>{mediation.sellerName}</Text>
        <Text style={styles.meta}>
          {mediation.reason} · {formatCurrency(mediation.amount)}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        {!mediation.mediationStarted ? (
          <Button label="Iniciar mediación" style={styles.actionButton} loading={initMutation.isPending} onPress={() => initMutation.mutate()} />
        ) : null}
        {mediation.canBlockAccount && !mediation.accountBlocked ? (
          <Button label="Bloquear cuenta" variant="danger" style={styles.actionButton} loading={blockMutation.isPending} onPress={() => blockMutation.mutate()} />
        ) : null}
        {mediation.accountBlocked ? (
          <Button label="Reactivar cuenta" variant="secondary" style={styles.actionButton} onPress={() => setReactivateVisible(true)} />
        ) : null}
        {mediation.mediationStarted ? (
          <Button label="Resolver caso" variant="secondary" style={styles.actionButton} onPress={() => setResolveVisible(true)} />
        ) : null}
      </View>

      {loadingMessages ? (
        <LoadingState />
      ) : (
        <FlatList
          data={[...(messagesPage?.content ?? [])].reverse()}
          keyExtractor={(item) => String(item.id)}
          inverted
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => <MessageBubble message={item} isMine={item.author === user?.fullName} />}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.composer}>
          <View style={styles.composerInputWrap}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Escribe una nota o mensaje…"
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
  summary: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.xxs },
  meta: { ...typography.bodySm, textTransform: 'none' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  actionButton: { flexGrow: 1, minWidth: 140 },
  messagesList: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: radii.lg, padding: spacing.md },
  bubbleMine: { backgroundColor: colors.violet, borderBottomRightRadius: radii.sm },
  bubbleOther: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, borderBottomLeftRadius: radii.sm },
  bubbleAuthor: { ...typography.caption, textTransform: 'none', marginBottom: spacing.xxs },
  bubbleText: { ...typography.body },
  bubbleTextMine: { color: colors.white },
  bubbleTime: { ...typography.caption, marginTop: spacing.xxs, textTransform: 'none' },
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
});
