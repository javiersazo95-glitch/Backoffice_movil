import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as adminApi from '@/api/administration';
import type { Withdrawal } from '@/types/administration';
import { Button, Card, EmptyState, ListItemCard, LoadingState, MetricCard, ScreenContainer } from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { HeaderHomeButton } from '@/components/layout/HeaderHomeButton';
import { spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getCashAllocation, getPartnerBalances, getSettlements } from '../utils/settlements';
import { PartnerWithdrawalFormModal } from '../components/PartnerWithdrawalFormModal';

export function HistorialRetirosScreen() {
  const navigation = useNavigation<any>();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[] | null>(null);
  const [formVisible, setFormVisible] = useState(false);

  const { data: bootstrap, isLoading } = useQuery({
    queryKey: ['admin-bootstrap'],
    queryFn: adminApi.getBootstrap,
  });

  const currentWithdrawals = withdrawals ?? bootstrap?.withdrawals ?? [];

  const commissionTotal = useMemo(() => {
    if (!bootstrap) return 0;
    return getSettlements(bootstrap.orders, bootstrap.settlementStatuses ?? {}).reduce((sum, s) => sum + s.commission, 0);
  }, [bootstrap]);

  const { withdrawalAvailable } = getCashAllocation(commissionTotal);
  const balances = getPartnerBalances(currentWithdrawals, withdrawalAvailable, '', '9999-12-31');

  const handleSave = (withdrawal: Withdrawal) => {
    setWithdrawals((current) => [withdrawal, ...(current ?? bootstrap?.withdrawals ?? [])]);
    setFormVisible(false);
  };

  if (isLoading) return <LoadingState />;

  return (
    <ScreenContainer padded={false}>
      <AppHeader
        title="Historial de Retiros de Socios"
        onBack={() => navigation.goBack()}
        right={<HeaderHomeButton />}
      />

      <View style={styles.body}>
        <View style={styles.metricsRow}>
          {Object.entries(balances).map(([partner, balance]) => (
            <MetricCard key={partner} label={partner} value={formatCurrency(balance)} icon="wallet-outline" tone={balance < 0 ? 'danger' : 'violet'} />
          ))}
        </View>

        <Card style={styles.noticeCard}>
          <Text style={typography.bodySm}>
            Este apartado registra solo retiros de libre disposición para socios. Un socio puede quedar en negativo si retiró más de lo disponible.
          </Text>
        </Card>

        <Button label="Registrar retiro" style={styles.addButton} onPress={() => setFormVisible(true)} />

        <FlatList
          data={currentWithdrawals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title="Sin retiros" description="No hay retiros de socios registrados en esta sesión." />}
          renderItem={({ item }) => (
            <ListItemCard
              title={`${item.beneficiary} · ${formatCurrency(item.amount)}`}
              subtitle={item.reason}
              meta={formatDate(item.date)}
              showChevron={false}
            />
          )}
        />
      </View>

      <PartnerWithdrawalFormModal visible={formVisible} onClose={() => setFormVisible(false)} onSave={handleSave} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: spacing.lg },
  metricsRow: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md, marginBottom: spacing.md, flexWrap: 'wrap' },
  noticeCard: { marginBottom: spacing.md },
  addButton: { marginBottom: spacing.md },
  listContent: { paddingBottom: spacing.huge },
});
