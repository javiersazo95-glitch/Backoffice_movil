import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, toneColors, typography } from '@/theme';
import { Button } from './Button';
import { Icon } from './Icon';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  value?: string;
  onChange?: (value: string | undefined) => void;
}

export interface FilterSheetHandle {
  open: () => void;
  close: () => void;
}

interface FilterSheetProps {
  groups: FilterGroup[];
  onApply?: (selected: Record<string, string | undefined>) => void;
  onClear?: () => void;
}

/** Componente modal de filtros 100% compatible con iOS, Android y Web con respetando insets de área segura */
export const FilterSheet = forwardRef<FilterSheetHandle, FilterSheetProps>(
  ({ groups, onApply, onClear }, ref) => {
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(false);
    const [drafts, setDrafts] = useState<Record<string, string | undefined>>({});

    useImperativeHandle(ref, () => ({
      open: () => {
        const initialDrafts: Record<string, string | undefined> = {};
        groups.forEach((g) => {
          initialDrafts[g.key] = g.value;
        });
        setDrafts(initialDrafts);
        setVisible(true);
      },
      close: () => setVisible(false),
    }));

    const handleChipPress = (groupKey: string, optionValue: string) => {
      setDrafts((prev) => {
        const current = prev[groupKey];
        const next = current === optionValue ? undefined : optionValue;
        return { ...prev, [groupKey]: next };
      });
    };

    const bottomPadding = Math.max(insets.bottom, spacing.md) + spacing.md;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <View style={[styles.sheetContainer, { paddingBottom: bottomPadding }]}>
            <View style={styles.header}>
              <View style={styles.dragHandle} />
              <View style={styles.headerRow}>
                <Text style={typography.title}>Filtros</Text>
                <Pressable onPress={() => setVisible(false)} hitSlop={12}>
                  <Icon name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              {groups.map((group) => {
                const selectedVal = drafts[group.key];
                return (
                  <View key={group.key} style={styles.group}>
                    <Text style={styles.groupLabel}>{group.label}</Text>
                    <View style={styles.chips}>
                      {group.options.map((option) => {
                        const active = selectedVal === option.value;
                        return (
                          <Pressable
                            key={option.value}
                            onPress={() => handleChipPress(group.key, option.value)}
                            style={[styles.chip, active && styles.chipActive]}
                          >
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.actions}>
              <Button
                label="Limpiar"
                variant="secondary"
                style={styles.actionButton}
                onPress={() => {
                  const cleared: Record<string, string | undefined> = {};
                  groups.forEach((g) => {
                    cleared[g.key] = undefined;
                    g.onChange?.(undefined);
                  });
                  setDrafts(cleared);
                  onClear?.();
                  setVisible(false);
                }}
              />
              <Button
                label="Aplicar"
                variant="primary"
                style={styles.actionButton}
                onPress={() => {
                  groups.forEach((g) => {
                    g.onChange?.(drafts[g.key]);
                  });
                  onApply?.(drafts);
                  setVisible(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

FilterSheet.displayName = 'FilterSheet';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingVertical: spacing.sm,
    gap: spacing.lg,
  },
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'none',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: toneColors.brand.bg,
    borderColor: colors.brand,
  },
  chipText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textTransform: 'none',
  },
  chipTextActive: {
    color: colors.brand,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  actionButton: {
    flex: 1,
  },
});
