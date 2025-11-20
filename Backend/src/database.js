const sql = require('mssql');

const DEFAULT_SERVER = 'DESKTOP-LRGKKJQ';
const DEFAULT_INSTANCE = 'SQLEXPRESS';
const DEFAULT_PORT = 1433;

const parseBoolean = (value, fallback) => {
  if (value === undefined) {
    return fallback;
  }
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const parseNumber = (value) => {
  if (!value && value !== 0) {
    return undefined;
  }
  const result = Number(value);
  return Number.isNaN(result) ? undefined : result;
};

const config = {
  server: process.env.SQL_SERVER || DEFAULT_SERVER,
  database: process.env.SQL_DATABASE || 'master',
  user: process.env.SQL_USER || 'sa',
  password: process.env.SQL_PASSWORD || 'Database1122',
  options: {
    encrypt: parseBoolean(process.env.SQL_ENCRYPT, false),
    trustServerCertificate: parseBoolean(process.env.SQL_TRUST_CERT, true)
  },
  pool: {
    min: 0,
    max: 10,
    idleTimeoutMillis: 30000
  }
};

const port = parseNumber(process.env.SQL_PORT) ?? DEFAULT_PORT;
const instanceName = process.env.SQL_INSTANCE || '';

if (port) {
  config.port = port;
}

if (!process.env.SQL_PORT && instanceName) {
  config.options.instanceName = instanceName;
}

let poolPromise;

const getPool = async () => {
  if (!poolPromise) {
    poolPromise = sql.connect(config);
  }

  return poolPromise;
};

const ensureSchema = async () => {
  const pool = await getPool();
  await pool
    .request()
    .query(`
      IF OBJECT_ID('dbo.Users', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.Users (
          Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          Name NVARCHAR(150) NOT NULL,
          Email NVARCHAR(255) NOT NULL UNIQUE,
          PasswordHash NVARCHAR(255) NOT NULL,
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
      END;

      IF OBJECT_ID('dbo.ParameterMaster', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.ParameterMaster (
          Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          ParameterType NVARCHAR(100) NOT NULL,
          ParameterName NVARCHAR(150) NOT NULL,
          ProcessProduct NVARCHAR(150) NOT NULL,
          SpecCharacteristic NVARCHAR(150) NOT NULL,
          ParameterCode NVARCHAR(100) NOT NULL,
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
        CREATE INDEX IX_ParameterMaster_CreatedAt ON dbo.ParameterMaster (CreatedAt DESC);
      END;

      IF OBJECT_ID('dbo.ProductInspections', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.ProductInspections (
          Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          ItemId NVARCHAR(100) NOT NULL,
          ItemDescription NVARCHAR(255) NOT NULL,
          ProductionOrderNo NVARCHAR(100) NULL,
          ReceiptFromProduction NVARCHAR(150) NULL,
          InspectedBy NVARCHAR(150) NULL,
          ControlPlanNo NVARCHAR(100) NULL,
          ContainerBagNo NVARCHAR(100) NULL,
          BottlePelletNo NVARCHAR(100) NULL,
          DocNumber NVARCHAR(50) NULL,
          InspectionDate DATETIME2 NULL,
          ProductionOrderDate DATETIME2 NULL,
          SampleQty DECIMAL(18,4) NOT NULL DEFAULT 0,
          Department NVARCHAR(150) NULL,
          PreProduction BIT NOT NULL DEFAULT 0,
          ProducedQty DECIMAL(18,4) NOT NULL DEFAULT 0,
          AcceptedQty DECIMAL(18,4) NOT NULL DEFAULT 0,
          RejectedQty DECIMAL(18,4) NOT NULL DEFAULT 0,
          Status NVARCHAR(100) NULL,
          Remarks NVARCHAR(255) NULL,
          SpecialInstructions NVARCHAR(MAX) NULL,
          Details NVARCHAR(MAX) NOT NULL,
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
        CREATE INDEX IX_ProductInspections_CreatedAt ON dbo.ProductInspections (CreatedAt DESC);
      END;

      IF OBJECT_ID('dbo.IncomingMaterialInspections', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.IncomingMaterialInspections (
          Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          InwardType NVARCHAR(100) NULL,
          GrnType NVARCHAR(100) NULL,
          SupplierVendor NVARCHAR(255) NULL,
          ReworkLocation BIT NOT NULL DEFAULT 0,
          InspectionRequired BIT NOT NULL DEFAULT 0,
          TestCertificate BIT NOT NULL DEFAULT 0,
          CorrActionRequired BIT NOT NULL DEFAULT 0,
          Remarks NVARCHAR(255) NULL,
          Details NVARCHAR(MAX) NOT NULL,
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
        CREATE INDEX IX_IncomingMaterialInspections_CreatedAt ON dbo.IncomingMaterialInspections (CreatedAt DESC);
      END;

      IF OBJECT_ID('dbo.ProductInspectionPlans', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.ProductInspectionPlans (
          Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          ItemId NVARCHAR(100) NOT NULL,
          ItemDescription NVARCHAR(255) NOT NULL,
          PlanType NVARCHAR(100) NULL,
          Frequency NVARCHAR(100) NULL,
          Customer NVARCHAR(150) NULL,
          ContactPerson NVARCHAR(150) NULL,
          SupplierPlant NVARCHAR(150) NULL,
          CustomerApproval NVARCHAR(150) NULL,
          DocNumber NVARCHAR(50) NULL,
          PlanDate DATETIME2 NULL,
          SampleSize DECIMAL(18,4) NOT NULL DEFAULT 0,
          PreparedBy NVARCHAR(150) NULL,
          RevisionNumber NVARCHAR(50) NULL,
          Remarks NVARCHAR(255) NULL,
          Details NVARCHAR(MAX) NOT NULL,
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
        CREATE INDEX IX_ProductInspectionPlans_CreatedAt ON dbo.ProductInspectionPlans (CreatedAt DESC);
      END;

      IF OBJECT_ID('dbo.IncomingMaterialInspectionPlans', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.IncomingMaterialInspectionPlans (
          Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          ItemId NVARCHAR(100) NOT NULL,
          ItemDescription NVARCHAR(255) NOT NULL,
          DocNumber NVARCHAR(50) NULL,
          DocDate DATETIME2 NULL,
          RevisionNumber NVARCHAR(50) NULL,
          PreparedBy NVARCHAR(150) NULL,
          Remarks NVARCHAR(255) NULL,
          Details NVARCHAR(MAX) NOT NULL,
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
        CREATE INDEX IX_IncomingMaterialInspectionPlans_CreatedAt ON dbo.IncomingMaterialInspectionPlans (CreatedAt DESC);
      END;
    `);
};

module.exports = {
  sql,
  getPool,
  ensureSchema
};