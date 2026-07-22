import React, { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface ScreenContainerProps {
  children: ReactNode;
  edges?: Edge[];
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  keyboardAvoiding?: boolean;
}

/**
 * Contenedor base de pantalla: safe-area + fondo consistente + opcionalmente
 * scroll y KeyboardAvoidingView (formularios) + padding estándar.
 */
export function ScreenContainer({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  padded = true,
  scroll = false,
  style,
  keyboardAvoiding = false,
}: ScreenContainerProps) {
  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, padded && styles.padded, style]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, padded && styles.padded, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'flex-start' },
  padded: { paddingHorizontal: spacing.lg },
});
