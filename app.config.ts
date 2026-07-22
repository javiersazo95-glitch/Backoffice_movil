import type { ExpoConfig, ConfigContext } from 'expo/config';
import 'dotenv/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Repuestop Backoffice',
  slug: 'backoffice-movil',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'repuestop-backoffice',
  ios: {
    supportsTablet: true,
  },
  android: {
    package: 'cl.repuestop.backoffice',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#F5F6F8',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: ['CAMERA', 'READ_MEDIA_IMAGES', 'READ_EXTERNAL_STORAGE'],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-secure-store',
    'expo-sharing',
    [
      'expo-image-picker',
      {
        photosPermission: 'Repuestop Backoffice necesita acceso a tus fotos para adjuntar imágenes.',
        cameraPermission: 'Repuestop Backoffice necesita acceso a la cámara para tomar fotos de evidencia.',
      },
    ],
    'expo-document-picker',
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      projectId: undefined,
    },
  },
});
