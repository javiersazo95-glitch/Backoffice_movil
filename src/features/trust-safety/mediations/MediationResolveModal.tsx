import React, { useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as mediationsApi from '@/api/mediations';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button, FilePickerButton, FilePickerHandle, Input, PickedFile, showToast } from '@/components/shared';
import { colors, spacing } from '@/theme';

interface MediationResolveModalProps {
  visible: boolean;
  mediationId: number | null;
  mode: 'resolve' | 'reactivate';
  onClose: () => void;
}

export function MediationResolveModal({ visible, mediationId, mode, onClose }: MediationResolveModalProps) {
  const queryClient = useQueryClient();
  const filePickerRef = useRef<FilePickerHandle>(null);
  const [resolutionReason, setResolutionReason] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!mediationId || !file) throw new Error('Faltan datos');
      const payload = { resolutionReason };
      return mode === 'resolve'
        ? mediationsApi.resolveCase(mediationId, payload, file)
        : mediationsApi.reactivateAccount(mediationId, payload, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediations'] });
      queryClient.invalidateQueries({ queryKey: ['mediation', mediationId] });
      showToast(mode === 'resolve' ? 'Caso resuelto' : 'Cuenta reactivada', 'success');
      setResolutionReason('');
      setFile(null);
      onClose();
    },
    onError: () => showToast('No se pudo completar la acción', 'error'),
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.screen}>
        <AppHeader title={mode === 'resolve' ? 'Resolver caso' : 'Reactivar cuenta'} onBack={onClose} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.hint}>
            {mode === 'resolve'
              ? 'Adjunta el respaldo que sustenta la resolución del caso.'
              : 'Adjunta el respaldo que acredita la reactivación de la cuenta.'}
          </Text>
          <Input label="Motivo de la resolución" value={resolutionReason} onChangeText={setResolutionReason} multiline />
          <Button
            label={file ? file.name : 'Adjuntar documento de respaldo'}
            variant="secondary"
            fullWidth
            onPress={() => filePickerRef.current?.open()}
          />
          <Button
            label={mode === 'resolve' ? 'Confirmar resolución' : 'Confirmar reactivación'}
            fullWidth
            style={styles.submit}
            disabled={!resolutionReason.trim() || !file}
            loading={mutation.isPending}
            onPress={() => mutation.mutate()}
          />
        </ScrollView>
        <FilePickerButton ref={filePickerRef} label="Adjuntar documento" onPicked={setFile} />
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.huge },
  hint: { color: colors.textSecondary },
  submit: { marginTop: spacing.md },
});
