import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ParameterRecord {
  id: number;
  parameterType: string;
  parameterName: string;
  processProduct: string;
  specCharacteristic: string;
  parameterCode: string;
  createdAt: string;
}

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

export type CreateParameterPayload = Omit<ParameterRecord, 'id' | 'createdAt'>;
export type CreateProductInspectionPayload = Omit<ProductInspectionRecord, 'id' | 'createdAt'>;
export type CreateIncomingMaterialInspectionPayload = Omit<IncomingMaterialInspectionRecord, 'id' | 'createdAt'>;
export type CreateProductInspectionPlanPayload = Omit<ProductInspectionPlanRecord, 'id' | 'createdAt'>;
export type CreateIncomingMaterialInspectionPlanPayload = Omit<IncomingMaterialInspectionPlanRecord, 'id' | 'createdAt'>;

@Injectable({
  providedIn: 'root'
})
export class ParameterService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:3000/api';

  listParameters(): Observable<ParameterRecord[]> {
    return this.http.get<ParameterRecord[]>(`${this.apiBase}/parameters`);
  }

  createParameter(payload: CreateParameterPayload): Observable<ParameterRecord> {
    return this.http.post<ParameterRecord>(`${this.apiBase}/parameters`, payload);
  }

  listProductInspections(): Observable<ProductInspectionRecord[]> {
    return this.http.get<ProductInspectionRecord[]>(`${this.apiBase}/product-inspections`);
  }

  createProductInspection(payload: CreateProductInspectionPayload): Observable<ProductInspectionRecord> {
    return this.http.post<ProductInspectionRecord>(`${this.apiBase}/product-inspections`, payload);
  }

  listIncomingMaterialInspections(): Observable<IncomingMaterialInspectionRecord[]> {
    return this.http.get<IncomingMaterialInspectionRecord[]>(`${this.apiBase}/incoming-material-inspections`);
  }

  createIncomingMaterialInspection(payload: CreateIncomingMaterialInspectionPayload): Observable<IncomingMaterialInspectionRecord> {
    return this.http.post<IncomingMaterialInspectionRecord>(`${this.apiBase}/incoming-material-inspections`, payload);
  }

  listProductInspectionPlans(): Observable<ProductInspectionPlanRecord[]> {
    return this.http.get<ProductInspectionPlanRecord[]>(`${this.apiBase}/product-inspection-plans`);
  }

  createProductInspectionPlan(payload: CreateProductInspectionPlanPayload): Observable<ProductInspectionPlanRecord> {
    return this.http.post<ProductInspectionPlanRecord>(`${this.apiBase}/product-inspection-plans`, payload);
  }

  listIncomingMaterialInspectionPlans(): Observable<IncomingMaterialInspectionPlanRecord[]> {
    return this.http.get<IncomingMaterialInspectionPlanRecord[]>(`${this.apiBase}/incoming-material-inspection-plans`);
  }

  createIncomingMaterialInspectionPlan(payload: CreateIncomingMaterialInspectionPlanPayload): Observable<IncomingMaterialInspectionPlanRecord> {
    return this.http.post<IncomingMaterialInspectionPlanRecord>(`${this.apiBase}/incoming-material-inspection-plans`, payload);
  }
}
