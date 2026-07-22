import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { AreaSelectorScreen } from '@/features/area-selector/screens/AreaSelectorScreen';
import { PermissionsNavigator } from './PermissionsNavigator';
import { AdministracionNavigator } from './AdministracionNavigator';
import { SoporteNavigator } from './SoporteNavigator';
import { ConfianzaNavigator } from './ConfianzaNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Gating de autenticación a nivel raíz: si no hay sesión, el único stack
 * disponible es Login (equivalente a RequireAuth + <Navigate to="/login">
 * del backoffice web). El resto de guards (SuperAdmin/Area) se aplican
 * dentro de cada navigator anidado como defensa adicional.
 */
export function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Group>
          <Stack.Screen name="AreaSelector" component={AreaSelectorScreen} />
          <Stack.Screen name="Permissions" component={PermissionsNavigator} />
          <Stack.Screen name="Administracion" component={AdministracionNavigator} />
          <Stack.Screen name="Soporte" component={SoporteNavigator} />
          <Stack.Screen name="Confianza" component={ConfianzaNavigator} />
        </Stack.Group>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
