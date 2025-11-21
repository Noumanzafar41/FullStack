const { getPool, sql } = require('../database');
const asyncHandler = require('../utils/asyncHandler');
const { mapProductInspectionRecord } = require('../utils/mappers');
const { toDecimal, toBool } = require('../utils/helpers');

const getProductInspections = asyncHandler(async (_req, res) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(
      `SELECT Id, ItemId, ItemDescription, ProductionOrderNo, ReceiptFromProduction, InspectedBy, ControlPlanNo, ContainerBagNo, BottlePelletNo,
              DocNumber, InspectionDate, ProductionOrderDate, SampleQty, Department, PreProduction, ProducedQty, AcceptedQty, RejectedQty,
              Status, Remarks, SpecialInstructions, Details, CreatedAt
       FROM dbo.ProductInspections
       ORDER BY CreatedAt DESC`
    );

  res.json(result.recordset.map(mapProductInspectionRecord));
});

const createProductInspection = asyncHandler(async (req, res) => {
  const {
    itemId,
    itemDescription,
    productionOrderNo,
    receiptFromProduction,
    inspectedBy,
    controlPlanNo,
    containerBagNo,
    bottlePelletNo,
    docNumber,
    inspectionDate,
    productionOrderDate,
    sampleQty,
    department,
    preProduction,
    producedQty,
    acceptedQty,
    rejectedQty,
    status,
    remarks,
    specialInstructions,
    details
  } = req.body || {};

  if (!itemId || !itemDescription || !details || !Array.isArray(details) || !details.length) {
    return res.status(400).json({ message: 'Item information and at least one detail row are required.' });
  }

  const pool = await getPool();
  const insert = await pool
    .request()
    .input('itemId', sql.NVarChar(100), itemId.trim())
    .input('itemDescription', sql.NVarChar(255), itemDescription.trim())
    .input('productionOrderNo', sql.NVarChar(100), productionOrderNo ? productionOrderNo.trim() : null)
    .input('receiptFromProduction', sql.NVarChar(150), receiptFromProduction ? receiptFromProduction.trim() : null)
    .input('inspectedBy', sql.NVarChar(150), inspectedBy ? inspectedBy.trim() : null)
    .input('controlPlanNo', sql.NVarChar(100), controlPlanNo ? controlPlanNo.trim() : null)
    .input('containerBagNo', sql.NVarChar(100), containerBagNo ? containerBagNo.trim() : null)
    .input('bottlePelletNo', sql.NVarChar(100), bottlePelletNo ? bottlePelletNo.trim() : null)
    .input('docNumber', sql.NVarChar(50), docNumber ? docNumber.trim() : null)
    .input('inspectionDate', sql.DateTime2, inspectionDate ? new Date(inspectionDate) : null)
    .input('productionOrderDate', sql.DateTime2, productionOrderDate ? new Date(productionOrderDate) : null)
    .input('sampleQty', sql.Decimal(18, 4), toDecimal(sampleQty))
    .input('department', sql.NVarChar(150), department ? department.trim() : null)
    .input('preProduction', sql.Bit, toBool(preProduction))
    .input('producedQty', sql.Decimal(18, 4), toDecimal(producedQty))
    .input('acceptedQty', sql.Decimal(18, 4), toDecimal(acceptedQty))
    .input('rejectedQty', sql.Decimal(18, 4), toDecimal(rejectedQty))
    .input('status', sql.NVarChar(100), status ? status.trim() : null)
    .input('remarks', sql.NVarChar(255), remarks ? remarks.trim() : null)
    .input('specialInstructions', sql.NVarChar(sql.MAX), specialInstructions ? specialInstructions.trim() : null)
    .input('details', sql.NVarChar(sql.MAX), JSON.stringify(details))
    .query(`
      INSERT INTO dbo.ProductInspections (
        ItemId, ItemDescription, ProductionOrderNo, ReceiptFromProduction, InspectedBy, ControlPlanNo,
        ContainerBagNo, BottlePelletNo, DocNumber, InspectionDate, ProductionOrderDate, SampleQty,
        Department, PreProduction, ProducedQty, AcceptedQty, RejectedQty, Status, Remarks, SpecialInstructions, Details
      )
      OUTPUT INSERTED.Id, INSERTED.ItemId, INSERTED.ItemDescription, INSERTED.ProductionOrderNo, INSERTED.ReceiptFromProduction,
             INSERTED.InspectedBy, INSERTED.ControlPlanNo, INSERTED.ContainerBagNo, INSERTED.BottlePelletNo, INSERTED.DocNumber,
             INSERTED.InspectionDate, INSERTED.ProductionOrderDate, INSERTED.SampleQty, INSERTED.Department, INSERTED.PreProduction,
             INSERTED.ProducedQty, INSERTED.AcceptedQty, INSERTED.RejectedQty, INSERTED.Status, INSERTED.Remarks, INSERTED.SpecialInstructions,
             INSERTED.Details, INSERTED.CreatedAt
      VALUES (
        @itemId, @itemDescription, @productionOrderNo, @receiptFromProduction, @inspectedBy, @controlPlanNo,
        @containerBagNo, @bottlePelletNo, @docNumber, @inspectionDate, @productionOrderDate, @sampleQty,
        @department, @preProduction, @producedQty, @acceptedQty, @rejectedQty, @status, @remarks, @specialInstructions, @details
      );
    `);

  res.status(201).json(mapProductInspectionRecord(insert.recordset[0]));
});

module.exports = {
  getProductInspections,
  createProductInspection
};

