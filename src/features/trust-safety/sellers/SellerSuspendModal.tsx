import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as sellersApi from '@/api/sellers';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button, Input, showToast } from '@/components/shared';
import { colors, spacing } from '@/theme';

interface SellerSuspendModalProps {
  visible: boolean;
  sellerId: number | null;
  onClose: () => void;
}

export function SellerSuspendModal({ visible, sellerId, onClose }: SellerSuspendModalProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      if (!sellerId) throw new Error('Sin vendedor');
      return sellersApi.suspendSeller(sellerId, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trust-sellers'] });
      queryClient.invalidateQueries({ queryKey: ['trust-seller', sellerId] });
      showToast('Vendedor suspendido', 'success');
      setReason('');
      onClose();
    },
    onError: () => showToast('No se pudo suspender al vendedor', 'error'),
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <GestureHandlerRootView style={styles.overlay}>
        <View style={styles.sheet}>
          <AppHeader title="Suspender vendedor" onBack={onClose} />
          <View style={styles.content}>
            <Text style={styles.warning}>Esta acción restringirá el acceso del vendedor a la plataforma.</Text>
            <Input label="Motivo de la suspensión" value={reason} onChangeText={setReason} multiline placeholder="Describe el motivo…" />
            <Button
              label="Confirmar suspensión"
              variant="danger"
              fullWidth
              disabled={!reason.trim()}
              loading={mutation.isPending}
              onPress={() => mutation.mutate()}
            />
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.bg },
  sheet: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  warning: { color: colors.danger },
});
