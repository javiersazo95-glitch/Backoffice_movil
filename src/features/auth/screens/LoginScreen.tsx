import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo, Button, Icon, Input } from '@/components/shared';
import { colors, radii, spacing, typography } from '@/theme';

export function LoginScreen() {
  const { login } = useAuth();
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
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <View style={styles.brandGroup}>
          <BrandLogo size={120} variant="full" />
        </View>

        <Text style={styles.welcomeTitle}>Bienvenido de nuevo</Text>
        <Text style={styles.welcomeSubtitle}>Inicia sesión para acceder al panel de administración</Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

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

          <Button
            label="Iniciar sesión"
            onPress={handleSubmit}
            loading={submitting}
            fullWidth
            style={styles.loginBtn}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label="Google (próximamente)"
            variant="secondary"
            disabled
            fullWidth
            onPress={() => {}}
            style={styles.googleBtn}
          />
        </View>
      </View>

      <Text style={styles.footer}>© 2026 RepuesTop · Panel Administrativo</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: colors.bgLogin,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderInput,
  },
  brandGroup: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  brandHighlight: {
    color: colors.brand,
  },
  welcomeTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: spacing.xl,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 12.5,
    color: '#DC2626',
  },
  formGroup: {
    gap: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
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
  },
  loginBtn: {
    height: 46,
    borderRadius: radii.sm,
    backgroundColor: colors.brand,
    marginTop: spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderInput,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  googleBtn: {
    height: 44,
    borderRadius: radii.sm,
    borderColor: colors.borderInput,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: spacing.xl,
  },
});
