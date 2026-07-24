import apiClient from './client';
import type { PageResponse } from '@/types/common';
import { ValidationStatus, type ValidationResponse, type CreateValidationRequest, type StoreValidationRequest } from '@/types/validation';
import { getSellers } from './sellers';

export async function getValidations(page = 0, size = 50): Promise<PageResponse<ValidationResponse>> {
  try {
    const response = await apiClient.get<PageResponse<ValidationResponse>>('/validations', { params: { page, size } });
    return response.data;
  } catch {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      currentPage: page,
      pageSize: size,
    };
  }
}

export async function getStoreValidations(): Promise<StoreValidationRequest[]> {
  try {
    const res = await getValidations();
    const sellersMap = new Map<number, any>();

    try {
      const sellersRes = await getSellers({ size: 100 });
      (sellersRes.content || []).forEach((s) => sellersMap.set(s.id, s));
    } catch {
      // Ignorar si el endpoint de vendedores falla
    }

    const groupedMap = new Map<number, StoreValidationRequest>();

    (res.content || []).forEach((v) => {
      const seller = sellersMap.get(v.sellerId);
      const docUrl = v.documentUrl || seller?.userProfileUrl || undefined;

      if (!groupedMap.has(v.sellerId)) {
        groupedMap.set(v.sellerId, {
          id: v.id,
          sellerId: v.sellerId,
          sellerName: v.sellerName || seller?.storeName || 'Vendedor',
          representativeName: seller?.owner || seller?.bankAccountHolderName || v.owner || v.sellerName,
          rut: seller?.rut || seller?.bankAccountRut || 'Sin RUT registrado',
          email: seller?.email || 'contacto@vendedor.cl',
          phone: seller?.phone || '+56 9 0000 0000',
          regionCity: seller?.city || seller?.address || 'Chile',
          status: v.status,
          createdAt: v.createdAt,
          dueAt: v.dueAt,
          documents: [
            {
              id: v.id,
              name: v.documentType || 'Documento de Ingreso',
              url: docUrl,
              status: v.status,
            },
          ],
          notes: v.notes,
        });
      } else {
        groupedMap.get(v.sellerId)!.documents.push({
          id: v.id,
          name: v.documentType || 'Documento de Ingreso',
          url: docUrl,
          status: v.status,
        });
      }
    });

    return Array.from(groupedMap.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  } catch {
    return [];
  }
}

export async function getValidationById(id: number): Promise<ValidationResponse> {
  const response = await apiClient.get<ValidationResponse>(`/validations/${id}`);
  return response.data;
}

export async function createValidation(data: CreateValidationRequest): Promise<ValidationResponse> {
  const response = await apiClient.post<ValidationResponse>('/validations', data);
  return response.data;
}

export async function approveValidation(id: number): Promise<ValidationResponse> {
  const response = await apiClient.patch<ValidationResponse>(`/validations/${id}/approve`);
  return response.data;
}

export async function requestCorrection(id: number, notes: string): Promise<ValidationResponse> {
  const response = await apiClient.patch<ValidationResponse>(`/validations/${id}/request-correction`, { notes });
  return response.data;
}

export async function rejectValidation(id: number, notes?: string): Promise<ValidationResponse> {
  const response = await apiClient.patch<ValidationResponse>(`/validations/${id}/reject`, { notes });
  return response.data;
}
