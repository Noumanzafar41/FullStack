// src/controllers/parameter.controller.js
import { getPool, sql } from '../database.js';
import asyncHandler from '../utils/asyncHandler.js';
import { mapParameterRecord } from '../utils/mappers.js';

export const getParameters = asyncHandler(async (_req, res) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(
      'SELECT Id, ParameterType, ParameterName, ProcessProduct, SpecCharacteristic, ParameterCode, CreatedAt FROM ParameterMaster ORDER BY CreatedAt DESC'
    );

  res.json(result.recordset.map(mapParameterRecord));
});

export const createParameter = asyncHandler(async (req, res) => {
  const { parameterType, parameterName, processProduct, specCharacteristic, parameterCode } = req.body || {};

  if (!parameterType || !parameterName || !processProduct || !specCharacteristic || !parameterCode) {
    return res.status(400).json({ message: 'All parameter fields are required.' });
  }

  const pool = await getPool();

  await pool
    .request()
    .input('parameterType', sql.NVarChar(100), parameterType.trim())
    .input('parameterName', sql.NVarChar(150), parameterName.trim())
    .input('processProduct', sql.NVarChar(150), processProduct.trim())
    .input('specCharacteristic', sql.NVarChar(150), specCharacteristic.trim())
    .input('parameterCode', sql.NVarChar(100), parameterCode.trim())
    .query(`
      INSERT INTO ParameterMaster (
        ParameterType,
        ParameterName,
        ProcessProduct,
        SpecCharacteristic,
        ParameterCode
      )
      VALUES (@parameterType, @parameterName, @processProduct, @specCharacteristic, @parameterCode)
    `);

  const lastInserted = await pool
    .request()
    .query('SELECT * FROM ParameterMaster ORDER BY CreatedAt DESC LIMIT 1');

  res.status(201).json(mapParameterRecord(lastInserted.recordset[0]));
});
