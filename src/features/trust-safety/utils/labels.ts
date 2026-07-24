import type { StatusTone } from '@/theme';
import { MediationStatus } from '@/types/mediation';
import { SellerStatus, TrustLevel, BankStatus } from '@/types/seller';
import { ValidationStatus } from '@/types/validation';
import { AlertSeverity } from '@/types/alert';
import { AuditModule } from '@/types/audit';

export function normalizeVisibleMediationStatus(status: MediationStatus, mediationStarted?: boolean): MediationStatus {
  if (status === MediationStatus.ESCALADO) return MediationStatus.ESPERANDO_VENDEDOR;
  if (status === MediationStatus.EN_MEDIACION && !mediationStarted) return MediationStatus.ESPERANDO_VENDEDOR;
  return status;
}

export const MEDIATION_STATUS_LABELS: Record<MediationStatus, string> = {
  [MediationStatus.EN_DISPUTA]: 'En disputa',
  [MediationStatus.ESPERANDO_VENDEDOR]: 'En disputa',
  [MediationStatus.ESCALADO]: 'En disputa',
  [MediationStatus.EN_MEDIACION]: 'En mediación',
  [MediationStatus.RESUELTA]: 'Resuelta',
  [MediationStatus.CERRADA]: 'Cerrada',
};

export const MEDIATION_STATUS_TONE: Record<MediationStatus, StatusTone> = {
  [MediationStatus.EN_DISPUTA]: 'warning',
  [MediationStatus.ESPERANDO_VENDEDOR]: 'warning',
  [MediationStatus.ESCALADO]: 'danger',
  [MediationStatus.EN_MEDIACION]: 'violet',
  [MediationStatus.RESUELTA]: 'success',
  [MediationStatus.CERRADA]: 'neutral',
};

export function getMediationDisplayStatus(status: MediationStatus, mediationStarted?: boolean, accountBlocked?: boolean): string {
  if (accountBlocked) return 'Cuenta Bloqueada';
  const norm = normalizeVisibleMediationStatus(status, mediationStarted);
  return MEDIATION_STATUS_LABELS[norm] ?? 'En disputa';
}

export function getMediationDisplayTone(status: MediationStatus, mediationStarted?: boolean, accountBlocked?: boolean): StatusTone {
  if (accountBlocked) return 'danger';
  const norm = normalizeVisibleMediationStatus(status, mediationStarted);
  return MEDIATION_STATUS_TONE[norm] ?? 'warning';
}

export const SELLER_STATUS_LABELS: Record<SellerStatus, string> = {
  [SellerStatus.APROBADO]: 'Aprobado',
  [SellerStatus.POR_CORREGIR]: 'Por corregir',
  [SellerStatus.RECHAZADO]: 'Rechazado',
};

export const SELLER_STATUS_TONE: Record<SellerStatus, StatusTone> = {
  [SellerStatus.APROBADO]: 'success',
  [SellerStatus.POR_CORREGIR]: 'warning',
  [SellerStatus.RECHAZADO]: 'danger',
};

export const TRUST_LEVEL_LABELS: Record<TrustLevel, string> = {
  [TrustLevel.ALTO]: 'Alto',
  [TrustLevel.MEDIO]: 'Medio',
  [TrustLevel.BAJO]: 'Bajo',
};

export const TRUST_LEVEL_TONE: Record<TrustLevel, StatusTone> = {
  [TrustLevel.ALTO]: 'success',
  [TrustLevel.MEDIO]: 'warning',
  [TrustLevel.BAJO]: 'danger',
};

export const BANK_STATUS_LABELS: Record<BankStatus, string> = {
  [BankStatus.VERIFICADA]: 'Verificada',
  [BankStatus.PENDIENTE]: 'Pendiente',
  [BankStatus.BLOQUEADA]: 'Bloqueada',
};

export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
  [ValidationStatus.PENDIENTE]: 'Pendiente',
  [ValidationStatus.APROBADA]: 'Aprobada',
  [ValidationStatus.RECHAZADA]: 'Rechazada',
  [ValidationStatus.POR_CORREGIR]: 'Por corregir',
};

export const VALIDATION_STATUS_TONE: Record<ValidationStatus, StatusTone> = {
  [ValidationStatus.PENDIENTE]: 'warning',
  [ValidationStatus.APROBADA]: 'success',
  [ValidationStatus.RECHAZADA]: 'danger',
  [ValidationStatus.POR_CORREGIR]: 'warning',
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  [AlertSeverity.CRITICA]: 'Crítica',
  [AlertSeverity.ALTA]: 'Alta',
  [AlertSeverity.MEDIA]: 'Media',
};

export const ALERT_SEVERITY_TONE: Record<AlertSeverity, StatusTone> = {
  [AlertSeverity.CRITICA]: 'danger',
  [AlertSeverity.ALTA]: 'warning',
  [AlertSeverity.MEDIA]: 'info',
};

export const AUDIT_MODULE_LABELS: Record<AuditModule, string> = {
  [AuditModule.VENDEDORES]: 'Vendedores',
  [AuditModule.VALIDACIONES]: 'Validaciones',
  [AuditModule.MEDIACIONES]: 'Mediaciones',
  [AuditModule.ALERTAS]: 'Alertas',
};
