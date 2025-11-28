import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// ---------------------
// Data Interfaces
// ---------------------
export interface ParameterRecord {
  id: number;
  parameterType: string;
  parameterName: string;
  processProduct: string;
  specCharacteristic: string;
  parameterCode: string;
  createdAt: string;
}

// Product Inspection
export interface ProductInspectionDetail {
  parameterType: string;
  parameterName: string;
  specification: string;
  sampleSize: number;
  result: number;
  stdDeviation: number;
  remarks: string;
}

export interface ProductInspectionRecord {
  id: number;
  itemId: string;
  itemDescription: string;
  productionOrderNo: string;
  receiptFromProduction: string;
  inspectedBy: string;
  controlPlanNo: string;
  containerBagNo: string;
  bottlePelletNo: string;
  docNumber: string;
  inspectionDate: string | null;
  productionOrderDate: string | null;
  sampleQty: number;
  department: string;
  preProduction: boolean;
  producedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  status: string;
  remarks: string;
  specialInstructions: string;
  details: ProductInspectionDetail[];
  createdAt: string;
}

// Incoming Material Inspection
export interface IncomingInspectionDetail {
  itemId: string;
  itemDescription: string;
  unit: string;
  inspectionQty: number;
  acceptedQty: number;
  qcNumber: string;
  acceptedWithDeviation: number;
  rejectedQty: number;
  reworkQty: number;
  receivingLocation: string;
  acceptedLocation: string;
  status: string;
  reason: string;
}

export interface IncomingMaterialInspectionRecord {
  id: number;
  inwardType: string;
  grnType: string;
  supplierVendor: string;
  reworkLocation: boolean;
  inspectionRequired: boolean;
  testCertificate: boolean;
  corrActionRequired: boolean;
  remarks: string;
  details: IncomingInspectionDetail[];
  createdAt: string;
}

// Product Inspection Plan
export interface ProductInspectionPlanDetail {
  parameterType: string;
  parameterName: string;
  specifications: string;
  specCharacteristics: string;
  controlMethod: string;
  frequencyType: string;
  frequencyValue: string;
  sampleSize: number;
  machineNo: string;
  toolNo: string;
  inspectionMethod: string;
  reactionPlan: string;
  correctiveAction: string;
}

export interface ProductInspectionPlanRecord {
  id: number;
  itemId: string;
  itemDescription: string;
  planType: string;
  frequency: string;
  customer: string;
  contactPerson: string;
  supplierPlant: string;
  customerApproval: string;
  docNumber: string;
  planDate: string | null;
  sampleSize: number;
  preparedBy: string;
  revisionNumber: string;
  remarks: string;
  details: ProductInspectionPlanDetail[];
  createdAt: string;
}

// Incoming Material Inspection Plan
export interface IncomingMaterialInspectionPlanDetail {
  parameterName: string;
  specifications: string;
  results: string;
  inspectionMethod: string;
  remarks: string;
}

export interface IncomingMaterialInspectionPlanRecord {
  id: number;
  itemId: string;
  itemDescription: string;
  docNumber: string;
  docDate: string | null;
  revisionNumber: string;
  preparedBy: string;
  remarks: string;
  details: IncomingMaterialInspectionPlanDetail[];
  createdAt: string;
}

// ---------------------
// Payload types
// ---------------------
export type CreateParameterPayload = Omit<ParameterRecord, 'id' | 'createdAt'>;
export type CreateProductInspectionPayload = Omit<ProductInspectionRecord, 'id' | 'createdAt'>;
export type CreateIncomingMaterialInspectionPayload = Omit<IncomingMaterialInspectionRecord, 'id' | 'createdAt'>;
export type CreateProductInspectionPlanPayload = Omit<ProductInspectionPlanRecord, 'id' | 'createdAt'>;
export type CreateIncomingMaterialInspectionPlanPayload = Omit<IncomingMaterialInspectionPlanRecord, 'id' | 'createdAt'>;

