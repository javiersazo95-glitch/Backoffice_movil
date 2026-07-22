import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { Expense } from '@/types/administration';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button, FilePickerButton, FilePickerHandle, Input, PickedFile } from '@/components/shared';
import { colors, radii, spacing, typography } from '@/theme';
import { EXPENSE_CATEGORIES } from '../utils/constants';
import { Pressable } from 'react-native';

interface ExpenseFormModalProps {
  visible: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSave: (expense: Expense) => void;
}

export function ExpenseFormModal({ visible, expense, onClose, onSave }: ExpenseFormModalProps) {
  const filePickerRef = useRef<FilePickerHandle>(null);
  const [date, setDate] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState<PickedFile | null>(null);

  useEffect(() => {
    if (visible) {
      setDate(expense?.date ?? new Date().toISOString().slice(0, 10));
      setCategory(expense?.category ?? EXPENSE_CATEGORIES[0]);
      setDescription(expense?.description ?? '');
      setAmount(expense ? String(expense.amount) : '');
      setReceipt(null);
    }
  }, [visible, expense]);

  const handleSave = () => {
    const numericAmount = Number(amount);
    if (!date || !category || !description.trim() || !numericAmount || numericAmount <= 0) return;

    onSave({
      id: expense?.id ?? `gasto-${Date.now()}`,
      date,
      category,
      description: description.trim(),
      amount: numericAmount,
      receipt: receipt?.name ?? expense?.receipt,
      receiptUrl: receipt?.uri ?? expense?.receiptUrl,
      receiptType: receipt?.mimeType ?? expense?.receiptType,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.screen}>
        <AppHeader title={expense ? 'Editar gasto' : 'Registrar gasto'} onBack={onClose} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Input label="Fecha (AAAA-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-07-21" />

          <Text style={styles.label}>Categoría</Text>
          <View style={styles.chips}>
            {EXPENSE_CATEGORIES.map((option) => (
              <Pressable
                key={option}
                onPress={() => setCategory(option)}
                style={[styles.chip, category === option && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === option && styles.chipTextActive]}>{option}</Text>
              </Pressable>
            ))}
          </View>

          <Input label="Descripción" value={description} onChangeText={setDescription} multiline />
          <Input label="Monto" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />

          <Button
            label={receipt ? receipt.name : expense?.receipt ? 'Reemplazar comprobante' : 'Adjuntar comprobante'}
            variant="secondary"
            fullWidth
            onPress={() => filePickerRef.current?.open()}
          />

          <Button label="Guardar gasto" fullWidth style={styles.saveButton} onPress={handleSave} />
        </ScrollView>
        <FilePickerButton ref={filePickerRef} label="Adjuntar comprobante" onPicked={setReceipt} />
      </GestureHandlerRootView>
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
