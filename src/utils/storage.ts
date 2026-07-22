import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'repuestop.backoffice.access-token';

/**
 * expo-secure-store no tiene implementación web (usa el Keystore nativo de
 * Android/iOS). En web se usa localStorage solo para poder previsualizar la
 * app en el navegador durante desarrollo; el APK real de Android siempre usa
 * SecureStore cifrado.
 */
export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
