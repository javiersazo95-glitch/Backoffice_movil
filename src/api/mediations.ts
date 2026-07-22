import apiClient from './client';
import { toFormDataFile } from './uploads';
import type { PickedFile } from '@/components/shared';
import type { PageResponse } from '@/types/common';
import {
  MediationStatus,
  type MediationResponse,
  type MediationDetailResponse,
  type MediationMessageResponse,
  type ResolvedCaseResponse,
  type InitMediationRequest,
  type MediationMessageRequest,
  type ResolveCaseRequest,
  type MediationFilterRequest,
} from '@/types/mediation';

const MOCK_MEDIATIONS: MediationResponse[] = [
  {
    id: 1,
    externalId: 'MED-0BAAAE8C',
    sellerId: 10,
    sellerName: 'Autopartes Santiago',
    buyer: 'Juan Pérez',
    title: 'Caso en disputa: Empaque dañado',
    status: MediationStatus.ESPERANDO_VENDEDOR,
    displayStatus: 'En disputa',
    elapsed: '1d 4h',
    escalationType: 'RECLAMO',
    escalationReason: 'Sin respuesta',
    orderId: '48201',
    reason: 'Comprador reporta empaque dañado y producto sin factura',
    amount: 45000,
    stage: 'Esperando respuesta del vendedor',
    owner: 'Equipo Soporte',
    nextAction: 'Revisar respuesta del vendedor',
    mediationStarted: false,
    accountBlocked: false,
    canBlockAccount: true,
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-07-21T15:30:00Z',
  },
  {
    id: 2,
    externalId: 'MED-1002',
    sellerId: 12,
    sellerName: 'Repuestos Automotrices Chile',
    buyer: 'María González',
    title: 'Mediación formal: Incompatibilidad de pieza',
    status: MediationStatus.EN_MEDIACION,
    displayStatus: 'En mediación',
    elapsed: '2d 1h',
    escalationType: 'INCOMPATIBILIDAD',
    escalationReason: 'No coincide modelo',
    orderId: '48205',
    reason: 'Incompatibilidad de pieza con modelo informado en publicación',
    amount: 120000,
    stage: 'Mediación en curso',
    owner: 'Operador Mediaciones',
    nextAction: 'Solicitar evidencia adicional',
    mediationStarted: true,
    accountBlocked: false,
    canBlockAccount: true,
    createdAt: '2026-07-19T14:20:00Z',
    updatedAt: '2026-07-22T08:45:00Z',
  },
  {
    id: 3,
    externalId: 'MED-1003',
    sellerId: 15,
    sellerName: 'Frenos y Motores Express',
    buyer: 'Carlos Rojas',
    title: 'Caso en disputa: Falta de respuesta',
    status: MediationStatus.ESCALADO,
    displayStatus: 'En disputa',
    elapsed: '3d 8h',
    escalationType: 'SLA_VENCIDO',
    escalationReason: 'Vendedor no responde',
    orderId: '48190',
    reason: 'Falta de respuesta del vendedor tras 48 horas de reclamo',
    amount: 78000,
    stage: 'Escalado a backoffice',
    owner: 'Supervisor Confianza',
    nextAction: 'Evaluar bloqueo preventivo',
    mediationStarted: false,
    accountBlocked: true,
    canBlockAccount: false,
    createdAt: '2026-07-18T09:10:00Z',
    updatedAt: '2026-07-20T11:00:00Z',
  },
  {
    id: 4,
    externalId: 'MED-1004',
    sellerId: 18,
    sellerName: 'Importadora Serviteca',
    buyer: 'Ana Silva',
    title: 'Reembolso procesado',
    status: MediationStatus.RESUELTA,
    displayStatus: 'Resuelta',
    elapsed: '4d',
    escalationType: 'DEVOLUCION',
    escalationReason: 'Producto defectuoso',
    orderId: '48150',
    reason: 'Reembolso procesado por devolución de producto defectuoso',
    amount: 32000,
    stage: 'Caso resuelto',
    owner: 'Operador Mediaciones',
    nextAction: 'Cierre registrado',
    mediationStarted: true,
    accountBlocked: false,
    canBlockAccount: false,
    createdAt: '2026-07-15T11:00:00Z',
    updatedAt: '2026-07-16T16:00:00Z',
  },
  {
    id: 5,
    externalId: 'MED-1005',
    sellerId: 20,
    sellerName: 'Distribuidora Automotriz Norte',
    buyer: 'Pedro Soto',
    title: 'Acuerdo directo',
    status: MediationStatus.CERRADA,
    displayStatus: 'Cerrada',
    elapsed: '7d',
    escalationType: 'ACUERDO',
    escalationReason: 'Acuerdo partes',
    orderId: '48110',
    reason: 'Acuerdo directo entre comprador y vendedor',
    amount: 15000,
    stage: 'Cerrada',
    owner: 'Sistema Auto',
    nextAction: 'Ninguna',
    mediationStarted: false,
    accountBlocked: false,
    canBlockAccount: false,
    createdAt: '2026-07-12T08:00:00Z',
    updatedAt: '2026-07-14T09:30:00Z',
  },
];

