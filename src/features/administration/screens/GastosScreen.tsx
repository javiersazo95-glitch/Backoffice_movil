import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as adminApi from '@/api/administration';
import type { Expense } from '@/types/administration';
import {
  Button,
  Card,
  ConfirmActionSheet,
  ConfirmActionSheetHandle,
  EmptyState,
  Icon,
  LoadingState,
  MetricCard,
  ScreenContainer,
} from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { HeaderHomeButton } from '@/components/layout/HeaderHomeButton';
import { colors, radii, spacing, toneColors, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getCashAllocation, getExpenseTotal, getSettlements } from '../utils/settlements';
import { ExpenseFormModal } from '../components/ExpenseFormModal';

export function GastosScreen() {
  const navigation = useNavigation<any>();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading) return <LoadingState />;

  return (
    <ScreenContainer padded={false}>
      <AppHeader title="Gastos Operacionales" onBack={() => navigation.goBack()} right={<HeaderHomeButton />} />

      <View style={styles.body}>
        <View style={styles.metricsRow}>
          <MetricCard label="Total gastos" value={formatCurrency(expenseTotal)} icon="receipt-outline" tone="warning" />
          <MetricCard label="Saldo en caja" value={formatCurrency(cashBalance)} icon="wallet-outline" tone={cashBalance < 0 ? 'danger' : 'success'} />
        </View>

        <Button
          label="➕ Registrar Nuevo Gasto"
          style={styles.addButton}
          onPress={() => {
            setEditingExpense(null);
            setFormVisible(true);
          }}
        />

        <FlatList
          style={{ flex: 1 }}
          data={currentExpenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title="Sin gastos" description="No hay gastos registrados en esta sesión." />}
          renderItem={({ item }) => {
            const isExpanded = expandedId === item.id;

            return (
              <Card style={styles.card}>
                {/* Vista Plegada */}
                <Pressable style={styles.cardSummaryHeader} onPress={() => toggleExpand(item.id)}>
                  <View style={styles.summaryTopRow}>
                    <Text style={styles.descriptionText}>{item.description}</Text>
                    <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
                  </View>

                  <View style={styles.summaryBottomRow}>
                    <Text style={styles.metaText}>{item.category} · {formatDate(item.date)}</Text>
                    <View style={styles.expandToggleBtn}>
                      <Text style={styles.expandToggleText}>{isExpanded ? 'Ocultar ∧' : 'Ver Registro ∨'}</Text>
                    </View>
                  </View>
                </Pressable>

                {/* Contenido Desplegable */}
                {isExpanded ? (
                  <View style={styles.expandedContent}>
                    <View style={styles.sectionBox}>
                      <Text style={styles.sectionTitle}>🧾 Información del Registro de Gasto</Text>
                      <View style={styles.infoGrid}>
                        <Text style={styles.infoText}><Text style={styles.boldText}>Descripción:</Text> {item.description}</Text>
                        <Text style={styles.infoText}><Text style={styles.boldText}>Categoría:</Text> {item.category}</Text>
                        <Text style={styles.infoText}><Text style={styles.boldText}>Monto Contabilizado:</Text> {formatCurrency(item.amount)}</Text>
                        <Text style={styles.infoText}><Text style={styles.boldText}>Fecha del Registro:</Text> {formatDate(item.date)}</Text>
                        <Text style={styles.infoText}><Text style={styles.boldText}>Comprobante Adjunto:</Text> {item.receipt ?? 'Sin respaldo adjunto'}</Text>
                      </View>
                    </View>

                    <View style={styles.actionButtons}>
                      <Button
                        label="✏️ Editar Gasto"
                        variant="secondary"
                        style={styles.actionButton}
                        onPress={() => {
                          setEditingExpense(item);
                          setFormVisible(true);
                        }}
                      />
                      <Button label="🗑️ Eliminar" variant="danger" style={styles.actionButton} onPress={() => handleDelete(item.id)} />
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          }}
        />
      </View>

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
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xs, justifyContent: 'flex-start' },
  metricsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  addButton: { marginBottom: spacing.md },
  listContent: { paddingBottom: spacing.huge },
  card: { padding: 0, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardSummaryHeader: { padding: spacing.md, backgroundColor: colors.surface },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  descriptionText: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, flex: 1, paddingRight: spacing.xs },
  amountText: { fontSize: 15, fontWeight: '800', color: colors.brand },
  summaryBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  metaText: { fontSize: 11.5, color: colors.textTertiary },
  expandToggleBtn: { backgroundColor: toneColors.brand.bg, paddingHorizontal: spacing.sm, height: 26, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  expandToggleText: { fontSize: 11.5, fontWeight: '700', color: colors.brand },
  expandedContent: { padding: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  sectionBox: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSoft, gap: spacing.xs },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xxs },
  infoGrid: { gap: 4 },
  infoText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  boldText: { fontWeight: '700', color: colors.textPrimary },
  actionButtons: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
});
