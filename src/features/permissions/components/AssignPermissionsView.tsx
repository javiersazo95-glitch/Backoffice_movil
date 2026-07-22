import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as permissionsApi from '@/api/permissions';
import type { BackofficeArea, BackofficePermission, BackofficePermissionSlot } from '@/types/auth';
import { Button, Card, Icon, Input, showToast } from '@/components/shared';
import { colors, spacing, toneColors, typography, StatusTone } from '@/theme';

const AREA_LABELS: Record<BackofficeArea, string> = {
  ADMINISTRACION_CONTABLE: 'Administración Contable',
  SOPORTE: 'Soporte',
  MEDIACION_CONFIANZA: 'Confianza y Mediación',
};

const SLOT_LABELS: Record<BackofficePermissionSlot, string> = {
  OPERADOR: 'Operador',
  QA: 'QA',
};

const PERMISSION_GROUPS: Array<{ area: BackofficeArea; icon: 'wallet-outline' | 'headset-outline' | 'scale-outline'; tone: StatusTone; slots: BackofficePermissionSlot[] }> = [
  { area: 'ADMINISTRACION_CONTABLE', icon: 'wallet-outline', tone: 'success', slots: ['OPERADOR'] },
  { area: 'SOPORTE', icon: 'headset-outline', tone: 'info', slots: ['OPERADOR', 'QA'] },
  { area: 'MEDIACION_CONFIANZA', icon: 'scale-outline', tone: 'violet', slots: ['OPERADOR'] },
];

function hasPermission(permissions: BackofficePermission[], area: BackofficeArea, slot: BackofficePermissionSlot) {
  return permissions.some((permission) => permission.area === area && permission.slot === slot);
}

function togglePermission(permissions: BackofficePermission[], area: BackofficeArea, slot: BackofficePermissionSlot) {
  const exists = hasPermission(permissions, area, slot);
  if (exists) {
    return permissions.filter((permission) => !(permission.area === area && permission.slot === slot));
  }
  const withoutConflicts = area === 'SOPORTE' ? permissions.filter((permission) => permission.area !== 'SOPORTE') : permissions;
  return [...withoutConflicts, { area, slot }];
}

function permissionText(permissions: BackofficePermission[]) {
  if (permissions.length === 0) return 'Sin permisos';
  return permissions.map((permission) => `${AREA_LABELS[permission.area]} · ${SLOT_LABELS[permission.slot]}`).join(', ');
}

export function AssignPermissionsView() {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<permissionsApi.PermissionUser | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<BackofficePermission[]>([]);

  const { data: suggestions = [] } = useQuery({
    queryKey: ['permission-user-search', searchEmail],
    queryFn: () => permissionsApi.searchUsers(searchEmail),
    enabled: searchEmail.trim().length >= 2 && !selectedUser,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!selectedUser) throw new Error('Selecciona un usuario');
      return permissionsApi.updateUserPermissions(selectedUser.id, draftPermissions);
    },
    onSuccess: (updatedUser) => {
      setSelectedUser(updatedUser);
      setDraftPermissions(updatedUser.permissions ?? []);
      queryClient.invalidateQueries({ queryKey: ['permission-users'] });
      showToast('Permisos guardados correctamente', 'success');
    },
    onError: () => showToast('No se pudieron guardar los permisos', 'error'),
  });

  const selectedSummary = useMemo(
    () => (selectedUser ? permissionText(draftPermissions) : 'Selecciona un correo para editar permisos'),
    [draftPermissions, selectedUser],
  );

  const selectUser = (user: permissionsApi.PermissionUser) => {
    setSelectedUser(user);
    setSearchEmail(user.email);
    setDraftPermissions(user.permissions ?? []);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={typography.subtitle}>Asignación por correo</Text>
      <Text style={styles.description}>Busca un usuario registrado y activa las ranuras permitidas para cada área.</Text>

      <Input
        placeholder="Buscar correo registrado…"
        value={searchEmail}
        onChangeText={(text) => {
          setSearchEmail(text);
          setSelectedUser(null);
          setDraftPermissions([]);
        }}
        autoCapitalize="none"
      />

      {!selectedUser && suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map((user) => (
            <Card key={user.id} onPress={() => selectUser(user)} style={styles.suggestionCard}>
              <Text style={typography.body}>{user.email}</Text>
              <Text style={typography.bodySm}>{user.fullName}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      <Card style={styles.summaryCard}>
        <Text style={typography.subtitle}>{selectedUser?.email ?? 'Sin usuario seleccionado'}</Text>
        <Text style={[typography.bodySm, styles.summaryText]}>{selectedSummary}</Text>
      </Card>

      {PERMISSION_GROUPS.map((group) => {
        const palette = toneColors[group.tone];
        return (
          <Card key={group.area} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupIcon, { backgroundColor: palette.bg }]}>
                <Icon name={group.icon} size={18} color={palette.fg} />
              </View>
              <Text style={typography.subtitle}>{AREA_LABELS[group.area]}</Text>
            </View>
            {group.slots.map((slot) => (
              <View key={slot} style={styles.slotRow}>
                <Text style={typography.body}>{SLOT_LABELS[slot]}</Text>
                <Switch
                  disabled={!selectedUser}
                  value={hasPermission(draftPermissions, group.area, slot)}
                  onValueChange={() => setDraftPermissions((current) => togglePermission(current, group.area, slot))}
                  trackColor={{ true: colors.brand, false: colors.border }}
                />
              </View>
            ))}
          </Card>
        );
      })}

      <View style={styles.actions}>
        <Button
          label="Revertir"
          variant="secondary"
          style={styles.actionButton}
          disabled={!selectedUser}
          onPress={() => selectedUser && setDraftPermissions(selectedUser.permissions ?? [])}
        />
        <Button
          label="Guardar permisos"
          style={styles.actionButton}
          disabled={!selectedUser}
          loading={saveMutation.isPending}
          onPress={() => saveMutation.mutate()}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, paddingBottom: spacing.huge },
  description: { ...typography.body, color: colors.textSecondary },
  suggestions: { gap: spacing.sm },
  suggestionCard: { gap: spacing.xxs },
  summaryCard: { gap: spacing.xxs, backgroundColor: colors.surfaceAlt },
  summaryText: { textTransform: 'none' },
  groupCard: { gap: spacing.md },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  groupIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  slotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: spacing.xxxl + spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  actionButton: { flex: 1 },
});
