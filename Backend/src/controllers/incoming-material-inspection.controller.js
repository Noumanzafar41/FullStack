// src/controllers/incoming-material-inspection.controller.js
import { getPool, sql } from '../database.js';
import asyncHandler from '../utils/asyncHandler.js';
import { mapIncomingInspectionRecord } from '../utils/mappers.js';
import { toBool } from '../utils/helpers.js';

export const getIncomingMaterialInspections = asyncHandler(async (_req, res) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(
      `SELECT Id, InwardType, GrnType, SupplierVendor, ReworkLocation, InspectionRequired, TestCertificate, CorrActionRequired,
              Remarks, Details, CreatedAt
       FROM IncomingMaterialInspections
       ORDER BY CreatedAt DESC`
    );

  res.json(result.recordset.map(mapIncomingInspectionRecord));
});

export const createIncomingMaterialInspection = asyncHandler(async (req, res) => {
  const {
    inwardType,
    grnType,
    supplierVendor,
    reworkLocation,
    inspectionRequired,
    testCertificate,
    corrActionRequired,
    remarks,
    details
  } = req.body || {};

  if (!details || !Array.isArray(details) || !details.length) {
    return res.status(400).json({ message: 'At least one inspection line is required.' });
  }

  const pool = await getPool();

  await pool
    .request()
    .input('inwardType', sql.NVarChar(100), inwardType ? inwardType.trim() : null)
    .input('grnType', sql.NVarChar(100), grnType ? grnType.trim() : null)
    .input('supplierVendor', sql.NVarChar(255), supplierVendor ? supplierVendor.trim() : null)
    .input('reworkLocation', sql.Bit, toBool(reworkLocation))
    .input('inspectionRequired', sql.Bit, toBool(inspectionRequired))
    .input('testCertificate', sql.Bit, toBool(testCertificate))
    .input('corrActionRequired', sql.Bit, toBool(corrActionRequired))
    .input('remarks', sql.NVarChar(255), remarks ? remarks.trim() : null)
    .input('details', sql.NVarChar(sql.MAX), JSON.stringify(details))
    .query(`
      INSERT INTO IncomingMaterialInspections (
        InwardType, GrnType, SupplierVendor, ReworkLocation, InspectionRequired, TestCertificate, CorrActionRequired, Remarks, Details
      )
      VALUES (@inwardType, @grnType, @supplierVendor, @reworkLocation, @inspectionRequired, @testCertificate, @corrActionRequired, @remarks, @details)
    `);

  // Fetch the last inserted record
  const lastInserted = await pool
    .request()
    .query(`SELECT * FROM IncomingMaterialInspections ORDER BY CreatedAt DESC LIMIT 1`);

  res.status(201).json(mapIncomingInspectionRecord(lastInserted.recordset[0]));
});
