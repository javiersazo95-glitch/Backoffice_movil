export enum ValidationStatus {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  POR_CORREGIR = 'POR_CORREGIR',
}

export interface ValidationDocumentItem {
  id: number;
  name: string;
  url?: string;
  status: ValidationStatus;
  notes?: string;
}

export interface StoreValidationRequest {
  id: number;
  sellerId: number;
  sellerName: string;
  representativeName: string;
  rut: string;
  email: string;
  phone: string;
  regionCity: string;
  status: ValidationStatus;
  createdAt: string;
  dueAt: string;
  documents: ValidationDocumentItem[];
  notes?: string;
}

export interface ValidationResponse {
  id: number;
  sellerId: number;
  sellerName: string;
  sellerFounder?: boolean;
  documentType: string;
  documentUrl?: string;
  uploadedAt: string;
  dueAt: string;
  status: ValidationStatus;
  owner: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateValidationRequest {
  sellerId: number;
  documentType: string;
  dueAt: string;
  notes?: string;
}
