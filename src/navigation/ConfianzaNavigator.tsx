import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AreaGuard } from './AreaGuard';
import { colors } from '@/theme';
import { TrustDashboardScreen } from '@/features/trust-safety/screens/TrustDashboardScreen';
import { SellerListScreen } from '@/features/trust-safety/sellers/SellerListScreen';
import { SellerDetailScreen } from '@/features/trust-safety/sellers/SellerDetailScreen';
import { ValidationListScreen } from '@/features/trust-safety/validations/ValidationListScreen';
import { MediationListScreen } from '@/features/trust-safety/mediations/MediationListScreen';
import { MediationDetailScreen } from '@/features/trust-safety/mediations/MediationDetailScreen';
import { AlertsListScreen } from '@/features/trust-safety/alerts/AlertsListScreen';
import { AuditListScreen } from '@/features/trust-safety/audit/AuditListScreen';
import { ReportsListScreen } from '@/features/trust-safety/reports/ReportsListScreen';

const Drawer = createDrawerNavigator();
const SellersStack = createNativeStackNavigator();
const MediationsStack = createNativeStackNavigator();

function SellersStackNavigator() {
  return (
    <SellersStack.Navigator screenOptions={{ headerShown: false }}>
      <SellersStack.Screen name="SellerList" component={SellerListScreen} />
      <SellersStack.Screen name="SellerDetail" component={SellerDetailScreen} />
    </SellersStack.Navigator>
  );
}

function MediationsStackNavigator() {
  return (
    <MediationsStack.Navigator screenOptions={{ headerShown: false }}>
      <MediationsStack.Screen name="MediationList" component={MediationListScreen} />
      <MediationsStack.Screen name="MediationDetail" component={MediationDetailScreen} />
    </MediationsStack.Navigator>
  );
}

export function ConfianzaNavigator() {
  return (
    <AreaGuard area="MEDIACION_CONFIANZA">
      <Drawer.Navigator
        screenOptions={{
          headerTintColor: colors.textPrimary,
          drawerActiveTintColor: colors.brand,
          drawerActiveBackgroundColor: colors.brandSoft,
        }}
      >
        <Drawer.Screen name="Dashboard" component={TrustDashboardScreen} />
        <Drawer.Screen name="Vendedores" component={SellersStackNavigator} options={{ headerShown: false }} />
        <Drawer.Screen name="Validaciones" component={ValidationListScreen} />
        <Drawer.Screen name="Mediaciones" component={MediationsStackNavigator} options={{ headerShown: false }} />
        <Drawer.Screen name="Alertas" component={AlertsListScreen} />
        <Drawer.Screen name="Bitácora" component={AuditListScreen} />
        <Drawer.Screen name="Reportes" component={ReportsListScreen} />
      </Drawer.Navigator>
    </AreaGuard>
  );
}
