import apiClient from './client';
import type { PageResponse } from '@/types/common';
import type {
  SellerResponse,
  SellerDetailResponse,
  UpdateSellerRequest,
  SuspendSellerRequest,
  SellerFilterRequest,
  SellerDocumentResponse,
  SellerBlockHistoryResponse,
  SellerRetiroResponse,
} from '@/types/seller';
import type { TicketResponse } from '@/types/ticket';
import type { ValidationResponse } from '@/types/validation';
import type { ReportResponse } from '@/types/report';

export async function getSellers(params?: SellerFilterRequest): Promise<PageResponse<SellerResponse>> {
  const response = await apiClient.get<PageResponse<SellerResponse>>('/sellers', { params });
  return response.data;
}

export async function getSellerById(id: number): Promise<SellerDetailResponse> {
  const response = await apiClient.get<SellerDetailResponse>(`/sellers/${id}`);
  return response.data;
}

export async function updateSeller(id: number, data: UpdateSellerRequest): Promise<SellerResponse> {
  const response = await apiClient.patch<SellerResponse>(`/sellers/${id}`, data);
  return response.data;
}

export async function suspendSeller(id: number, data: SuspendSellerRequest): Promise<SellerResponse> {
  const response = await apiClient.patch<SellerResponse>(`/sellers/${id}/suspend`, data);
  return response.data;
}

export async function getSellerBlockHistory(id: number): Promise<SellerBlockHistoryResponse[]> {
  const response = await apiClient.get<SellerBlockHistoryResponse[]>(`/sellers/${id}/block-history`);
  return response.data;
}

export async function getSellerReports(id: number): Promise<ReportResponse[]> {
  const response = await apiClient.get<ReportResponse[]>(`/sellers/${id}/reports`);
  return response.data;
}

export async function getSellerTickets(id: number): Promise<TicketResponse[]> {
  const response = await apiClient.get<TicketResponse[]>(`/sellers/${id}/tickets`);
  return response.data;
}

export async function getSellerRetiros(id: number): Promise<SellerRetiroResponse[]> {
  const response = await apiClient.get<SellerRetiroResponse[]>(`/sellers/${id}/retiros`);
  return response.data;
}

export async function getSellerDocuments(id: number): Promise<SellerDocumentResponse[]> {
  const response = await apiClient.get<SellerDocumentResponse[]>(`/sellers/${id}/documents`);

  try {
    const validationsResponse = await apiClient.get<PageResponse<ValidationResponse>>('/validations', {
      params: { page: 0, size: 500 },
    });
    const sellerValidations = validationsResponse.data.content.filter((document) => document.sellerId === id);
    return mergeSellerDocuments(response.data, sellerValidations, id);
  } catch {
    return response.data;
  }
}

type DocumentLike = Partial<SellerDocumentResponse & ValidationResponse> & Record<string, unknown>;

function normalizeDocumentType(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getStringField(document: DocumentLike, key: string, fallback = ''): string {
  const value = document[key];
  return typeof value === 'string' ? value : fallback;
}

function normalizeSellerDocument(document: DocumentLike, sellerId: number): SellerDocumentResponse | null {
  const documentType =
    getStringField(document, 'documentType') || getStringField(document, 'type') || getStringField(document, 'name');
  if (!documentType) return null;

  return {
    id: typeof document.id === 'number' ? document.id : -Math.abs(normalizeDocumentType(documentType).length + sellerId),
    sellerId: typeof document.sellerId === 'number' ? document.sellerId : sellerId,
    documentType,
    documentUrl: getStringField(document, 'documentUrl') || undefined,
    uploadedAt: getStringField(document, 'uploadedAt') || getStringField(document, 'createdAt'),
    dueAt: getStringField(document, 'dueAt'),
    status: document.status as SellerDocumentResponse['status'],
    owner: getStringField(document, 'owner'),
    notes: getStringField(document, 'notes'),
  };
}

function mergeSellerDocuments(
  sellerDocuments: SellerDocumentResponse[],
  validationDocuments: ValidationResponse[],
  sellerId: number,
): SellerDocumentResponse[] {
  const merged = new Map<string, SellerDocumentResponse>();

  sellerDocuments.forEach((document) => {
    const normalizedDocument = normalizeSellerDocument(document as DocumentLike, sellerId);
    if (normalizedDocument) merged.set(normalizeDocumentType(normalizedDocument.documentType), normalizedDocument);
  });

  validationDocuments.forEach((document) => {
    const normalizedDocument = normalizeSellerDocument(document as DocumentLike, sellerId);
    if (normalizedDocument) {
      const key = normalizeDocumentType(normalizedDocument.documentType);
      const current = merged.get(key);
      if (!current || (!current.documentUrl && normalizedDocument.documentUrl)) {
        merged.set(key, normalizedDocument);
      }
    }
  });

  return Array.from(merged.values());
}
