import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors, radii, spacing, toneColors, typography } from '@/theme';
import { Button } from './Button';
import { Pressable } from 'react-native';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
}

export interface FilterSheetHandle {
  open: () => void;
  close: () => void;
}

interface FilterSheetProps {
  groups: FilterGroup[];
  onApply?: () => void;
  onClear?: () => void;
}

/** Bottom sheet de filtros — reemplaza los selects inline de columna de las tablas web. */
export const FilterSheet = forwardRef<FilterSheetHandle, FilterSheetProps>(
  ({ groups, onApply, onClear }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.present(),
      close: () => sheetRef.current?.dismiss(),
    }));

    const snapPoints = useMemo(() => ['60%', '90%'], []);

    return (
      <BottomSheetModal ref={sheetRef} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={styles.sheetBg}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={typography.title}>Filtros</Text>
          {groups.map((group) => (
            <View key={group.key} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <View style={styles.chips}>
                {group.options.map((option) => {
                  const active = group.value === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => group.onChange(active ? undefined : option.value)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={styles.actions}>
            <Button
              label="Limpiar"
              variant="secondary"
              style={styles.actionButton}
              onPress={() => {
                onClear?.();
              }}
            />
            <Button
              label="Aplicar"
              variant="primary"
              style={styles.actionButton}
              onPress={() => {
                onApply?.();
                sheetRef.current?.dismiss();
              }}
            />
          </View>
        </ScrollView>
      </BottomSheetModal>
    );
  },
);

FilterSheet.displayName = 'FilterSheet';

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
  container: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.huge },
  group: { gap: spacing.sm },
  groupLabel: { ...typography.bodySm, fontWeight: '600', textTransform: 'none' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: toneColors.brand.bg, borderColor: colors.brand },
  chipText: { ...typography.bodySm, textTransform: 'none' },
  chipTextActive: { color: colors.brandDark, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  actionButton: { flex: 1 },
});
