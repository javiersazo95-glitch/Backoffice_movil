import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { AreaGuard } from './AreaGuard';
import { colors } from '@/theme';
import { ResumenScreen } from '@/features/administration/screens/ResumenScreen';
import { PedidosScreen } from '@/features/administration/screens/PedidosScreen';
import { LiquidacionesScreen } from '@/features/administration/screens/LiquidacionesScreen';
import { GastosScreen } from '@/features/administration/screens/GastosScreen';
import { HistorialRetirosScreen } from '@/features/administration/screens/HistorialRetirosScreen';
import { PagosScreen } from '@/features/administration/screens/PagosScreen';
import { CustomDrawerContent } from '@/components/layout/CustomDrawerContent';
import { HeaderHomeButton } from '@/components/layout/HeaderHomeButton';

const Drawer = createDrawerNavigator();

export function AdministracionNavigator() {
  return (
    <AreaGuard area="ADMINISTRACION_CONTABLE">
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} areaTitle="Administración Contable" />}
        screenOptions={{
          headerTintColor: colors.textPrimary,
          drawerActiveTintColor: colors.brand,
          drawerActiveBackgroundColor: colors.brandSoft,
          headerRight: () => <HeaderHomeButton />,
        }}
      >
        <Drawer.Screen name="Resumen" component={ResumenScreen} />
        <Drawer.Screen name="Pedidos" component={PedidosScreen} />
        <Drawer.Screen name="Liquidaciones" component={LiquidacionesScreen} />
        <Drawer.Screen name="Gastos" component={GastosScreen} />
        <Drawer.Screen name="Historial de Retiros" component={HistorialRetirosScreen} />
        <Drawer.Screen name="Pago a proveedores" component={PagosScreen} />
      </Drawer.Navigator>
    </AreaGuard>
  );
}
