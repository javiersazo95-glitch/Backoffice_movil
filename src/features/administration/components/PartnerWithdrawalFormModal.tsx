import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Withdrawal } from '@/types/administration';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button, Input } from '@/components/shared';
import { colors, radii, spacing, typography } from '@/theme';
import { PARTNERS, WITHDRAWAL_REASON_OPTIONS } from '../utils/constants';

interface PartnerWithdrawalFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (withdrawal: Withdrawal) => void;
}

export function PartnerWithdrawalFormModal({ visible, onClose, onSave }: PartnerWithdrawalFormModalProps) {
  const [date, setDate] = useState('');
  const [beneficiary, setBeneficiary] = useState<string>(PARTNERS[0]);
  const [reason, setReason] = useState<string>(WITHDRAWAL_REASON_OPTIONS[0]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (visible) {
      setDate(new Date().toISOString().slice(0, 10));
      setBeneficiary(PARTNERS[0]);
      setReason(WITHDRAWAL_REASON_OPTIONS[0]);
      setAmount('');
    }
  }, [visible]);

  const handleSave = () => {
    const numericAmount = Number(amount);
    if (!date || !numericAmount || numericAmount <= 0) return;
    onSave({
      id: `retiro-socio-${Date.now()}`,
      type: 'partner',
      period: date.slice(0, 7),
      date,
      beneficiary,
      reason,
      amount: numericAmount,
      balanceBefore: 0,
      balanceAfter: 0,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <AppHeader title="Registrar retiro" onBack={onClose} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Input label="Fecha (AAAA-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-07-21" />

          <Text style={styles.label}>Socio</Text>
          <View style={styles.chips}>
            {PARTNERS.map((partner) => (
              <Pressable key={partner} onPress={() => setBeneficiary(partner)} style={[styles.chip, beneficiary === partner && styles.chipActive]}>
                <Text style={[styles.chipText, beneficiary === partner && styles.chipTextActive]}>{partner}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Motivo</Text>
          <View style={styles.chips}>
            {WITHDRAWAL_REASON_OPTIONS.map((option) => (
              <Pressable key={option} onPress={() => setReason(option)} style={[styles.chip, reason === option && styles.chipActive]}>
                <Text style={[styles.chipText, reason === option && styles.chipTextActive]}>{option}</Text>
              </Pressable>
            ))}
          </View>

          <Input label="Monto" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />

          <Button label="Registrar retiro" fullWidth style={styles.saveButton} onPress={handleSave} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.huge },
  label: { ...typography.bodySm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { ...typography.bodySm, textTransform: 'none' },
  chipTextActive: { color: colors.brandDark, fontWeight: '700' },
  saveButton: { marginTop: spacing.md },
});
