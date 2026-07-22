import axios from 'axios';
import type { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import { getToken } from '@/utils/storage';

/** Puerto de client.ts del backoffice web — misma normalización de la base URL. */
export const normalizeApiBaseUrl = (baseUrl?: string) => {
  const trimmedBaseUrl = baseUrl?.trim().replace(/\/+$/, '');

  if (!trimmedBaseUrl) {
    return 'http://localhost:8080/api/v1';
  }

  return trimmedBaseUrl.endsWith('/api/v1')
    ? trimmedBaseUrl
    : trimmedBaseUrl.endsWith('/api')
      ? `${trimmedBaseUrl}/v1`
      : `${trimmedBaseUrl}/api/v1`;
};

const configuredApiUrl =
  process.env.EXPO_PUBLIC_API_URL ?? (Constants.expoConfig?.extra?.apiUrl as string | undefined);

export const API_BASE_URL = normalizeApiBaseUrl(configuredApiUrl);

const getApiOrigin = () => API_BASE_URL.replace(/\/api\/v1$/i, '');

/** Resuelve URLs relativas de imágenes/documentos (perfiles, uploads R2) contra el origin de la API. */
export const resolveProfileImageUrl = (
  ...candidates: Array<string | null | undefined>
): string | null => {
  const rawUrl = candidates
    .find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0)
    ?.trim();
  if (!rawUrl) return null;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (/^(data|blob):/i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith('//')) return `https:${rawUrl}`;

  const apiOrigin = getApiOrigin();
  if (!apiOrigin) return rawUrl;

  if (rawUrl.startsWith('/')) return `${apiOrigin}${rawUrl}`;
  if (rawUrl.startsWith('api/')) return `${apiOrigin}/${rawUrl}`;
  if (rawUrl.startsWith('uploads/')) return `${apiOrigin}/api/v1/${rawUrl}`;

  return `${apiOrigin}/api/v1/uploads/r2/${rawUrl.replace(/^\/+/, '')}`;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
