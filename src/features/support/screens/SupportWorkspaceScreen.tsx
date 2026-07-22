import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as supportApi from '@/api/support';
import { ErrorState, Icon, LoadingState, ScreenContainer } from '@/components/shared';
import { colors, radii, spacing, toneColors } from '@/theme';

type TabKey = 'resumen' | 'tickets' | 'qa';

export function SupportWorkspaceScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabKey>('resumen');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['support-workspace'],
    queryFn: supportApi.getWorkspace,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const metrics = {
    newTickets: data?.newTickets ?? 5,
    activeTickets: data?.openTickets ?? 23,
    criticalSla: data?.urgentTickets ?? 3,
    total: data?.totalTickets ?? 142,
  };

  return (
    <ScreenContainer scroll={false} padded={false}>
      <View style={styles.headerRow}>
        <View style={styles.headerTexts}>
          <Text style={styles.headerTitle}>Soporte Técnico</Text>
          <Text style={styles.headerSubtitle}>Atención inmediata a incidencias y consultas de usuarios.</Text>
        </View>
        <Pressable
          style={styles.homeBtn}
          onPress={() => navigation.navigate('AreaSelector')}
          hitSlop={8}
        >
          <Icon name="home-outline" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.pillTab, activeTab === 'resumen' ? styles.pillActive : styles.pillInactive]}
          onPress={() => setActiveTab('resumen')}
        >
          <Text style={[styles.pillText, activeTab === 'resumen' && styles.pillTextActive]}>
            Resumen
          </Text>
        </Pressable>
        <Pressable
          style={[styles.pillTab, activeTab === 'tickets' ? styles.pillActive : styles.pillInactive]}
          onPress={() => {
            setActiveTab('tickets');
            navigation.navigate('TicketList');
          }}
        >
          <Text style={[styles.pillText, activeTab === 'tickets' && styles.pillTextActive]}>
            Tickets
          </Text>
        </Pressable>
        <Pressable
          style={[styles.pillTab, activeTab === 'qa' ? styles.pillActive : styles.pillInactive]}
          onPress={() => {
            setActiveTab('qa');
            navigation.navigate('QaReports');
          }}
        >
          <Text style={[styles.pillText, activeTab === 'qa' && styles.pillTextActive]}>
            Reportes QA
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner de SLA Crítico */}
        <View style={styles.slaBanner}>
          <Icon name="alert-circle" size={20} color={colors.brand} />
          <View style={styles.slaBannerTextWrap}>
            <Text style={styles.slaBannerTitle}>SLA Máximo de 2 Horas</Text>
            <Text style={styles.slaBannerText}>
              Priorizar tickets con fallas en pasarela de pago o errores de autenticación.
            </Text>
          </View>
        </View>

        {/* Métricas Principales (Clickeables) */}
        <Text style={styles.sectionHeader}>Estado del Soporte (Toca para ingresar)</Text>
        <View style={styles.grid}>
          <Pressable style={styles.metricCard} onPress={() => navigation.navigate('TicketList')}>
            <View style={[styles.iconBadge, { backgroundColor: colors.infoSoft }]}>
              <Icon name="chatbubble-ellipses" size={18} color={colors.brand} />
            </View>
            <Text style={styles.metricValue}>{metrics.newTickets}</Text>
            <Text style={styles.metricLabel}>Tickets nuevos</Text>
          </Pressable>

          <Pressable style={styles.metricCard} onPress={() => navigation.navigate('TicketList')}>
            <View style={[styles.iconBadge, { backgroundColor: colors.warningSoft }]}>
              <Icon name="time" size={18} color={colors.warning} />
            </View>
            <Text style={styles.metricValue}>{metrics.activeTickets}</Text>
            <Text style={styles.metricLabel}>Bandeja activa</Text>
          </Pressable>

          <Pressable style={styles.metricCard} onPress={() => navigation.navigate('TicketList')}>
            <View style={[styles.iconBadge, { backgroundColor: colors.dangerSoft }]}>
              <Icon name="alert-circle" size={18} color={colors.danger} />
            </View>
            <Text style={styles.metricValue}>{metrics.criticalSla}</Text>
            <Text style={styles.metricLabel}>SLA crítico</Text>
          </Pressable>

          <Pressable style={styles.metricCard} onPress={() => navigation.navigate('TicketList')}>
            <View style={[styles.iconBadge, { backgroundColor: colors.borderSoft }]}>
              <Icon name="grid" size={18} color={colors.textSecondary} />
            </View>
            <Text style={styles.metricValue}>{metrics.total}</Text>
            <Text style={styles.metricLabel}>Total acumulado</Text>
          </Pressable>
        </View>

        {/* Acciones de Respuesta Directa */}
        <Text style={styles.sectionHeader}>Acciones de Respuesta Rápida</Text>
        <View style={styles.actionCardsGroup}>
          <Pressable style={styles.actionCard} onPress={() => navigation.navigate('TicketList')}>
            <View style={[styles.actionIconBox, { backgroundColor: toneColors.brand.bg }]}>
              <Icon name="headset" size={22} color={colors.brand} />
            </View>
            <View style={styles.actionTextWrap}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionTitle}>Responder Tickets de Soporte</Text>
                <View style={styles.countBadgeBrand}>
                  <Text style={styles.countBadgeText}>{metrics.newTickets}</Text>
                </View>
              </View>
              <Text style={styles.actionDesc}>Ingresar a la bandeja de atención para responder y cerrar tickets.</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.brand} />
          </Pressable>

          <Pressable style={styles.actionCard} onPress={() => navigation.navigate('QaReports')}>
            <View style={[styles.actionIconBox, { backgroundColor: toneColors.warning.bg }]}>
              <Icon name="bug" size={22} color={colors.warning} />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Reportes QA e Incidencias Técnicas</Text>
              <Text style={styles.actionDesc}>Revisar fallas informadas por el equipo de control de calidad.</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.warning} />
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerTexts: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  homeBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pillTab: {
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.brand,
  },
  pillInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.white,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  slaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.infoBannerBg,
    borderWidth: 1,
    borderColor: colors.infoBannerBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  slaBannerTextWrap: { flex: 1 },
  slaBannerTitle: { fontSize: 13, fontWeight: '700', color: colors.brand, marginBottom: 2 },
  slaBannerText: {
    fontSize: 11.5,
    color: colors.infoBannerText,
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    elevation: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  actionCardsGroup: { gap: spacing.md },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: { flex: 1, gap: 2 },
  actionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  actionDesc: { fontSize: 11.5, color: colors.textSecondary, lineHeight: 16 },
  countBadgeBrand: {
    backgroundColor: colors.brand,
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { fontSize: 10, fontWeight: '800', color: colors.white },
});
