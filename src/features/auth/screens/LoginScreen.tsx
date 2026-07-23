import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo, Icon, Input } from '@/components/shared';
import { colors, radii, spacing } from '@/theme';

export function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSession, setKeepSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, spacing.xs),
            paddingBottom: Math.max(insets.bottom, spacing.xs),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainCard}>
          {/* Top Banner Vistoso y Colorido */}
          <View style={styles.headerBanner}>
            <View style={styles.decorativeOrb1} />
            <View style={styles.decorativeOrb2} />

            <View style={styles.badgePill}>
              <Icon name="shield-checkmark" size={13} color="#38BDF8" />
              <Text style={styles.badgePillText}>Panel de Control Seguro</Text>
            </View>

            <View style={styles.logoWrapper}>
              <BrandLogo size={105} variant="full" />
            </View>
          </View>

          {/* Cuerpo Principal del Formulario */}
          <View style={styles.bodyContent}>
            <View style={styles.welcomeGroup}>
              <Text style={styles.welcomeTitle}>¡Bienvenido de nuevo! 👋</Text>
              <Text style={styles.welcomeSubtitle}>
                Inicia sesión para gestionar soporte, mediaciones y finanzas corporativas.
              </Text>
            </View>

            {/* Chips Destacados de Funciones con Colores */}
            <View style={styles.featuresRow}>
              <View style={[styles.featureChip, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <Icon name="headset" size={14} color={colors.brand} />
                <Text style={[styles.featureChipText, { color: colors.brand }]}>Soporte</Text>
              </View>

              <View style={[styles.featureChip, { backgroundColor: '#F5EFFF', borderColor: '#DDD6FE' }]}>
                <Icon name="scale" size={14} color={colors.violet} />
                <Text style={[styles.featureChipText, { color: colors.violet }]}>Mediaciones</Text>
              </View>

              <View style={[styles.featureChip, { backgroundColor: '#EAF8F0', borderColor: '#A7F3D0' }]}>
                <Icon name="wallet" size={14} color={colors.success} />
                <Text style={[styles.featureChipText, { color: colors.success }]}>Finanzas</Text>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Campos de Texto y Acciones */}
            <View style={styles.formGroup}>
              <Input
                label="Correo electrónico"
                placeholder="admin@repuestop.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                leftIcon="mail-outline"
                value={email}
                onChangeText={setEmail}
              />

              <Input
                label="Contraseña"
                placeholder="••••••••"
                secureTextEntry
                leftIcon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
              />

              <Pressable
                style={styles.checkboxRow}
                onPress={() => setKeepSession((prev) => !prev)}
                hitSlop={8}
              >
                <View style={[styles.checkbox, keepSession && styles.checkboxChecked]}>
                  {keepSession ? <Icon name="checkmark" size={12} color={colors.white} /> : null}
                </View>
                <Text style={styles.checkboxLabel}>Mantener sesión iniciada</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.loginBtn,
                  submitting && styles.loginBtnDisabled,
                  pressed && styles.loginBtnPressed,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Icon name="log-in-outline" size={20} color={colors.white} />
                <Text style={styles.loginBtnText}>
                  {submitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Text>
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o continúa con corporativo</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable style={styles.googleBtn} disabled>
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={styles.googleBtnText}>Google Workspace (próximamente)</Text>
              </Pressable>
            </View>

            {/* Footer de Licencia y Estado Encriptado */}
            <View style={styles.securityFooter}>
              <View style={styles.securityBadge}>
                <Icon name="shield-checkmark" size={13} color={colors.success} />
                <Text style={styles.securityText}>Acceso restringido · Conexión Encriptada</Text>
              </View>
              <Text style={styles.copyrightText}>© 2026 RepuesTop Chile · Panel Administrativo</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xs,
  },
  mainCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  headerBanner: {
    backgroundColor: '#0B5EE8',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeOrb1: {
    position: 'absolute',
    top: -40,
    left: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  decorativeOrb2: {
    position: 'absolute',
    bottom: -35,
    right: -25,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E0F2FE',
    letterSpacing: 0.3,
  },
  logoWrapper: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  bodyContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  welcomeGroup: {
    marginBottom: spacing.md,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  featureChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 34,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  featureChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '600',
  },
  formGroup: {
    gap: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xxs,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: radii.xs,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.textLabel,
    fontWeight: '500',
  },
  loginBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    elevation: 3,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderInput,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  googleBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    opacity: 0.7,
  },
  googleIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.white,
  },
  googleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  securityFooter: {
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: 6,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  securityText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  copyrightText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
  },
});

