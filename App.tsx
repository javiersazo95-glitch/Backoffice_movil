import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AuthProvider } from '@/context/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ToastHost } from '@/components/shared';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // El mismo backend es consumido por la web y la app móvil: se prefiere
      // refrescar al enfocar la pantalla para reflejar cambios hechos desde
      // el otro cliente.
      staleTime: 15_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <AuthProvider>
              <NavigationContainer>
                <StatusBar style="dark" />
                <RootNavigator />
                <ToastHost />
              </NavigationContainer>
            </AuthProvider>
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
