import apiClient from './client';
import { toFormDataFile } from './uploads';
import type { PickedFile } from '@/components/shared';
import type { PageResponse } from '@/types/common';

export type TicketCategory = 'FALLA_TECNICA' | 'SOLICITUD_AYUDA' | 'CONSULTA';
export type ReporterType = 'COMPRADOR' | 'VENDEDOR' | 'INTERNO';
export type TicketPriority = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
export type TicketPlatform = 'ADMINISTRACION_CONTABLE' | 'MEDIACION_CONFIANZA' | 'APP_MOBILE' | 'SOPORTE' | 'SITIO_WEB';
export type TicketStatus =
  | 'ABIERTO'
  | 'EN_PROCESO'
  | 'PENDIENTE_VENDEDOR'
  | 'PENDIENTE_COMPRADOR'
  | 'SLA_VENCIDO'
  | 'RESUELTO'
  | 'CERRADO'
  | 'CANCELADO';

export interface SupportWorkspaceResponse {
  module: string;
  status: string;
  views: string[];
  newTickets: number;
  openTickets: number;
  urgentTickets: number;
  expiredSlaTickets: number;
  totalTickets: number;
  technicalFailureTickets: number;
  helpRequestTickets: number;
  inquiryTickets: number;
  buyerReporterTickets: number;
  sellerReporterTickets: number;
  internalReporterTickets: number;
  accountingPlatformTickets: number;
  trustPlatformTickets: number;
  mobilePlatformTickets: number;
}

export interface TicketResponse {
  id: number;
  externalId: string;
  sellerId?: number;
  sellerName?: string;
  sellerFounder?: boolean;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  reporterType: ReporterType;
  platform?: TicketPlatform;
  reporterName: string;
  correoContacto?: string;
  telefonoContacto?: string;
  regionContacto?: string;
  comunaContacto?: string;
  sla?: string;
  reason: string;
  orderId?: string;
  lastMessage?: string;
  nextAction?: string;
  supportResponse?: string;
  responseRead?: boolean;
  respondedAt?: string;
  origin?: string;
  documentoUrl?: string;
  entorno?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: number;
  autorTipo: 'USUARIO' | 'SOPORTE';
  autorNombre?: string;
  autorRol?: string;
  autorAvatarUrl?: string;
  mensaje: string;
  createdAt: string;
}

export interface TicketAttachment {
  id: number;
  url: string;
  nombreArchivo?: string;
  descripcion?: string;
  createdAt: string;
}

export interface GetTicketsParams {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  platform?: TicketPlatform;
  excludeClosed?: boolean;
  page?: number;
  size?: number;
}

export interface UpdateTicketStatusData {
  status: TicketStatus;
  nextAction?: string;
  documentoUrl?: string;
}

const MOCK_TICKETS: TicketResponse[] = [
  {
    id: 1,
    externalId: 'TCK-1001',
    status: 'ABIERTO',
    priority: 'CRITICA',
    category: 'FALLA_TECNICA',
    reporterType: 'VENDEDOR',
    reporterName: 'Repuestos Automotrices Chile',
    reason: 'Error al procesar pago de factura en pasarela Webpay',
    createdAt: '2026-07-20T10:30:00Z',
    updatedAt: '2026-07-22T09:15:00Z',
  },
  {
    id: 2,
    externalId: 'TCK-1002',
    status: 'EN_PROCESO',
    priority: 'ALTA',
    category: 'SOLICITUD_AYUDA',
    reporterType: 'COMPRADOR',
    reporterName: 'Juan Pérez',
    reason: 'Consulta sobre despacho de pedido #48291',
    createdAt: '2026-07-21T14:20:00Z',
    updatedAt: '2026-07-22T11:00:00Z',
  },
  {
    id: 3,
    externalId: 'TCK-1003',
    status: 'PENDIENTE_VENDEDOR',
    priority: 'MEDIA',
    category: 'CONSULTA',
    reporterType: 'VENDEDOR',
    reporterName: 'Autopartes Santiago',
    reason: 'Solicitud de verificación de cuenta de vendedor',
    createdAt: '2026-07-19T08:45:00Z',
    updatedAt: '2026-07-21T16:30:00Z',
  },
  {
    id: 4,
    externalId: 'TCK-1004',
    status: 'SLA_VENCIDO',
    priority: 'CRITICA',
    category: 'FALLA_TECNICA',
    reporterType: 'INTERNO',
    reporterName: 'Equipo QA',
    reason: 'Falla masiva en sincronización de stock de repuestos',
    createdAt: '2026-07-18T12:00:00Z',
    updatedAt: '2026-07-20T18:10:00Z',
  },
  {
    id: 5,
    externalId: 'TCK-1005',
    status: 'RESUELTO',
    priority: 'BAJA',
    category: 'CONSULTA',
    reporterType: 'COMPRADOR',
    reporterName: 'María González',
    reason: 'Cambio de dirección de entrega en perfil',
    createdAt: '2026-07-15T09:00:00Z',
    updatedAt: '2026-07-16T10:00:00Z',
  },
];

