import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Icon } from '@/components/shared';
import { colors, radii, spacing, typography } from '@/theme';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <View style={styles.brand}>
        <View style={styles.logoWrap}>
          <Icon name="shield-checkmark" size={30} color={colors.brand} />
        </View>
        <Text style={styles.title}>RepuesTop Backoffice</Text>
        <Text style={styles.subtitle}>Accede para gestionar la operación desde tu celular.</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Correo electrónico"
          placeholder="nombre@repuestop.cl"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Contraseña"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Iniciar sesión" onPress={handleSubmit} loading={submitting} fullWidth />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          label="Continuar con Google (próximamente)"
          variant="secondary"
          disabled
          fullWidth
          onPress={() => {}}
        />
      </View>

      <Text style={styles.footer}>© {new Date().getFullYear()} RepuesTop. Todos los derechos reservados.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: colors.bg, padding: spacing.xl, justifyContent: 'center', gap: spacing.xxxl },
  brand: { alignItems: 'center', gap: spacing.sm },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.title, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  form: { gap: spacing.sm },
  error: { ...typography.bodySm, color: colors.danger, textTransform: 'none', marginBottom: spacing.sm },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.caption, textTransform: 'none' },
  footer: { ...typography.caption, textAlign: 'center', textTransform: 'none' },
});
