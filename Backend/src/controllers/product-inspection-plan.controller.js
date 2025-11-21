const { getPool, sql } = require('../database');
const asyncHandler = require('../utils/asyncHandler');
const { mapProductInspectionPlanRecord } = require('../utils/mappers');
const { toDecimal } = require('../utils/helpers');

const getProductInspectionPlans = asyncHandler(async (_req, res) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(
      `SELECT Id, ItemId, ItemDescription, PlanType, Frequency, Customer, ContactPerson, SupplierPlant, CustomerApproval,
              DocNumber, PlanDate, SampleSize, PreparedBy, RevisionNumber, Remarks, Details, CreatedAt
       FROM dbo.ProductInspectionPlans
       ORDER BY CreatedAt DESC`
    );

  res.json(result.recordset.map(mapProductInspectionPlanRecord));
});

const createProductInspectionPlan = asyncHandler(async (req, res) => {
  const {
    itemId,
    itemDescription,
    planType,
    frequency,
    customer,
    contactPerson,
    supplierPlant,
    customerApproval,
    docNumber,
    planDate,
    sampleSize,
    preparedBy,
    revisionNumber,
    remarks,
    details
  } = req.body || {};

  if (!itemId || !itemDescription || !details || !Array.isArray(details) || !details.length) {
    return res.status(400).json({ message: 'Item information and at least one plan row are required.' });
  }

  const pool = await getPool();
  const insert = await pool
    .request()
    .input('itemId', sql.NVarChar(100), itemId.trim())
    .input('itemDescription', sql.NVarChar(255), itemDescription.trim())
    .input('planType', sql.NVarChar(100), planType ? planType.trim() : null)
    .input('frequency', sql.NVarChar(100), frequency ? frequency.trim() : null)
    .input('customer', sql.NVarChar(150), customer ? customer.trim() : null)
    .input('contactPerson', sql.NVarChar(150), contactPerson ? contactPerson.trim() : null)
    .input('supplierPlant', sql.NVarChar(150), supplierPlant ? supplierPlant.trim() : null)
    .input('customerApproval', sql.NVarChar(150), customerApproval ? customerApproval.trim() : null)
    .input('docNumber', sql.NVarChar(50), docNumber ? docNumber.trim() : null)
    .input('planDate', sql.DateTime2, planDate ? new Date(planDate) : null)
    .input('sampleSize', sql.Decimal(18, 4), toDecimal(sampleSize))
    .input('preparedBy', sql.NVarChar(150), preparedBy ? preparedBy.trim() : null)
    .input('revisionNumber', sql.NVarChar(50), revisionNumber ? revisionNumber.trim() : null)
    .input('remarks', sql.NVarChar(255), remarks ? remarks.trim() : null)
    .input('details', sql.NVarChar(sql.MAX), JSON.stringify(details))
    .query(`
      INSERT INTO dbo.ProductInspectionPlans (
        ItemId, ItemDescription, PlanType, Frequency, Customer, ContactPerson, SupplierPlant, CustomerApproval,
        DocNumber, PlanDate, SampleSize, PreparedBy, RevisionNumber, Remarks, Details
      )
      OUTPUT INSERTED.Id, INSERTED.ItemId, INSERTED.ItemDescription, INSERTED.PlanType, INSERTED.Frequency, INSERTED.Customer,
             INSERTED.ContactPerson, INSERTED.SupplierPlant, INSERTED.CustomerApproval, INSERTED.DocNumber, INSERTED.PlanDate,
             INSERTED.SampleSize, INSERTED.PreparedBy, INSERTED.RevisionNumber, INSERTED.Remarks, INSERTED.Details, INSERTED.CreatedAt
      VALUES (
        @itemId, @itemDescription, @planType, @frequency, @customer, @contactPerson, @supplierPlant, @customerApproval,
        @docNumber, @planDate, @sampleSize, @preparedBy, @revisionNumber, @remarks, @details
      );
    `);

  res.status(201).json(mapProductInspectionPlanRecord(insert.recordset[0]));
});

module.exports = {
  getProductInspectionPlans,
  createProductInspectionPlan
};

