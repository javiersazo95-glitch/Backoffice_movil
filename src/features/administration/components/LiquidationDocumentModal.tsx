import React, { useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '@/api/administration';
import type { RetiroAdminResponse } from '@/types/administration';
import {
  AppHeader,
} from '@/components/layout/AppHeader';
import { Button, Card, FilePickerButton, FilePickerHandle, Input, LoadingState, PickedFile, showToast } from '@/components/shared';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface LiquidationDocumentModalProps {
  visible: boolean;
  retiro: RetiroAdminResponse | null;
  onClose: () => void;
}

export function LiquidationDocumentModal({ visible, retiro, onClose }: LiquidationDocumentModalProps) {
  const queryClient = useQueryClient();
  const filePickerRef = useRef<FilePickerHandle>(null);
  const [tipoDocumento, setTipoDocumento] = useState('Boleta');
  const [rut, setRut] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [email, setEmail] = useState('');
  const [detalle, setDetalle] = useState('');
  const [iva, setIva] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['admin-withdrawal-details', retiro?.retiroId],
    queryFn: () => adminApi.getWithdrawalDetails(retiro!.retiroId),
    enabled: visible && !!retiro,
  });

  React.useEffect(() => {
    if (retiro) {
      setRut(retiro.documentoLiquidacionRut ?? retiro.rut ?? '');
      setRazonSocial(retiro.documentoLiquidacionRazonSocial ?? retiro.razonSocial ?? '');
      setEmail(retiro.documentoLiquidacionEmail ?? retiro.email ?? '');
      setDetalle(retiro.documentoLiquidacionDetalle ?? `Comisión de servicio RepuesTop de ${retiro.nombreTienda}`);
      setIva(retiro.documentoLiquidacionIva != null ? String(retiro.documentoLiquidacionIva) : '');
      setTipoDocumento(retiro.documentoLiquidacionTipo ?? 'Boleta');
      setFile(null);
    }
  }, [retiro]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!retiro) throw new Error('Sin retiro seleccionado');
      return adminApi.saveLiquidationDocument(
        {
          retiroId: retiro.retiroId,
          tipoDocumento,
          rut,
          razonSocial,
          email,
          detalle,
          ivaLiquidado: iva.trim() ? Number(iva) : null,
          eliminarDocumento: false,
        },
        file ?? undefined,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      showToast('Documento de liquidación guardado', 'success');
      onClose();
    },
    onError: () => showToast('No se pudo registrar el documento', 'error'),
  });

  const openExisting = async () => {
    if (!retiro) return;
    try {
      await adminApi.openLiquidationDocumentFile(retiro.retiroId, retiro.documentoLiquidacionNombre ?? 'liquidacion.pdf');
    } catch {
      showToast('No se pudo abrir el documento', 'error');
    }
  };

  if (!retiro) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.screen}>
        <AppHeader title={retiro.nombreTienda} onBack={onClose} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card style={styles.summaryCard}>
            <Text style={typography.subtitle}>{formatCurrency(retiro.monto)}</Text>
            <Text style={typography.bodySm}>Solicitado el {formatDate(retiro.fecha)}</Text>
          </Card>

          {isLoading ? (
            <LoadingState label="Cargando pedidos incluidos…" />
          ) : (
            <Card>
              <Text style={styles.sectionTitle}>Pedidos incluidos ({detail?.pedidos.length ?? 0})</Text>
              {(detail?.pedidos ?? []).map((pedido) => (
                <View key={pedido.pedidoId} style={styles.pedidoRow}>
                  <Text style={typography.bodySm}>{pedido.nombrePedido}</Text>
                  <Text style={typography.bodySm}>{formatCurrency(pedido.valor)}</Text>
                </View>
              ))}
            </Card>
          )}

          <Text style={styles.sectionTitle}>Boleta o factura</Text>
          <Input label="Tipo de documento" value={tipoDocumento} onChangeText={setTipoDocumento} placeholder="Boleta" />
          <Input label="RUT" value={rut} onChangeText={setRut} placeholder="11.111.111-1" />
          <Input label="Razón social" value={razonSocial} onChangeText={setRazonSocial} />
          <Input label="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Detalle" value={detalle} onChangeText={setDetalle} multiline />
          <Input label="IVA liquidado" value={iva} onChangeText={setIva} keyboardType="numeric" />

          <Button
            label={file ? file.name : retiro.documentoLiquidacionNombre ? 'Reemplazar archivo adjunto' : 'Adjuntar archivo'}
            variant="secondary"
            fullWidth
            onPress={() => filePickerRef.current?.open()}
          />

          {retiro.documentoLiquidacionNombre && !file ? (
            <Button label="Ver documento actual" variant="ghost" onPress={openExisting} />
          ) : null}

          <Button
            label="Guardar documento"
            fullWidth
            loading={saveMutation.isPending}
            onPress={() => saveMutation.mutate()}
            style={styles.saveButton}
          />
        </ScrollView>
        <FilePickerButton ref={filePickerRef} label="Adjuntar boleta o factura" onPicked={setFile} />
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.huge },
  summaryCard: { gap: spacing.xxs, backgroundColor: colors.surfaceAlt },
  sectionTitle: { ...typography.subtitle, marginTop: spacing.sm, marginBottom: spacing.xs },
  pedidoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  saveButton: { marginTop: spacing.md },
});
