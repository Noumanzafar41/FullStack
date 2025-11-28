// src/controllers/incoming-material-inspection-plan.controller.js
import { getPool, sql } from '../database.js';
import asyncHandler from '../utils/asyncHandler.js';
import { mapIncomingInspectionPlanRecord } from '../utils/mappers.js';

export const getIncomingMaterialInspectionPlans = asyncHandler(async (_req, res) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(
      `SELECT Id, ItemId, ItemDescription, DocNumber, DocDate, RevisionNumber, PreparedBy, Remarks, Details, CreatedAt
       FROM IncomingMaterialInspectionPlans
       ORDER BY CreatedAt DESC`
    );

  res.json(result.recordset.map(mapIncomingInspectionPlanRecord));
});

export const createIncomingMaterialInspectionPlan = asyncHandler(async (req, res) => {
  const { itemId, itemDescription, docNumber, docDate, revisionNumber, preparedBy, remarks, details } = req.body || {};

  if (!itemId || !itemDescription || !details || !Array.isArray(details) || !details.length) {
    return res.status(400).json({ message: 'Item information and at least one plan row are required.' });
  }

  const pool = await getPool();

  await pool
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
      INSERT INTO IncomingMaterialInspectionPlans 
      (ItemId, ItemDescription, DocNumber, DocDate, RevisionNumber, PreparedBy, Remarks, Details)
      VALUES (@itemId, @itemDescription, @docNumber, @docDate, @revisionNumber, @preparedBy, @remarks, @details)
    `);

  // Retrieve the last inserted record
  const lastInserted = await pool
    .request()
    .query(`SELECT * FROM IncomingMaterialInspectionPlans ORDER BY CreatedAt DESC LIMIT 1`);

  res.status(201).json(mapIncomingInspectionPlanRecord(lastInserted.recordset[0]));
});
