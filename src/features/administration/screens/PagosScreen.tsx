import React, { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
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
  ListItemCard,
  LoadingState,
  ScreenContainer,
  SegmentedTabs,
  showToast,
} from '@/components/shared';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getCurrentCycleRange } from '../utils/cycle';

type Tab = 'gestion' | 'historial';

export function PagosScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('gestion');
  const [selectedPayment, setSelectedPayment] = useState<PagoProveedorResponse | null>(null);
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

  return (
    <ScreenContainer>
      <View style={styles.tabsWrap}>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'gestion', label: 'Gestión' },
            { value: 'historial', label: 'Historial' },
          ]}
        />
      </View>

      {tab === 'gestion' ? (
        loadingWithdrawals ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={pending}
            keyExtractor={(item) => String(item.retiroId)}
            ListHeaderComponent={
              <Card style={styles.cycleCard}>
                <Text style={typography.subtitle}>Ciclo actual</Text>
                <Text style={styles.cycleAmount}>{formatCurrency(pendingTotal)}</Text>
                <Text style={typography.bodySm}>{pending.length} retiros pendientes</Text>
                <Button
                  label="Procesar pago del ciclo"
                  fullWidth
                  style={styles.processButton}
                  disabled={pending.length === 0}
                  loading={processMutation.isPending}
                  onPress={handleProcess}
                />
              </Card>
            }
            ListEmptyComponent={<EmptyState title="Sin retiros pendientes" description="No hay retiros solicitados en el ciclo actual." />}
            renderItem={({ item }) => (
              <ListItemCard
                title={item.nombreTienda}
                subtitle={`${formatCurrency(item.monto)} · ${formatDate(item.fecha)}`}
                rightBadge={
                  <Badge label={item.documentoLiquidacionCompleto ? 'Doc. completo' : 'Doc. pendiente'} tone={item.documentoLiquidacionCompleto ? 'success' : 'warning'} />
                }
                showChevron={false}
              />
            )}
          />
        )
      ) : loadingPayments ? (
        <LoadingState />
      ) : (
        <FlatList
          data={payments ?? []}
          keyExtractor={(item) => String(item.pagoId)}
          ListEmptyComponent={<EmptyState title="Sin pagos registrados" description="Aún no se han procesado pagos." />}
          renderItem={({ item }) => (
            <ListItemCard
              title={formatCurrency(item.montoTotal)}
              subtitle={`${item.retiros.length} retiros · ${formatDate(item.fechaPago)}`}
              rightBadge={<Badge label={item.estado} tone="brand" />}
              onPress={() => setSelectedPayment(item)}
            />
          )}
        />
      )}

      {selectedPayment ? (
        <Card style={styles.detailCard}>
          <Text style={typography.subtitle}>Pago {formatCurrency(selectedPayment.montoTotal)}</Text>
          {selectedPayment.retiros.map((retiro) => (
            <Text key={retiro.retiroId} style={typography.bodySm}>
              {retiro.nombreTienda} · {formatCurrency(retiro.monto)}
            </Text>
          ))}
          <Button label="Cerrar" variant="secondary" onPress={() => setSelectedPayment(null)} />
        </Card>
      ) : null}

      <ConfirmActionSheet ref={confirmRef} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabsWrap: { paddingTop: spacing.md, paddingBottom: spacing.md },
  cycleCard: { gap: spacing.xxs, backgroundColor: colors.surfaceAlt, marginBottom: spacing.md },
  cycleAmount: { ...typography.displaySm, color: colors.brand },
  processButton: { marginTop: spacing.sm },
  detailCard: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.xs,
  },
});
