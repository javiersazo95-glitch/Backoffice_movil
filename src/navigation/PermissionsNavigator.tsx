import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PermissionsHomeScreen } from '@/features/permissions/screens/PermissionsHomeScreen';
import { SuperAdminGuard } from './SuperAdminGuard';

const Stack = createNativeStackNavigator();

export function PermissionsNavigator() {
  return (
    <SuperAdminGuard>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PermissionsHome" component={PermissionsHomeScreen} />
      </Stack.Navigator>
    </SuperAdminGuard>
  );
}