// ---------------------
// Dynamic API URL
// ---------------------
const resolveApiBase = (): string => {
  const globalConfig = typeof window !== 'undefined' ? (window as any).__SAPBTP_API_URL : undefined;
  const envConfig = (import.meta as any)?.env?.NG_APP_API_URL as string | undefined;
  const configured = globalConfig || envConfig;

  if (configured) return configured.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port, host, origin } = window.location;
    if (hostname === 'localhost' && port && port !== '4200') return `${protocol}//${hostname}:3100/api`;
    if (host.startsWith('port') && host.includes('applicationstudio.cloud.sap')) {
      const basHost = host.replace(/^port\d+/, 'port3100');
      return `${protocol}//${basHost}/api`;
    }
    if (origin) return `${origin}/api`;
  }

  return '/api';
};

// ---------------------
// Service
// ---------------------
@Injectable({
  providedIn: 'root'
})
export class ParameterService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = resolveApiBase();

  // ---------------------
  // Parameters
  // ---------------------
  listParameters(): Observable<ParameterRecord[]> {
    return this.http.get<ParameterRecord[]>(`${this.apiBase}/parameters`).pipe(catchError(this.handleError));
  }

  createParameter(payload: CreateParameterPayload): Observable<ParameterRecord> {
    return this.http.post<ParameterRecord>(`${this.apiBase}/parameters`, payload).pipe(catchError(this.handleError));
  }

  // ---------------------
  // Product Inspections
  // ---------------------
  listProductInspections(): Observable<ProductInspectionRecord[]> {
    return this.http.get<ProductInspectionRecord[]>(`${this.apiBase}/product-inspections`).pipe(catchError(this.handleError));
  }

  createProductInspection(payload: CreateProductInspectionPayload): Observable<ProductInspectionRecord> {
    return this.http.post<ProductInspectionRecord>(`${this.apiBase}/product-inspections`, payload).pipe(catchError(this.handleError));
  }

  // ---------------------
  // Incoming Material Inspections
  // ---------------------
  listIncomingMaterialInspections(): Observable<IncomingMaterialInspectionRecord[]> {
    return this.http.get<IncomingMaterialInspectionRecord[]>(`${this.apiBase}/incoming-material-inspections`).pipe(catchError(this.handleError));
  }

  createIncomingMaterialInspection(payload: CreateIncomingMaterialInspectionPayload): Observable<IncomingMaterialInspectionRecord> {
    return this.http.post<IncomingMaterialInspectionRecord>(`${this.apiBase}/incoming-material-inspections`, payload).pipe(catchError(this.handleError));
  }

  // ---------------------
  // Product Inspection Plans
  // ---------------------
  listProductInspectionPlans(): Observable<ProductInspectionPlanRecord[]> {
    return this.http.get<ProductInspectionPlanRecord[]>(`${this.apiBase}/product-inspection-plans`).pipe(catchError(this.handleError));
  }

  createProductInspectionPlan(payload: CreateProductInspectionPlanPayload): Observable<ProductInspectionPlanRecord> {
    return this.http.post<ProductInspectionPlanRecord>(`${this.apiBase}/product-inspection-plans`, payload).pipe(catchError(this.handleError));
  }

  // ---------------------
  // Incoming Material Inspection Plans
  // ---------------------
  listIncomingMaterialInspectionPlans(): Observable<IncomingMaterialInspectionPlanRecord[]> {
    return this.http.get<IncomingMaterialInspectionPlanRecord[]>(`${this.apiBase}/incoming-material-inspection-plans`).pipe(catchError(this.handleError));
  }

  createIncomingMaterialInspectionPlan(payload: CreateIncomingMaterialInspectionPlanPayload): Observable<IncomingMaterialInspectionPlanRecord> {
    return this.http.post<IncomingMaterialInspectionPlanRecord>(`${this.apiBase}/incoming-material-inspection-plans`, payload).pipe(catchError(this.handleError));
  }

  // ---------------------
  // Error handler
  // ---------------------
  private handleError(error: any) {
    console.error('ParameterService Error:', error);
    return throwError(() => error);
  }
}
