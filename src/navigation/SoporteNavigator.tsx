import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AreaGuard } from './AreaGuard';
import { SupportWorkspaceScreen } from '@/features/support/screens/SupportWorkspaceScreen';
import { TicketListScreen } from '@/features/support/screens/TicketListScreen';
import { TicketDetailScreen } from '@/features/support/screens/TicketDetailScreen';
import { QaReportsScreen } from '@/features/support/screens/QaReportsScreen';

const Stack = createNativeStackNavigator();

export function SoporteNavigator() {
  return (
    <AreaGuard area="SOPORTE">
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SoporteWorkspace" component={SupportWorkspaceScreen} />
        <Stack.Screen name="TicketList" component={TicketListScreen} />
        <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
        <Stack.Screen name="QaReports" component={QaReportsScreen} />
      </Stack.Navigator>
    </AreaGuard>
  );
}
