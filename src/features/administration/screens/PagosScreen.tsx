import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '@/api/administration';
import type { PagoProveedorResponse } from '@/types/administration';
import {
  Badge,
  Button,
  Card,
  ConfirmActionSheet,
  ConfirmActionSheetHandle,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  ScreenContainer,
  showToast,
} from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { HeaderHomeButton } from '@/components/layout/HeaderHomeButton';
import { colors, radii, spacing, toneColors, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getCurrentCycleRange } from '../utils/cycle';

type Tab = 'gestion' | 'historial';

export function PagosScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('gestion');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const confirmRef = useRef<ConfirmActionSheetHandle>(null);
  const { end: cycleEnd } = useMemo(() => getCurrentCycleRange(), []);

  const { data: withdrawals, isLoading: loadingWithdrawals, isError, refetch } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: adminApi.getWithdrawals,
  });

  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['admin-withdrawal-payments'],
    queryFn: adminApi.getWithdrawalPayments,
  });

  const pending = useMemo(
    () => (withdrawals ?? []).filter((w) => w.estado === 'SOLICITADO' && new Date(w.fecha) <= cycleEnd),
    [withdrawals, cycleEnd],
  );
  const pendingTotal = pending.reduce((sum, item) => sum + Number(item.monto || 0), 0);
  const incompleteSellers = [...new Set(pending.filter((w) => !w.documentoLiquidacionCompleto).map((w) => w.nombreTienda))];

  const processMutation = useMutation({
    mutationFn: () => adminApi.createWithdrawalPayment(pending.map((w) => w.retiroId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawal-payments'] });
      showToast('Pagos del ciclo procesados con éxito', 'success');
      setTab('historial');
    },
    onError: () => showToast('Ocurrió un error al procesar los pagos', 'error'),
  });

  const handleProcess = () => {
    if (incompleteSellers.length > 0) {
      showToast(`Faltan documentos: ${incompleteSellers.join(', ')}`, 'error');
      return;
    }
    confirmRef.current?.open({
      title: 'Procesar pago del ciclo',
      description: `Se procesarán ${pending.length} retiros por un total de ${formatCurrency(pendingTotal)}.`,
      confirmLabel: 'Procesar',
      onConfirm: () => processMutation.mutateAsync().then(() => undefined),
    });
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <ScreenContainer padded={false}>
      <AppHeader title="Pago a Proveedores / Retiros" onBack={() => navigation.goBack()} right={<HeaderHomeButton />} />

      <View style={styles.body}>
        {/* Chips de Pestaña Fijos Arriba */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickFilterContainer}
          contentContainerStyle={styles.quickFilterScroll}
        >
          <Pressable
            style={[styles.quickChip, tab === 'gestion' && styles.quickChipActive]}
            onPress={() => setTab('gestion')}
          >
            <Icon name="cash" size={13} color={tab === 'gestion' ? colors.white : colors.brand} />
            <Text style={[styles.quickChipText, tab === 'gestion' && styles.quickChipTextActive]}>💰 Gestión de Ciclo</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, tab === 'historial' && styles.quickChipActiveDone]}
            onPress={() => setTab('historial')}
          >
            <Icon name="time" size={13} color={tab === 'historial' ? colors.white : colors.success} />
            <Text style={[styles.quickChipText, tab === 'historial' && styles.quickChipTextActive]}>📜 Historial de Pagos</Text>
          </Pressable>
        </ScrollView>

        {tab === 'gestion' ? (
          loadingWithdrawals ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <FlatList
              style={{ flex: 1 }}
              data={pending}
              keyExtractor={(item) => String(item.retiroId)}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <Card style={styles.cycleCard}>
                  <Text style={typography.subtitle}>Resumen Ciclo Actual</Text>
                  <Text style={styles.cycleAmount}>{formatCurrency(pendingTotal)}</Text>
                  <Text style={typography.bodySm}>{pending.length} retiros solicitados pendientes de pago</Text>
                  <Button
                    label="💳 Procesar Pago Masivo del Ciclo"
                    style={styles.processButton}
                    disabled={pending.length === 0}
                    loading={processMutation.isPending}
                    onPress={handleProcess}
                  />
                </Card>
              }
              ListEmptyComponent={<EmptyState title="Sin retiros pendientes" description="No hay retiros solicitados en el ciclo actual." />}
              renderItem={({ item }) => {
                const isExpanded = expandedId === item.retiroId;

                return (
                  <Card style={styles.card}>
                    {/* Cabecera Plegada */}
                    <Pressable style={styles.cardSummaryHeader} onPress={() => toggleExpand(item.retiroId)}>
                      <View style={styles.summaryTopRow}>
                        <Text style={styles.storeName}>{item.nombreTienda}</Text>
                        <Badge
                          label={item.documentoLiquidacionCompleto ? 'Doc. Completo' : 'Doc. Pendiente'}
                          tone={item.documentoLiquidacionCompleto ? 'success' : 'warning'}
                        />
                      </View>

                      <View style={styles.summaryBottomRow}>
                        <Text style={styles.amountText}>Monto: <Text style={styles.boldText}>{formatCurrency(item.monto)}</Text> · {formatDate(item.fecha)}</Text>
                        <View style={styles.expandToggleBtn}>
                          <Text style={styles.expandToggleText}>{isExpanded ? 'Ocultar ∧' : 'Ver Detalle ∨'}</Text>
                        </View>
                      </View>
                    </Pressable>

                    {/* Contenido Desplegable */}
                    {isExpanded ? (
                      <View style={styles.expandedContent}>
                        <View style={styles.sectionBox}>
                          <Text style={styles.sectionTitle}>🏦 Datos de Transferencia y Retiro</Text>
                          <View style={styles.infoGrid}>
                            <Text style={styles.infoText}><Text style={styles.boldText}>ID de Retiro:</Text> #{item.retiroId}</Text>
                            <Text style={styles.infoText}><Text style={styles.boldText}>Titular Tienda:</Text> {item.nombreTienda}</Text>
                            <Text style={styles.infoText}><Text style={styles.boldText}>Correo Electrónico:</Text> {item.email || 'No especificado'}</Text>
                            <Text style={styles.infoText}><Text style={styles.boldText}>RUT Beneficiario:</Text> {item.rut || 'No especificado'}</Text>
                            <Text style={styles.infoText}><Text style={styles.boldText}>Monto Solicitado:</Text> {formatCurrency(item.monto)}</Text>
                            <Text style={styles.infoText}><Text style={styles.boldText}>Documento Tributario:</Text> {item.documentoLiquidacionCompleto ? 'Verificado y Aprobado' : 'Pendiente de emisión por la tienda'}</Text>
                          </View>
                        </View>
                      </View>
                    ) : null}
                  </Card>
                );
              }}
            />
          )
        ) : loadingPayments ? (
          <LoadingState />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={payments ?? []}
            keyExtractor={(item) => String(item.pagoId)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState title="Sin pagos registrados" description="Aún no se han procesado pagos." />}
            renderItem={({ item }) => {
              const isExpanded = expandedId === item.pagoId;

              return (
                <Card style={styles.card}>
                  <Pressable style={styles.cardSummaryHeader} onPress={() => toggleExpand(item.pagoId)}>
                    <View style={styles.summaryTopRow}>
                      <Text style={styles.storeName}>Pago Masivo #{item.pagoId}</Text>
                      <Badge label={item.estado} tone="brand" />
                    </View>

                    <View style={styles.summaryBottomRow}>
                      <Text style={styles.amountText}>Monto Total: <Text style={styles.boldText}>{formatCurrency(item.montoTotal)}</Text> · {formatDate(item.fechaPago)}</Text>
                      <View style={styles.expandToggleBtn}>
                        <Text style={styles.expandToggleText}>{isExpanded ? 'Ocultar ∧' : 'Ver Retiros ∨'}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {isExpanded ? (
                    <View style={styles.expandedContent}>
                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>📜 Retiros Incluidos en este Pago ({item.retiros.length})</Text>
                        {item.retiros.map((r) => (
                          <View key={r.retiroId} style={styles.infoGrid}>
                            <Text style={styles.infoText}>• <Text style={styles.boldText}>{r.nombreTienda}:</Text> {formatCurrency(r.monto)}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </Card>
              );
            }}
          />
        )}
      </View>

      <ConfirmActionSheet ref={confirmRef} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xs, justifyContent: 'flex-start' },
  quickFilterContainer: { flexGrow: 0, flexShrink: 0, height: 38, marginBottom: spacing.xs },
  quickFilterScroll: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingHorizontal: spacing.md, height: 32,
    borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  quickChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  quickChipActiveDone: { backgroundColor: colors.success, borderColor: colors.success },
  quickChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  quickChipTextActive: { color: colors.white },
  cycleCard: { gap: spacing.xxs, backgroundColor: colors.surfaceAlt, marginBottom: spacing.md, padding: spacing.md },
  cycleAmount: { ...typography.displaySm, color: colors.brand },
  processButton: { marginTop: spacing.sm },
  listContent: { paddingBottom: spacing.huge },
  card: { padding: 0, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardSummaryHeader: { padding: spacing.md, backgroundColor: colors.surface },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  storeName: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  summaryBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  amountText: { fontSize: 12, color: colors.textSecondary },
  boldText: { fontWeight: '700', color: colors.textPrimary },
  expandToggleBtn: { backgroundColor: toneColors.brand.bg, paddingHorizontal: spacing.sm, height: 26, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  expandToggleText: { fontSize: 11.5, fontWeight: '700', color: colors.brand },
  expandedContent: { padding: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  sectionBox: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSoft, gap: spacing.xs },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xxs },
  infoGrid: { gap: 4 },
  infoText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
});
