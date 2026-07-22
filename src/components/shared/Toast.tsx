import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography, shadows } from '@/theme';

type ToastTone = 'default' | 'success' | 'error';
interface ToastMessage {
  id: number;
  text: string;
  tone: ToastTone;
}

type Listener = (message: ToastMessage) => void;
let listener: Listener | null = null;
let nextId = 0;

/** API global equivalente a showToast() del backoffice web. */
export function showToast(text: string, tone: ToastTone = 'default') {
  listener?.({ id: ++nextId, text, tone });
}

/** Se monta una única vez en la raíz de la app (App.tsx). */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    listener = (next) => {
      setMessage(next);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setMessage(null);
      });
    };
    return () => {
      listener = null;
    };
  }, [opacity]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrapper, { bottom: insets.bottom + spacing.xxl, opacity }]}
    >
      <Animated.View style={[styles.toast, toneStyles[message.tone]]}>
        <Text style={styles.text}>{message.text}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: {
    maxWidth: '90%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.navy,
    ...shadows.raised,
  },
  text: { ...typography.body, color: colors.white, textAlign: 'center' },
});

const toneStyles = StyleSheet.create({
  default: {},
  success: { backgroundColor: colors.success },
  error: { backgroundColor: colors.danger },
});
