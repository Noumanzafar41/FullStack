import { parseDetails, toDecimal, toBool } from './helpers.js';

export const mapParameterRecord = (row) => ({
  id: row.Id,
  parameterType: row.ParameterType,
  parameterName: row.ParameterName,
  processProduct: row.ProcessProduct,
  specCharacteristic: row.SpecCharacteristic,
  parameterCode: row.ParameterCode,
  createdAt: row.CreatedAt
});

export const mapProductInspectionRecord = (row) => ({
  id: row.Id,
  itemId: row.ItemId,
  itemDescription: row.ItemDescription,
  productionOrderNo: row.ProductionOrderNo,
  receiptFromProduction: row.ReceiptFromProduction,
  inspectedBy: row.InspectedBy,
  controlPlanNo: row.ControlPlanNo,
  containerBagNo: row.ContainerBagNo,
  bottlePelletNo: row.BottlePelletNo,
  docNumber: row.DocNumber,
  inspectionDate: row.InspectionDate,
  productionOrderDate: row.ProductionOrderDate,
  sampleQty: toDecimal(row.SampleQty),
  department: row.Department,
  preProduction: toBool(row.PreProduction),
  producedQty: toDecimal(row.ProducedQty),
  acceptedQty: toDecimal(row.AcceptedQty),
  rejectedQty: toDecimal(row.RejectedQty),
  status: row.Status,
  remarks: row.Remarks,
  specialInstructions: row.SpecialInstructions,
  details: parseDetails(row.Details),
  createdAt: row.CreatedAt
});

export const mapIncomingInspectionRecord = (row) => ({
  id: row.Id,
  inwardType: row.InwardType,
  grnType: row.GrnType,
  supplierVendor: row.SupplierVendor,
  reworkLocation: toBool(row.ReworkLocation),
  inspectionRequired: toBool(row.InspectionRequired),
  testCertificate: toBool(row.TestCertificate),
  corrActionRequired: toBool(row.CorrActionRequired),
  remarks: row.Remarks,
  details: parseDetails(row.Details),
  createdAt: row.CreatedAt
});

export const mapProductInspectionPlanRecord = (row) => ({
  id: row.Id,
  itemId: row.ItemId,
  itemDescription: row.ItemDescription,
  planType: row.PlanType,
  frequency: row.Frequency,
  customer: row.Customer,
  contactPerson: row.ContactPerson,
  supplierPlant: row.SupplierPlant,
  customerApproval: row.CustomerApproval,
  docNumber: row.DocNumber,
  planDate: row.PlanDate,
  sampleSize: toDecimal(row.SampleSize),
  preparedBy: row.PreparedBy,
  revisionNumber: row.RevisionNumber,
  remarks: row.Remarks,
  details: parseDetails(row.Details),
  createdAt: row.CreatedAt
});

export const mapIncomingInspectionPlanRecord = (row) => ({
  id: row.Id,
  itemId: row.ItemId,
  itemDescription: row.ItemDescription,
  docNumber: row.DocNumber,
  docDate: row.DocDate,
  revisionNumber: row.RevisionNumber,
  preparedBy: row.PreparedBy,
  remarks: row.Remarks,
  details: parseDetails(row.Details),
  createdAt: row.CreatedAt
});
