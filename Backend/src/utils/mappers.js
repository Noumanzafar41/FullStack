const { parseDetails } = require('./helpers');

const mapParameterRecord = (row) => ({
  id: row.Id,
  parameterType: row.ParameterType,
  parameterName: row.ParameterName,
  processProduct: row.ProcessProduct,
  specCharacteristic: row.SpecCharacteristic,
  parameterCode: row.ParameterCode,
  createdAt: row.CreatedAt
});

const mapProductInspectionRecord = (row) => ({
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
  sampleQty: Number(row.SampleQty),
  department: row.Department,
  preProduction: Boolean(row.PreProduction),
  producedQty: Number(row.ProducedQty),
  acceptedQty: Number(row.AcceptedQty),
  rejectedQty: Number(row.RejectedQty),
  status: row.Status,
  remarks: row.Remarks,
  specialInstructions: row.SpecialInstructions,
  details: parseDetails(row.Details),
  createdAt: row.CreatedAt
});

const mapIncomingInspectionRecord = (row) => ({
  id: row.Id,
  inwardType: row.InwardType,
  grnType: row.GrnType,
  supplierVendor: row.SupplierVendor,
  reworkLocation: Boolean(row.ReworkLocation),
  inspectionRequired: Boolean(row.InspectionRequired),
  testCertificate: Boolean(row.TestCertificate),
  corrActionRequired: Boolean(row.CorrActionRequired),
  remarks: row.Remarks,
  details: parseDetails(row.Details),
  createdAt: row.CreatedAt
});

const mapProductInspectionPlanRecord = (row) => ({
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
  sampleSize: Number(row.SampleSize),
  preparedBy: row.PreparedBy,
  revisionNumber: row.RevisionNumber,
  remarks: row.Remarks,
  details: parseDetails(row.Details),
  createdAt: row.CreatedAt
});

const mapIncomingInspectionPlanRecord = (row) => ({
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

module.exports = {
  mapParameterRecord,
  mapProductInspectionRecord,
  mapIncomingInspectionRecord,
  mapProductInspectionPlanRecord,
  mapIncomingInspectionPlanRecord
};

