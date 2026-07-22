import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer, SegmentedTabs } from '@/components/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { spacing } from '@/theme';
import { AssignPermissionsView } from '../components/AssignPermissionsView';
import { UsersListView } from '../components/UsersListView';
import { FoundersView } from '../components/FoundersView';

import { HeaderHomeButton } from '@/components/layout/HeaderHomeButton';

type Tab = 'permisos' | 'usuarios' | 'fundador';

export function PermissionsHomeScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState<Tab>('permisos');

  return (
    <ScreenContainer padded={false}>
      <AppHeader
        title="Gestión de Permisos"
        onBack={() => navigation.goBack()}
        right={<HeaderHomeButton />}
      />
      <View style={styles.body}>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'permisos', label: 'Permisos' },
            { value: 'usuarios', label: 'Usuarios' },
            { value: 'fundador', label: 'Fundador' },
          ]}
        />
        <View style={styles.content}>
          {tab === 'permisos' ? <AssignPermissionsView /> : null}
          {tab === 'usuarios' ? <UsersListView /> : null}
          {tab === 'fundador' ? <FoundersView /> : null}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg },
  content: { flex: 1 },
});
