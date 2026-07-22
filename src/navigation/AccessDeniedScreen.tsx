import React from 'react';
import { ScreenContainer, EmptyState, Icon, Button } from '@/components/shared';
import { colors } from '@/theme';
import { useNavigation } from '@react-navigation/native';

export function AccessDeniedScreen() {
  const navigation = useNavigation();

  return (
    <ScreenContainer>
      <EmptyState
        title="Sin acceso"
        description="No tienes permisos para ver esta sección. Solicítalo a tu administrador."
        icon={<Icon name="lock-closed-outline" size={40} color={colors.textTertiary} />}
        action={<Button label="Volver" variant="secondary" onPress={() => navigation.goBack()} />}
      />
    </ScreenContainer>
  );
}
