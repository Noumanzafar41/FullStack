const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const { getPool, sql, ensureSchema } = require('./database');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const asyncHandler =
  (handler) =>
  async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      console.error('[API] Unhandled error:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };

const toDecimal = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const toBool = (value) => Boolean(value);

const parseDetails = (value) => {
  try {
    return JSON.parse(value || '[]');
  } catch (_error) {
    return [];
  }
};

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

app.get(
  '/api/health',
  asyncHandler(async (_req, res) => {
    await getPool();
    res.json({ status: 'ok' });
  })
);

app.post(
  '/api/auth/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase();
    const pool = await getPool();
    const result = await pool
      .request()
      .input('email', sql.NVarChar(255), normalizedEmail)
      .query('SELECT TOP (1) Id, Name, Email, PasswordHash FROM dbo.Users WHERE Email = @email');

    if (!result.recordset.length) {
      return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
    }

    const user = result.recordset[0];
    const passwordMatch = await bcrypt.compare(password, user.PasswordHash);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
    }

    return res.json({
      message: 'Login successful.',
      token: Buffer.from(`${user.Email}:${Date.now()}`).toString('base64'),
      profile: { name: user.Name, email: user.Email }
    });
  })
);

app.post(
  '/api/auth/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase();
    const pool = await getPool();
    const existingUser = await pool
      .request()
      .input('email', sql.NVarChar(255), normalizedEmail)
      .query('SELECT 1 FROM dbo.Users WHERE Email = @email');

    if (existingUser.recordset.length) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool
      .request()
      .input('name', sql.NVarChar(150), name.trim())
      .input('email', sql.NVarChar(255), normalizedEmail)
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .query(
        'INSERT INTO dbo.Users (Name, Email, PasswordHash) VALUES (@name, @email, @passwordHash);'
      );

    return res.status(201).json({ message: 'Account created successfully.' });
  })
);

app.post(
  '/api/auth/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const pool = await getPool();
    await pool
      .request()
      .input('email', sql.NVarChar(255), email.toLowerCase())
      .query('SELECT 1 FROM dbo.Users WHERE Email = @email');

    return res.json({
      message: 'If an account exists, password reset instructions were sent.'
    });
  })
);

app.get(
  '/api/parameters',
  asyncHandler(async (_req, res) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .query(
        'SELECT Id, ParameterType, ParameterName, ProcessProduct, SpecCharacteristic, ParameterCode, CreatedAt FROM dbo.ParameterMaster ORDER BY CreatedAt DESC'
      );

    res.json(result.recordset.map(mapParameterRecord));
  })
);

app.post(
  '/api/parameters',
  asyncHandler(async (req, res) => {
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
  })
);

app.get(
  '/api/product-inspections',
  asyncHandler(async (_req, res) => {
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
  })
);

app.post(
  '/api/product-inspections',
  asyncHandler(async (req, res) => {
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
  })
);

app.get(
  '/api/incoming-material-inspections',
  asyncHandler(async (_req, res) => {
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
  })
);

app.post(
  '/api/incoming-material-inspections',
  asyncHandler(async (req, res) => {
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
  })
);

app.get(
  '/api/product-inspection-plans',
  asyncHandler(async (_req, res) => {
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
  })
);

app.post(
  '/api/product-inspection-plans',
  asyncHandler(async (req, res) => {
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
  })
);

app.get(
  '/api/incoming-material-inspection-plans',
  asyncHandler(async (_req, res) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .query(
        `SELECT Id, ItemId, ItemDescription, DocNumber, DocDate, RevisionNumber, PreparedBy, Remarks, Details, CreatedAt
         FROM dbo.IncomingMaterialInspectionPlans
         ORDER BY CreatedAt DESC`
      );

    res.json(result.recordset.map(mapIncomingInspectionPlanRecord));
  })
);

app.post(
  '/api/incoming-material-inspection-plans',
  asyncHandler(async (req, res) => {
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
  })
);

app.use((_, res) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

const bootstrap = async () => {
  try {
    await ensureSchema();
    app.listen(port, () => {
      console.log(`Backend API ready → http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize database connection.', error);
    process.exit(1);
  }
};

bootstrap();

