const { getPool, sql } = require('../database');
const asyncHandler = require('../utils/asyncHandler');
const { mapParameterRecord } = require('../utils/mappers');

const getParameters = asyncHandler(async (_req, res) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(
      'SELECT Id, ParameterType, ParameterName, ProcessProduct, SpecCharacteristic, ParameterCode, CreatedAt FROM dbo.ParameterMaster ORDER BY CreatedAt DESC'
    );

  res.json(result.recordset.map(mapParameterRecord));
});

const createParameter = asyncHandler(async (req, res) => {
  const { parameterType, parameterName, processProduct, specCharacteristic, parameterCode } = req.body || {};

  if (!parameterType || !parameterName || !processProduct || !specCharacteristic || !parameterCode) {
    return res.status(400).json({ message: 'All parameter fields are required.' });
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input('parameterType', sql.NVarChar(100), parameterType.trim())
    .input('parameterName', sql.NVarChar(150), parameterName.trim())
    .input('processProduct', sql.NVarChar(150), processProduct.trim())
    .input('specCharacteristic', sql.NVarChar(150), specCharacteristic.trim())
    .input('parameterCode', sql.NVarChar(100), parameterCode.trim())
    .query(`
      INSERT INTO dbo.ParameterMaster (
        ParameterType,
        ParameterName,
        ProcessProduct,
        SpecCharacteristic,
        ParameterCode
      )
      OUTPUT INSERTED.Id, INSERTED.ParameterType, INSERTED.ParameterName, INSERTED.ProcessProduct,
             INSERTED.SpecCharacteristic, INSERTED.ParameterCode, INSERTED.CreatedAt
      VALUES (@parameterType, @parameterName, @processProduct, @specCharacteristic, @parameterCode);
    `);

  res.status(201).json(mapParameterRecord(result.recordset[0]));
});

module.exports = {
  getParameters,
  createParameter
};

