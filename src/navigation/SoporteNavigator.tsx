import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AreaGuard } from './AreaGuard';
import { colors } from '@/theme';
import { SupportWorkspaceScreen } from '@/features/support/screens/SupportWorkspaceScreen';
import { TicketListScreen } from '@/features/support/screens/TicketListScreen';
import { TicketDetailScreen } from '@/features/support/screens/TicketDetailScreen';
import { QaReportsScreen } from '@/features/support/screens/QaReportsScreen';
import { CustomDrawerContent } from '@/components/layout/CustomDrawerContent';
import { HeaderHomeButton } from '@/components/layout/HeaderHomeButton';

const Drawer = createDrawerNavigator();
const TicketsStack = createNativeStackNavigator();

function TicketsStackNavigator() {
  return (
    <TicketsStack.Navigator screenOptions={{ headerShown: false }}>
      <TicketsStack.Screen name="TicketListScreen" component={TicketListScreen} />
      <TicketsStack.Screen name="TicketDetail" component={TicketDetailScreen} />
    </TicketsStack.Navigator>
  );
}

export function SoporteNavigator() {
  return (
    <AreaGuard area="SOPORTE">
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} areaTitle="Soporte Técnico" />}
        screenOptions={{
          headerTintColor: colors.textPrimary,
          drawerActiveTintColor: colors.brand,
          drawerActiveBackgroundColor: colors.brandSoft,
          headerRight: () => <HeaderHomeButton />,
        }}
      >
        <Drawer.Screen name="SoporteWorkspace" component={SupportWorkspaceScreen} options={{ title: 'Mesa de Soporte' }} />
        <Drawer.Screen name="TicketList" component={TicketsStackNavigator} options={{ title: 'Bandeja de Tickets', headerShown: false }} />
        <Drawer.Screen name="QaReports" component={QaReportsScreen} options={{ title: 'Reportes QA' }} />
      </Drawer.Navigator>
    </AreaGuard>
  );
}
