import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as sellersApi from '@/api/sellers';
import { SellerStatus } from '@/types/seller';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  ScreenContainer,
  ScrollableTabs,
} from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import {
  BANK_STATUS_LABELS,
  SELLER_STATUS_LABELS,
  SELLER_STATUS_TONE,
  TRUST_LEVEL_LABELS,
  TRUST_LEVEL_TONE,
} from '../utils/labels';
import { SellerSuspendModal } from './SellerSuspendModal';

type Tab = 'perfil' | 'bloqueos' | 'reportes' | 'documentos' | 'actividad';

export function SellerDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const sellerId: number = route.params?.sellerId;
  const [tab, setTab] = useState<Tab>('perfil');
  const [suspendVisible, setSuspendVisible] = useState(false);

  const { data: seller, isLoading } = useQuery({
    queryKey: ['trust-seller', sellerId],
    queryFn: () => sellersApi.getSellerById(sellerId),
  });

  const { data: blockHistory } = useQuery({
    queryKey: ['seller-block-history', sellerId],
    queryFn: () => sellersApi.getSellerBlockHistory(sellerId),
    enabled: tab === 'bloqueos',
  });

  const { data: reports } = useQuery({
    queryKey: ['seller-reports', sellerId],
    queryFn: () => sellersApi.getSellerReports(sellerId),
    enabled: tab === 'reportes',
  });

  const { data: documents } = useQuery({
    queryKey: ['seller-documents', sellerId],
    queryFn: () => sellersApi.getSellerDocuments(sellerId),
    enabled: tab === 'documentos',
  });

  const { data: retiros } = useQuery({
    queryKey: ['seller-retiros', sellerId],
    queryFn: () => sellersApi.getSellerRetiros(sellerId),
    enabled: tab === 'actividad',
  });

  const { data: tickets } = useQuery({
    queryKey: ['seller-tickets', sellerId],
    queryFn: () => sellersApi.getSellerTickets(sellerId),
    enabled: tab === 'actividad',
  });

  if (isLoading || !seller) return <LoadingState />;

  return (
    <ScreenContainer padded={false}>
      <AppHeader
        title={seller.storeName}
        onBack={() => navigation.goBack()}
        right={<Badge label={SELLER_STATUS_LABELS[seller.status]} tone={SELLER_STATUS_TONE[seller.status]} />}
      />

      <View style={styles.tabsWrap}>
        <ScrollableTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'perfil', label: 'Perfil' },
            { value: 'bloqueos', label: 'Bloqueos' },
            { value: 'reportes', label: 'Reportes' },
            { value: 'documentos', label: 'Documentos' },
            { value: 'actividad', label: 'Actividad' },
          ]}
        />
      </View>

      {tab === 'perfil' ? (
        <FlatList
          data={[seller]}
          keyExtractor={() => 'perfil'}
          contentContainerStyle={styles.listContent}
          renderItem={() => (
            <View style={styles.perfilContent}>
              <Card style={styles.card}>
                <Row label="RUT" value={seller.rut} />
                <Row label="Ciudad" value={seller.city} />
                <Row label="Confianza" value={`${TRUST_LEVEL_LABELS[seller.trustLevel]} (${seller.trustScore})`} />
                <Row label="Calificación" value={`${seller.rating.toFixed(1)}★`} />
                <Row label="Cuenta bancaria" value={BANK_STATUS_LABELS[seller.bankStatus]} />
                {seller.email ? <Row label="Correo" value={seller.email} /> : null}
                {seller.phone ? <Row label="Teléfono" value={seller.phone} /> : null}
              </Card>
              <Card style={styles.card}>
                <Row label="Tickets abiertos" value={String(seller.openTickets)} />
                <Row label="Mediaciones" value={String(seller.mediationCount)} />
                <Row label="Devoluciones" value={String(seller.returnsCount)} />
                <Row label="Reclamos" value={String(seller.claimsCount)} />
                <Row label="Comprobantes pendientes" value={String(seller.pendingReceipts)} />
              </Card>
              {seller.status !== SellerStatus.RECHAZADO ? (
                <Button label="Suspender vendedor" variant="danger" fullWidth onPress={() => setSuspendVisible(true)} />
              ) : null}
            </View>
          )}
        />
      ) : null}

      {tab === 'bloqueos' ? (
        <FlatList
          data={blockHistory ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title="Sin bloqueos" description="Este vendedor no tiene historial de bloqueos." />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={typography.subtitle}>{item.action}</Text>
              <Text style={typography.bodySm}>{item.reason ?? item.detail ?? '—'}</Text>
              <Text style={typography.caption}>{formatDateTime(item.createdAt)} · {item.operator ?? item.source}</Text>
            </Card>
          )}
        />
      ) : null}

      {tab === 'reportes' ? (
        <FlatList
          data={reports ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title="Sin reportes" description="No hay reportes registrados." />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={typography.subtitle}>{item.motivo}</Text>
              <Text style={typography.bodySm}>{item.descripcion}</Text>
              <Text style={typography.caption}>
                {item.reportanteName} → {item.reportadoName} · {formatDate(item.fechaCreacion)}
              </Text>
            </Card>
          )}
        />
      ) : null}

      {tab === 'documentos' ? (
        <FlatList
          data={documents ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title="Sin documentos" description="No hay documentos registrados." />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={typography.subtitle}>{item.documentType}</Text>
              <Text style={typography.caption}>Subido {formatDate(item.uploadedAt)}</Text>
            </Card>
          )}
        />
      ) : null}

      {tab === 'actividad' ? (
        <FlatList
          data={[...(tickets ?? []).map((t) => ({ kind: 'ticket' as const, item: t })), ...(retiros ?? []).map((r) => ({ kind: 'retiro' as const, item: r }))]}
          keyExtractor={(entry, index) => `${entry.kind}-${index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title="Sin actividad" description="No hay tickets ni retiros recientes." />}
          renderItem={({ item: entry }) =>
            entry.kind === 'ticket' ? (
              <Card style={styles.card}>
                <Text style={typography.subtitle}>Ticket {entry.item.externalId}</Text>
                <Text style={typography.bodySm}>{entry.item.reason}</Text>
              </Card>
            ) : (
              <Card style={styles.card}>
                <Text style={typography.subtitle}>Retiro {formatCurrency(entry.item.montoTotal)}</Text>
                <Text style={typography.caption}>{formatDate(entry.item.fechaSolicitud)} · {entry.item.estado}</Text>
              </Card>
            )
          }
        />
      ) : null}

      <SellerSuspendModal visible={suspendVisible} sellerId={sellerId} onClose={() => setSuspendVisible(false)} />
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.huge, gap: spacing.md },
  perfilContent: { gap: spacing.md },
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  rowLabel: { ...typography.bodySm, textTransform: 'none' },
  rowValue: { ...typography.body, fontWeight: '600' },
});
