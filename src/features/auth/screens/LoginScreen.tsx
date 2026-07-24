import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo, Icon, Input } from '@/components/shared';
import { colors, radii, spacing } from '@/theme';

export function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    } catch (err: any) {
      if (err?.response?.data?.message) {
        setError(String(err.response.data.message));
      } else if (err?.response?.data?.mensaje) {
        setError(String(err.response.data.mensaje));
      } else if (err?.response?.status === 403) {
        setError('Acceso denegado por el servidor API (403 Forbidden / CORS). Verifica la URL en .env.development.');
      } else if (err?.response?.status === 401 || err?.response?.status === 400) {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else if (err?.message?.includes('Network Error') || !err?.response) {
        setError('No se pudo conectar con el servidor API. Verifica tu conexión.');
      } else {
        setError('Error al iniciar sesión. Inténtalo nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.screenContainer,
        {
          paddingTop: Math.max(insets.top, spacing.xs),
          paddingBottom: Math.max(insets.bottom, spacing.xs),
          paddingLeft: Math.max(insets.left, spacing.xs),
          paddingRight: Math.max(insets.right, spacing.xs),
        },
      ]}
    >
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.mainCard}>
          {/* Banner Superior Vibrante y Colorido */}
          <View style={styles.headerBanner}>
            <View style={styles.decorativeOrb1} />
            <View style={styles.decorativeOrb2} />
            <View style={styles.decorativeOrb3} />

            <View style={styles.badgePill}>
              <View style={styles.statusDot} />
              <Icon name="shield-checkmark-outline" size={13} color="#38BDF8" />
              <Text style={styles.badgePillText}>SISTEMA DE GESTIÓN MÓVIL</Text>
            </View>

            <View style={styles.logoWrapper}>
              <BrandLogo size={110} variant="full" />
            </View>

            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerWelcomeTitle}>¡Bienvenido de nuevo! 👋</Text>
              <Text style={styles.headerWelcomeSubtitle}>
                Panel Administrativo RepuesTop Chile
              </Text>
            </View>
          </View>

          {/* Cuerpo Principal del Formulario con Estructura Fija de 2 Hijos */}
          <View style={styles.bodyContent}>
            <View style={styles.formWrapper}>
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
                  placeholder="admin@repuestop.cl"
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
                  secureTextEntry={!showPassword}
                  leftIcon="lock-closed-outline"
                  rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onRightIconPress={() => setShowPassword((prev) => !prev)}
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
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Icon name="log-in-outline" size={20} color={colors.white} />
                      <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Footer de Licencia y Encriptación */}
            <View style={styles.securityFooter}>
              <View style={styles.securityBadge}>
                <Icon name="shield-checkmark" size={13} color="#059669" />
                <Text style={styles.securityText}>Acceso restringido · Conexión SSL Encriptada</Text>
              </View>
              <Text style={styles.copyrightText}>© 2026 RepuesTop Chile · Panel Administrativo</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  keyboardView: {
    flex: 1,
  },
  mainCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  headerBanner: {
    backgroundColor: '#0B5EE8',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeOrb1: {
    position: 'absolute',
    top: -50,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  decorativeOrb2: {
    position: 'absolute',
    bottom: -45,
    right: -35,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(56, 189, 248, 0.28)',
  },
  decorativeOrb3: {
    position: 'absolute',
    top: 20,
    right: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(11, 19, 43, 0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  badgePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#E0F2FE',
    letterSpacing: 0.8,
  },
  logoWrapper: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  headerTitleGroup: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  headerWelcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  headerWelcomeSubtitle: {
    fontSize: 13,
    color: '#BFDBFE',
    fontWeight: '500',
  },
  bodyContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    justifyContent: 'space-between',
  },
  formWrapper: {
    width: '100%',
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
    marginBottom: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '600',
  },
  formGroup: {
    gap: spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
    marginBottom: spacing.xs,
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
    marginTop: spacing.xxs,
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
  securityFooter: {
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 6,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  securityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  copyrightText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
  },
});
