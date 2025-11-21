const { getPool, sql } = require('../database');
const asyncHandler = require('../utils/asyncHandler');
const { mapIncomingInspectionRecord } = require('../utils/mappers');
const { toBool } = require('../utils/helpers');

const getIncomingMaterialInspections = asyncHandler(async (_req, res) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(
      `SELECT Id, InwardType, GrnType, SupplierVendor, ReworkLocation, InspectionRequired, TestCertificate, CorrActionRequired,
              Remarks, Details, CreatedAt
       FROM dbo.IncomingMaterialInspections
       ORDER BY CreatedAt DESC`
    );

  res.json(result.recordset.map(mapIncomingInspectionRecord));
});

const createIncomingMaterialInspection = asyncHandler(async (req, res) => {
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
  const insert = await pool
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
      INSERT INTO dbo.IncomingMaterialInspections (
        InwardType, GrnType, SupplierVendor, ReworkLocation, InspectionRequired, TestCertificate, CorrActionRequired, Remarks, Details
      )
      OUTPUT INSERTED.Id, INSERTED.InwardType, INSERTED.GrnType, INSERTED.SupplierVendor, INSERTED.ReworkLocation,
             INSERTED.InspectionRequired, INSERTED.TestCertificate, INSERTED.CorrActionRequired, INSERTED.Remarks, INSERTED.Details, INSERTED.CreatedAt
      VALUES (@inwardType, @grnType, @supplierVendor, @reworkLocation, @inspectionRequired, @testCertificate, @corrActionRequired, @remarks, @details);
    `);

  res.status(201).json(mapIncomingInspectionRecord(insert.recordset[0]));
});

module.exports = {
  getIncomingMaterialInspections,
  createIncomingMaterialInspection
};

