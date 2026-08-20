import apiClient from './client';
import { downloadAndShareFile, toFormDataFile } from './uploads';
import type { PickedFile } from '@/components/shared';
import type {
  AdvertisingOrdersResponse,
  AdministrationWorkspaceResponse,
  AdministrationBootstrapResponse,
  RetiroAdminResponse,
  RetiroDetalleResponse,
  PagoProveedorResponse,
} from '@/types/administration';

export async function getWorkspace(): Promise<AdministrationWorkspaceResponse> {
  const response = await apiClient.get<AdministrationWorkspaceResponse>('/administration/workspace');
  return response.data;
}

export async function getBootstrap(): Promise<AdministrationBootstrapResponse> {
  const response = await apiClient.get<AdministrationBootstrapResponse>('/administration/bootstrap');
  return response.data;
}

/** Compras de fichas para publicidad: alimentan el tab "Publicidad" de Pedidos. */
export async function getAdvertisingOrders(): Promise<AdvertisingOrdersResponse> {
  const response = await apiClient.get<AdvertisingOrdersResponse>('/administration/advertising-orders');
  return response.data;
}

export async function getWithdrawals(): Promise<RetiroAdminResponse[]> {
  const response = await apiClient.get<RetiroAdminResponse[]>('/administration/withdrawals');
  return response.data;
}

export async function getWithdrawalDetails(id: string | number): Promise<RetiroDetalleResponse> {
  const response = await apiClient.get<RetiroDetalleResponse>(`/administration/withdrawals/${id}/details`);
  return response.data;
}

export async function payWithdrawal(id: string | number): Promise<RetiroAdminResponse> {
  const response = await apiClient.patch<RetiroAdminResponse>(`/administration/withdrawals/${id}/pay`);
  return response.data;
}

export async function getWithdrawalPayments(): Promise<PagoProveedorResponse[]> {
  const response = await apiClient.get<PagoProveedorResponse[]>('/administration/withdrawal-payments');
  return response.data;
}

export async function getWithdrawalPayment(id: string | number): Promise<PagoProveedorResponse> {
  const response = await apiClient.get<PagoProveedorResponse>(`/administration/withdrawal-payments/${id}`);
  return response.data;
}

export async function createWithdrawalPayment(retiroIds: number[]): Promise<PagoProveedorResponse> {
  const response = await apiClient.post<PagoProveedorResponse>('/administration/withdrawal-payments', { retiroIds });
  return response.data;
}

export interface LiquidationDocumentPayload {
  retiroId: number;
  tipoDocumento: string;
  rut: string;
  razonSocial: string;
  email: string;
  detalle: string;
  ivaLiquidado: number | null;
  eliminarDocumento: boolean;
}

export async function saveLiquidationDocument(payload: LiquidationDocumentPayload, documento?: PickedFile): Promise<void> {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  if (documento) formData.append('documento', toFormDataFile(documento) as unknown as Blob);
  await apiClient.post('/administration/liquidation-documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function openLiquidationDocumentFile(retiroId: number, fileName = 'liquidacion.pdf'): Promise<string> {
  return downloadAndShareFile(`/administration/withdrawals/${retiroId}/liquidation-document`, fileName);
}
