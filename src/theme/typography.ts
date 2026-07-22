import { TextStyle } from 'react-native';
import { colors } from './colors';

type TypographyVariant = TextStyle & { color: string };

export const typography: Record<
  | 'displaySm'
  | 'title'
  | 'subtitle'
  | 'bodyLg'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'overline'
  | 'button',
  TypographyVariant
> = {
  displaySm: { fontSize: 26, fontWeight: '700', lineHeight: 32, color: colors.textPrimary },
  title: { fontSize: 20, fontWeight: '700', lineHeight: 26, color: colors.textPrimary },
  subtitle: { fontSize: 16, fontWeight: '600', lineHeight: 22, color: colors.textPrimary },
  bodyLg: { fontSize: 16, fontWeight: '400', lineHeight: 22, color: colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 20, color: colors.textPrimary },
  bodySm: { fontSize: 13, fontWeight: '400', lineHeight: 18, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16, color: colors.textTertiary },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: 0.6,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  button: { fontSize: 15, fontWeight: '600', lineHeight: 20, color: colors.textInverse },
};
