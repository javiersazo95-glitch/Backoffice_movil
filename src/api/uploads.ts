import { Platform, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import apiClient, { API_BASE_URL } from './client';
import { getToken } from '@/utils/storage';
import type { PickedFile } from '@/components/shared';

/**
 * Descarga un archivo protegido por JWT (ej. documento de liquidación,
 * adjunto de ticket) enviando la cabecera de autenticación Authorization: Bearer <token>.
 */
export async function downloadAndShareFile(path: string, fileName: string): Promise<string> {
  const token = await getToken();

  if (Platform.OS === 'web') {
    try {
      // En Web realizamos la petición a través de apiClient para enviar la cabecera Authorization JWT
      const response = await apiClient.get<Blob>(path, {
        responseType: 'blob',
      });
      const contentType = (response.headers as Record<string, string>)['content-type'] || 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      return blobUrl;
    } catch {
      // Fallback si es una URL externa directa (http...)
      const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
      if (typeof window !== 'undefined') {
        window.open(url, '_blank');
      } else {
        await Linking.openURL(url);
      }
      return url;
    }
  }

  // Comportamiento Nativo Móvil (iOS / Android)
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const destination = `${FileSystem.cacheDirectory}${fileName}`;

  const result = await FileSystem.downloadAsync(url, destination, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri);
  }

  return result.uri;
}

/** Helper para construir el campo de FormData de un archivo elegido en el dispositivo. */
export function toFormDataFile(file: PickedFile) {
  return { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob;
}
