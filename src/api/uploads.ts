import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from './client';
import { getToken } from '@/utils/storage';
import type { PickedFile } from '@/components/shared';

/**
 * Descarga un archivo protegido por JWT (ej. documento de liquidación,
 * adjunto de ticket) a almacenamiento local y ofrece compartirlo/abrirlo.
 * Reemplaza el patrón blob + URL.createObjectURL del backoffice web.
 */
export async function downloadAndShareFile(path: string, fileName: string): Promise<string> {
  const token = await getToken();
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
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
