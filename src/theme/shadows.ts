import { Platform } from 'react-native';

/** Sombras sutiles consistentes (elevación baja, propias de un panel administrativo). */
export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#0D2136',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    android: { elevation: 2 },
    default: {},
  }),
  raised: Platform.select({
    ios: {
      shadowColor: '#0D2136',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;