export async function getMediations(params?: MediationFilterRequest): Promise<PageResponse<MediationResponse>> {
  try {
    const response = await apiClient.get<PageResponse<MediationResponse>>('/mediations', { params });
    if (response.data && Array.isArray(response.data.content)) {
      return response.data;
    }
  } catch {
    // Fallback mock
  }

  let filtered = [...MOCK_MEDIATIONS];
  if (params?.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.externalId.toLowerCase().includes(s) ||
        m.sellerName.toLowerCase().includes(s) ||
        m.reason.toLowerCase().includes(s) ||
        String(m.orderId).includes(s),
    );
  }
  if (params?.status) {
    if (
      params.status === MediationStatus.EN_DISPUTA ||
      params.status === MediationStatus.ESPERANDO_VENDEDOR ||
      params.status === MediationStatus.ESCALADO
    ) {
      filtered = filtered.filter(
        (m) =>
          m.status === MediationStatus.EN_DISPUTA ||
          m.status === MediationStatus.ESPERANDO_VENDEDOR ||
          m.status === MediationStatus.ESCALADO,
      );
    } else {
      filtered = filtered.filter((m) => m.status === params.status);
    }
  }

  const page = params?.page ?? 0;
  const size = params?.size ?? 15;
  const start = page * size;
  const pageContent = filtered.slice(start, start + size);

  return {
    content: pageContent,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size) || 1,
    currentPage: page,
    pageSize: size,
  };
}