export async function getWorkspace(): Promise<SupportWorkspaceResponse> {
  try {
    const response = await apiClient.get<SupportWorkspaceResponse>('/support/workspace');
    return response.data;
  } catch {
    return {
      module: 'SOPORTE',
      status: 'OK',
      views: ['resumen', 'tickets', 'qa'],
      newTickets: 5,
      openTickets: 23,
      urgentTickets: 3,
      expiredSlaTickets: 1,
      totalTickets: 142,
      technicalFailureTickets: 45,
      helpRequestTickets: 60,
      inquiryTickets: 37,
      buyerReporterTickets: 80,
      sellerReporterTickets: 50,
      internalReporterTickets: 12,
      accountingPlatformTickets: 30,
      trustPlatformTickets: 20,
      mobilePlatformTickets: 92,
    };
  }
}

function filterTicketsList(list: TicketResponse[], params?: GetTicketsParams): PageResponse<TicketResponse> {
  let filtered = [...list];
  if (params?.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.reason.toLowerCase().includes(s) ||
        t.reporterName.toLowerCase().includes(s) ||
        t.externalId.toLowerCase().includes(s),
    );
  }
  if (params?.status) {
    filtered = filtered.filter((t) => t.status === params.status);
  }
  if (params?.priority) {
    filtered = filtered.filter((t) => t.priority === params.priority);
  }
  if (params?.category) {
    filtered = filtered.filter((t) => t.category === params.category);
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

export async function getTickets(params?: GetTicketsParams): Promise<PageResponse<TicketResponse>> {
  try {
    const response = await apiClient.get<PageResponse<TicketResponse>>('/support/tickets', { params });
    if (response.data && Array.isArray(response.data.content)) {
      return response.data;
    }
  } catch {
    // Fallback
  }
  return filterTicketsList(MOCK_TICKETS, params);
}

export async function getQaReports(params?: Omit<GetTicketsParams, 'category'>): Promise<PageResponse<TicketResponse>> {
  try {
    const response = await apiClient.get<PageResponse<TicketResponse>>('/support/tickets/qa-reports', { params });
    if (response.data && Array.isArray(response.data.content)) {
      return response.data;
    }
  } catch {
    // Fallback
  }
  const qaMock = MOCK_TICKETS.filter((t) => t.reporterType === 'INTERNO' || t.category === 'FALLA_TECNICA');
  return filterTicketsList(qaMock.length ? qaMock : MOCK_TICKETS, params);
}

export async function getTicketById(id: number): Promise<TicketResponse> {
  const response = await apiClient.get<TicketResponse>(`/support/tickets/${id}`);
  return response.data;
}

export async function updateTicketStatus(id: number, data: UpdateTicketStatusData): Promise<TicketResponse> {
  const response = await apiClient.patch<TicketResponse>(`/support/tickets/${id}/status`, data);
  return response.data;
}

export async function getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
  const response = await apiClient.get<TicketMessage[]>(`/support/tickets/${ticketId}/messages`);
  return response.data;
}

export async function getTicketAttachments(ticketId: number): Promise<TicketAttachment[]> {
  const response = await apiClient.get<TicketAttachment[]>(`/support/tickets/${ticketId}/attachments`);
  return response.data;
}

export async function sendTicketMessage(
  ticketId: number,
  data: { autorTipo: string; autorNombre?: string; mensaje: string },
): Promise<TicketMessage> {
  const response = await apiClient.post<TicketMessage>(`/support/tickets/${ticketId}/messages`, data);
  return response.data;
}

export async function uploadDocument(file: PickedFile, folder: string = 'qa-docs'): Promise<{ url: string; path: string; filename?: string }> {
  const formData = new FormData();
  formData.append('file', toFormDataFile(file) as unknown as Blob);
  const response = await apiClient.post<{ url: string; path: string; filename?: string }>('/uploads/upload', formData, {
    params: { folder },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
