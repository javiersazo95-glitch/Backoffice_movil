import React from 'react';
import { Pressable } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AreaGuard } from './AreaGuard';
import { colors } from '@/theme';
import { Icon } from '@/components/shared';
import { TrustDashboardScreen } from '@/features/trust-safety/screens/TrustDashboardScreen';
import { SellerListScreen } from '@/features/trust-safety/sellers/SellerListScreen';
import { SellerDetailScreen } from '@/features/trust-safety/sellers/SellerDetailScreen';
import { ValidationListScreen } from '@/features/trust-safety/validations/ValidationListScreen';
import { MediationListScreen } from '@/features/trust-safety/mediations/MediationListScreen';
import { MediationDetailScreen } from '@/features/trust-safety/mediations/MediationDetailScreen';
import { ReportsListScreen } from '@/features/trust-safety/reports/ReportsListScreen';
import { CustomDrawerContent } from '@/components/layout/CustomDrawerContent';
import { HeaderHomeButton } from '@/components/layout/HeaderHomeButton';

const Drawer = createDrawerNavigator();
const SellersStack = createNativeStackNavigator();
const MediationsStack = createNativeStackNavigator();

function SellersStackNavigator() {
  return (
    <SellersStack.Navigator
      screenOptions={{
        headerTintColor: colors.textPrimary,
        headerRight: () => <HeaderHomeButton />,
      }}
    >
      <SellersStack.Screen
        name="SellerList"
        component={SellerListScreen}
        options={({ navigation }) => ({
          title: 'Directorio de Vendedores',
          headerLeft: () => (
            <Pressable onPress={() => (navigation as any).openDrawer()} style={{ paddingRight: 12 }}>
              <Icon name="menu" size={24} color={colors.textPrimary} />
            </Pressable>
          ),
        })}
      />
      <SellersStack.Screen
        name="SellerDetail"
        component={SellerDetailScreen}
        options={{ title: 'Detalle del Vendedor' }}
      />
    </SellersStack.Navigator>
  );
}

function MediationsStackNavigator() {
  return (
    <MediationsStack.Navigator
      screenOptions={{
        headerTintColor: colors.textPrimary,
        headerRight: () => <HeaderHomeButton />,
      }}
    >
      <MediationsStack.Screen
        name="MediationList"
        component={MediationListScreen}
        options={({ navigation }) => ({
          title: 'Gestión de Mediaciones',
          headerLeft: () => (
            <Pressable onPress={() => (navigation as any).openDrawer()} style={{ paddingRight: 12 }}>
              <Icon name="menu" size={24} color={colors.textPrimary} />
            </Pressable>
          ),
        })}
      />
      <MediationsStack.Screen
        name="MediationDetail"
        component={MediationDetailScreen}
        options={{ title: 'Detalle de Mediación' }}
      />
    </MediationsStack.Navigator>
  );
}

export function ConfianzaNavigator() {
  return (
    <AreaGuard area="MEDIACION_CONFIANZA">
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} areaTitle="Confianza y Mediación" />}
        screenOptions={{
          headerTintColor: colors.textPrimary,
          drawerActiveTintColor: colors.brand,
          drawerActiveBackgroundColor: colors.brandSoft,
          headerRight: () => <HeaderHomeButton />,
        }}
      >
        <Drawer.Screen name="Dashboard" component={TrustDashboardScreen} options={{ title: 'Resumen Confianza' }} />
        <Drawer.Screen name="Vendedores" component={SellersStackNavigator} options={{ title: 'Vendedores', headerShown: false }} />
        <Drawer.Screen name="Validaciones" component={ValidationListScreen} options={{ title: 'Validaciones de Vendedores' }} />
        <Drawer.Screen name="Mediaciones" component={MediationsStackNavigator} options={{ title: 'Mediaciones', headerShown: false }} />
        <Drawer.Screen name="Reportes" component={ReportsListScreen} options={{ title: 'Alertas y Reportes' }} />
      </Drawer.Navigator>
    </AreaGuard>
  );
}
