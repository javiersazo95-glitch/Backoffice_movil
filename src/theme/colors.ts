/**
 * Paleta alineada a la identidad de marca del backoffice web (--blue, --nav, etc.
 * en styles.css) pero reorganizada como design system propio para móvil.
 */
export const colors = {
  // Marca
  brand: '#0B5EE8',
  brandDark: '#064FC8',
  brandSoft: '#F3F8FF',
  navy: '#0C1D31',
  navyDeep: '#0E2235',

  // Neutros / superficies
  bg: '#F8FAFC',
  bgLogin: '#EDEFF3',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#E3EAF4',
  borderInput: '#E2E8F0',
  borderSoft: '#EDF2F7',
  overlay: 'rgba(13, 33, 54, 0.48)',

  // Texto
  textPrimary: '#0F1B2D',
  textSecondary: '#5B6B84',
  textTertiary: '#94A3B8',
  textLabel: '#374151',
  textInverse: '#FFFFFF',

  // Semántico / estados
  success: '#159447',
  successSoft: '#E7F7EC',
  warning: '#AD6A00',
  warningSoft: '#FFF3DC',
  danger: '#D92D20',
  dangerSoft: '#FFE8E6',
  info: '#0B5EE8',
  infoSoft: '#F3F8FF',
  infoBannerBg: '#F0F9FF',
  infoBannerBorder: '#BAE6FD',
  infoBannerText: '#0369A1',
  violet: '#6F35C8',
  violetSoft: '#EFE7FF',

  // Utilidad
  transparent: 'transparent',
  black: '#000000',
  white: '#FFFFFF',
} as const;

export type StatusTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'neutral';

export const toneColors: Record<StatusTone, { fg: string; bg: string }> = {
  brand: { fg: colors.brand, bg: colors.brandSoft },
  success: { fg: colors.success, bg: colors.successSoft },
  warning: { fg: colors.warning, bg: colors.warningSoft },
  danger: { fg: colors.danger, bg: colors.dangerSoft },
  info: { fg: colors.info, bg: colors.infoSoft },
  violet: { fg: colors.violet, bg: colors.violetSoft },
  neutral: { fg: colors.textSecondary, bg: colors.borderSoft },
};
