import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as adminApi from '@/api/administration';
import type { Expense } from '@/types/administration';
import { Button, Card, ConfirmActionSheet, ConfirmActionSheetHandle, EmptyState, Icon, LoadingState, MetricCard, ScreenContainer } from '@/components/shared';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getCashAllocation, getExpenseTotal, getSettlements } from '../utils/settlements';
import { ExpenseFormModal } from '../components/ExpenseFormModal';
import { useRef } from 'react';

/**
 * Igual que en el backoffice web: los gastos NO se persisten en el backend
 * (el bootstrap solo entrega la carga inicial). Los cambios viven en el
 * estado local de esta pantalla durante la sesión, replicando el
 * comportamiento real de AdminFinancePage.tsx.
 */
export function GastosScreen() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const confirmRef = useRef<ConfirmActionSheetHandle>(null);

  const { data: bootstrap, isLoading } = useQuery({
    queryKey: ['admin-bootstrap'],
    queryFn: adminApi.getBootstrap,
  });

  const currentExpenses = expenses ?? bootstrap?.expenses ?? [];

  const commissionTotal = useMemo(() => {
    if (!bootstrap) return 0;
    return getSettlements(bootstrap.orders, bootstrap.settlementStatuses ?? {}).reduce((sum, s) => sum + s.commission, 0);
  }, [bootstrap]);

  const { cashFund } = getCashAllocation(commissionTotal);
  const expenseTotal = getExpenseTotal(currentExpenses);
  const cashBalance = cashFund - expenseTotal;

  const handleSave = (expense: Expense) => {
    setExpenses((current) => {
      const base = current ?? bootstrap?.expenses ?? [];
      const exists = base.some((item) => item.id === expense.id);
      return exists ? base.map((item) => (item.id === expense.id ? expense : item)) : [expense, ...base];
    });
    setFormVisible(false);
    setEditingExpense(null);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    confirmRef.current?.open({
      title: 'Eliminar gasto',
      description: 'Esta acción no se puede deshacer.',
      confirmVariant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: () => {
        setExpenses((current) => (current ?? bootstrap?.expenses ?? []).filter((item) => item.id !== id));
      },
    });
  };

  if (isLoading) return <LoadingState />;

  return (
    <ScreenContainer>
      <View style={styles.metricsRow}>
        <MetricCard label="Total gastos" value={formatCurrency(expenseTotal)} icon="receipt-outline" tone="warning" />
        <MetricCard label="Saldo en caja" value={formatCurrency(cashBalance)} icon="wallet-outline" tone={cashBalance < 0 ? 'danger' : 'success'} />
      </View>

      <Button
        label="Registrar gasto"
        style={styles.addButton}
        onPress={() => {
          setEditingExpense(null);
          setFormVisible(true);
        }}
      />

      <FlatList
        data={currentExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState title="Sin gastos" description="No hay gastos registrados en esta sesión." />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={typography.subtitle}>{item.description}</Text>
              <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            </View>
            <Text style={typography.bodySm}>{item.category} · {formatDate(item.date)}</Text>
            <View style={styles.cardActions}>
              <View style={styles.receiptRow}>
                <Icon name="document-attach-outline" size={16} color={colors.textTertiary} />
                <Text style={styles.receiptText}>{item.receipt ?? 'Sin comprobante'}</Text>
              </View>
              <View style={styles.actionButtons}>
                <Button
                  label="Editar"
                  variant="secondary"
                  style={styles.actionButton}
                  onPress={() => {
                    setEditingExpense(item);
                    setFormVisible(true);
                  }}
                />
                <Button label="Eliminar" variant="danger" style={styles.actionButton} onPress={() => handleDelete(item.id)} />
              </View>
            </View>
          </Card>
        )}
      />

      <ExpenseFormModal
        visible={formVisible}
        expense={editingExpense}
        onClose={() => {
          setFormVisible(false);
          setEditingExpense(null);
        }}
        onSave={handleSave}
      />
      <ConfirmActionSheet ref={confirmRef} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  metricsRow: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.md, marginBottom: spacing.md },
  addButton: { marginBottom: spacing.md },
  listContent: { paddingBottom: spacing.huge },
  card: { gap: spacing.xs, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  amount: { ...typography.subtitle, color: colors.brand },
  cardActions: { marginTop: spacing.sm, gap: spacing.sm },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  receiptText: { ...typography.caption, textTransform: 'none' },
  actionButtons: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
});