export async function getMediationById(id: number): Promise<MediationDetailResponse> {
  try {
    const response = await apiClient.get<MediationDetailResponse>(`/mediations/${id}`);
    return response.data;
  } catch {
    const found = MOCK_MEDIATIONS.find((m) => m.id === id) || MOCK_MEDIATIONS[0];
    const buyerName = found.buyer || 'Juan Pérez (Comprador)';
    const sellerName = found.sellerName;

    return {
      ...found,
      buyer: buyerName,
      messages: [
        { id: 1, author: buyerName, text: 'El producto llegó con la caja rota y falta la factura fiscal original.', createdAt: '2026-07-20T10:15:00Z', editedAt: '', senderRole: 'BUYER' },
        { id: 2, author: sellerName, text: 'Adjuntamos el comprobante de despacho emitido por la empresa transportista.', createdAt: '2026-07-20T14:30:00Z', editedAt: '', senderRole: 'SELLER' },
        { id: 3, author: 'Equipo Soporte', text: 'Favor revisar la evidencia cargada en la plataforma.', createdAt: '2026-07-21T09:00:00Z', editedAt: '', senderRole: 'SUPPORT' },
      ],
      buyerMessages: [
        { id: 1, author: buyerName, text: 'El producto llegó con la caja rota y falta la factura fiscal original.', createdAt: '2026-07-20T10:15:00Z', editedAt: '', senderRole: 'BUYER' },
        { id: 10, author: buyerName, text: 'Solicito el reembolso completo de los $45.000 o el reenvío de la pieza.', createdAt: '2026-07-21T11:20:00Z', editedAt: '', senderRole: 'BUYER' },
      ],
      sellerMessages: [
        { id: 2, author: sellerName, text: 'Adjuntamos el comprobante de despacho emitido por la empresa transportista.', createdAt: '2026-07-20T14:30:00Z', editedAt: '', senderRole: 'SELLER' },
        { id: 20, author: sellerName, text: 'El paquete fue entregado en perfectas condiciones al courier.', createdAt: '2026-07-21T15:00:00Z', editedAt: '', senderRole: 'SELLER' },
      ],
      buyerEvidence: [
        { id: 'ev-b1', url: 'https://example.com/ev1.jpg', fileName: 'Foto_caja_danada_comprador.jpg', uploadedAt: '2026-07-20T10:15:00Z', actorRole: 'BUYER' },
        { id: 'ev-b2', url: 'https://example.com/ev2.pdf', fileName: 'Guia_despacho_recepcion.pdf', uploadedAt: '2026-07-20T10:16:00Z', actorRole: 'BUYER' },
      ],
      sellerEvidence: [
        { id: 'ev-s1', url: 'https://example.com/ev3.pdf', fileName: 'Comprobante_despacho_sii.pdf', uploadedAt: '2026-07-20T14:30:00Z', actorRole: 'SELLER' },
        { id: 'ev-s2', url: 'https://example.com/ev4.jpg', fileName: 'Foto_empaque_antes_envio.jpg', uploadedAt: '2026-07-20T14:32:00Z', actorRole: 'SELLER' },
      ],
      resolutionReason: '',
      documentName: '',
      documentUrl: '',
      documentType: '',
    };
  }
}

export async function createMediation(data: InitMediationRequest): Promise<MediationResponse> {
  const response = await apiClient.post<MediationResponse>('/mediations', data);
  return response.data;
}

export async function initMediation(id: number, data: InitMediationRequest): Promise<MediationResponse> {
  const response = await apiClient.patch<MediationResponse>(`/mediations/${id}/init`, data);
  return response.data;
}

export async function blockAccount(id: number): Promise<MediationResponse> {
  const response = await apiClient.patch<MediationResponse>(`/mediations/${id}/block-account`);
  return response.data;
}

export async function resolveCase(id: number, data: ResolveCaseRequest, document: PickedFile): Promise<ResolvedCaseResponse> {
  const formData = new FormData();
  formData.append('request', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  formData.append('document', toFormDataFile(document) as unknown as Blob);
  const response = await apiClient.post<ResolvedCaseResponse>(`/mediations/${id}/resolve`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function reactivateAccount(id: number, data: ResolveCaseRequest, document: PickedFile): Promise<ResolvedCaseResponse> {
  const formData = new FormData();
  formData.append('request', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  formData.append('document', toFormDataFile(document) as unknown as Blob);
  const response = await apiClient.post<ResolvedCaseResponse>(`/mediations/${id}/reactivate`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getMessages(mediationId: number, page = 0, size = 20): Promise<PageResponse<MediationMessageResponse>> {
  const response = await apiClient.get<PageResponse<MediationMessageResponse>>(`/mediations/${mediationId}/messages`, {
    params: { page, size },
  });
  return response.data;
}

export async function addMessage(mediationId: number, data: MediationMessageRequest): Promise<MediationMessageResponse> {
  const response = await apiClient.post<MediationMessageResponse>(`/mediations/${mediationId}/messages`, data);
  return response.data;
}
