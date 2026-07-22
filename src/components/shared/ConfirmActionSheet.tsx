import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { colors, radii, spacing, typography } from '@/theme';
import { Button, ButtonVariant } from './Button';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void | Promise<void>;
}

export interface ConfirmActionSheetHandle {
  open: (options: ConfirmOptions) => void;
}

/**
 * Bottom sheet de confirmación reutilizable — reemplaza los `window.confirm()`
 * y modales cortos de confirmación del backoffice web.
 */
export const ConfirmActionSheet = forwardRef<ConfirmActionSheetHandle>((_, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useImperativeHandle(ref, () => ({
    open: (opts: ConfirmOptions) => {
      setOptions(opts);
      sheetRef.current?.present();
    },
  }));

  const snapPoints = useMemo(() => ['35%'], []);

  const handleConfirm = useCallback(async () => {
    if (!options) return;
    try {
      setSubmitting(true);
      await options.onConfirm();
      sheetRef.current?.dismiss();
    } finally {
      setSubmitting(false);
    }
  }, [options]);

  return (
    <BottomSheetModal ref={sheetRef} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={styles.sheetBg}>
      <BottomSheetView style={styles.container}>
        {options ? (
          <>
            <Text style={typography.title}>{options.title}</Text>
            {options.description ? (
              <Text style={[typography.body, styles.description]}>{options.description}</Text>
            ) : null}
            <View style={styles.actions}>
              <Button
                label={options.cancelLabel ?? 'Cancelar'}
                variant="secondary"
                onPress={() => sheetRef.current?.dismiss()}
                style={styles.actionButton}
                disabled={submitting}
              />
              <Button
                label={options.confirmLabel ?? 'Confirmar'}
                variant={options.confirmVariant ?? 'primary'}
                onPress={handleConfirm}
                style={styles.actionButton}
                loading={submitting}
              />
            </View>
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

ConfirmActionSheet.displayName = 'ConfirmActionSheet';

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
  container: { padding: spacing.xl, gap: spacing.sm },
  description: { color: colors.textSecondary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  actionButton: { flex: 1 },
});
