const { getPool, sql } = require('../database');
const asyncHandler = require('../utils/asyncHandler');
const { mapIncomingInspectionPlanRecord } = require('../utils/mappers');

const getIncomingMaterialInspectionPlans = asyncHandler(async (_req, res) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(
      `SELECT Id, ItemId, ItemDescription, DocNumber, DocDate, RevisionNumber, PreparedBy, Remarks, Details, CreatedAt
       FROM dbo.IncomingMaterialInspectionPlans
       ORDER BY CreatedAt DESC`
    );

  res.json(result.recordset.map(mapIncomingInspectionPlanRecord));
});

const createIncomingMaterialInspectionPlan = asyncHandler(async (req, res) => {
  const { itemId, itemDescription, docNumber, docDate, revisionNumber, preparedBy, remarks, details } = req.body || {};

  if (!itemId || !itemDescription || !details || !Array.isArray(details) || !details.length) {
    return res.status(400).json({ message: 'Item information and at least one plan row are required.' });
  }

  const pool = await getPool();
  const insert = await pool
    .request()
    .input('itemId', sql.NVarChar(100), itemId.trim())
    .input('itemDescription', sql.NVarChar(255), itemDescription.trim())
    .input('docNumber', sql.NVarChar(50), docNumber ? docNumber.trim() : null)
    .input('docDate', sql.DateTime2, docDate ? new Date(docDate) : null)
    .input('revisionNumber', sql.NVarChar(50), revisionNumber ? revisionNumber.trim() : null)
    .input('preparedBy', sql.NVarChar(150), preparedBy ? preparedBy.trim() : null)
    .input('remarks', sql.NVarChar(255), remarks ? remarks.trim() : null)
    .input('details', sql.NVarChar(sql.MAX), JSON.stringify(details))
    .query(`
      INSERT INTO dbo.IncomingMaterialInspectionPlans (ItemId, ItemDescription, DocNumber, DocDate, RevisionNumber, PreparedBy, Remarks, Details)
      OUTPUT INSERTED.Id, INSERTED.ItemId, INSERTED.ItemDescription, INSERTED.DocNumber, INSERTED.DocDate, INSERTED.RevisionNumber,
             INSERTED.PreparedBy, INSERTED.Remarks, INSERTED.Details, INSERTED.CreatedAt
      VALUES (@itemId, @itemDescription, @docNumber, @docDate, @revisionNumber, @preparedBy, @remarks, @details);
    `);

  res.status(201).json(mapIncomingInspectionPlanRecord(insert.recordset[0]));
});

module.exports = {
  getIncomingMaterialInspectionPlans,
  createIncomingMaterialInspectionPlan
};

