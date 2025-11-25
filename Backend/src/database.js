const hana = require('@sap/hana-client');

/**
 * Parse VCAP_SERVICES to extract HANA Cloud credentials
 * Supports both Cloud Foundry service bindings and local environment variables
 */
const getDatabaseConfig = () => {
  // Check for VCAP_SERVICES (Cloud Foundry / SAP BTP)
  if (process.env.VCAP_SERVICES) {
    try {
      const vcapServices = JSON.parse(process.env.VCAP_SERVICES);
      
      // Look for HANA service (common service names: 'hana', 'hanatrial', 'hana-cloud', etc.)
      const serviceName = process.env.HANA_SERVICE_NAME || 'hana';
      const service = vcapServices[serviceName];
      
      if (service && service[0] && service[0].credentials) {
        const creds = service[0].credentials;
        
        // HANA Cloud connection configuration
        // Handle various credential field name variations
        const host = creds.host || creds.hostname || creds.hostName;
        const port = creds.port || 443;
        const user = creds.user || creds.username || creds.uid;
        const password = creds.password || creds.pwd;
        const database = creds.database || creds.schema || creds.databaseName;
        
        if (!host || !user || !password || !database) {
          throw new Error('Incomplete HANA Cloud credentials in VCAP_SERVICES. Missing: host, user, password, or database');
        }
        
        return {
          serverNode: `${host}:${port}`,
          uid: user,
          pwd: password,
          databaseName: database,
          encrypt: creds.encrypt !== undefined ? creds.encrypt : true,
          sslValidateCertificate: creds.sslValidateCertificate !== undefined 
            ? creds.sslValidateCertificate 
            : false,
          sslCryptoProvider: creds.sslCryptoProvider || 'openssl',
          sslTrustStore: creds.sslTrustStore || creds.certificate
        };
      }
    } catch (error) {
      console.warn('Failed to parse VCAP_SERVICES, falling back to environment variables:', error.message);
    }
  }
  
  // Fallback to environment variables (for local development)
  const requiredEnvVars = ['HANA_HOST', 'HANA_PORT', 'HANA_USER', 'HANA_PASSWORD', 'HANA_DATABASE'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please set these variables or bind a HANA Cloud service in Cloud Foundry.\n' +
      'Required: HANA_HOST, HANA_PORT, HANA_USER, HANA_PASSWORD, HANA_DATABASE'
    );
  }
  
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
  
  return {
    serverNode: `${process.env.HANA_HOST}:${process.env.HANA_PORT || 443}`,
    uid: process.env.HANA_USER,
    pwd: process.env.HANA_PASSWORD,
    databaseName: process.env.HANA_DATABASE,
    encrypt: parseBoolean(process.env.HANA_ENCRYPT, true),
    sslValidateCertificate: parseBoolean(process.env.HANA_SSL_VALIDATE_CERT, false),
    sslCryptoProvider: process.env.HANA_SSL_CRYPTO_PROVIDER || 'openssl',
    sslTrustStore: process.env.HANA_SSL_TRUST_STORE
  };
};

const config = getDatabaseConfig();

let connection = null;

/**
 * Get HANA database connection
 */
const getConnection = async () => {
  if (!connection) {
    connection = hana.createConnection();
    await new Promise((resolve, reject) => {
      connection.connect(config, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  return connection;
};

/**
 * Execute a query with parameters
 * Provides a compatible interface similar to mssql's request().input().query()
 */
const executeQuery = async (query, params = {}) => {
  const conn = await getConnection();
  
  return new Promise((resolve, reject) => {
    // Convert SQL Server specific syntax to HANA first
    let hanaQuery = query
      .replace(/TOP\s*\(\s*(\d+)\s*\)/gi, 'LIMIT $1') // TOP(n) -> LIMIT n
      .replace(/dbo\./g, '') // Remove schema prefix
      .replace(/NVARCHAR\(MAX\)/gi, 'NCLOB') // NVARCHAR(MAX) -> NCLOB
      .replace(/DATETIME2/gi, 'TIMESTAMP') // DATETIME2 -> TIMESTAMP
      .replace(/BIT/gi, 'TINYINT'); // BIT -> TINYINT (0/1)
    
    // Replace @paramName with ? placeholders and build parameter array
    // Process in reverse order of param names to avoid partial replacements
    const paramNames = Object.keys(params).sort((a, b) => b.length - a.length);
    const hanaParams = [];
    const paramOrder = [];
    
    // Find all parameter references and their positions
    const paramMatches = [];
    paramNames.forEach((paramName) => {
      const regex = new RegExp(`@${paramName}\\b`, 'g');
      let match;
      while ((match = regex.exec(hanaQuery)) !== null) {
        paramMatches.push({
          name: paramName,
          index: match.index,
          length: match[0].length
        });
      }
    });
    
    // Sort matches by position (reverse order for replacement)
    paramMatches.sort((a, b) => b.index - a.index);
    
    // Replace parameters from end to start to maintain indices
    paramMatches.forEach((match) => {
      hanaQuery = hanaQuery.substring(0, match.index) + '?' + hanaQuery.substring(match.index + match.length);
      paramOrder.push(params[match.name]);
    });
    
    // If no parameters found, try simple replacement
    if (paramOrder.length === 0 && paramNames.length > 0) {
      paramNames.forEach((paramName) => {
        const regex = new RegExp(`@${paramName}\\b`, 'g');
        if (regex.test(hanaQuery)) {
          hanaQuery = hanaQuery.replace(regex, '?');
          paramOrder.push(params[paramName]);
        }
      });
    }
    
    conn.exec(hanaQuery, paramOrder, (err, rows) => {
      if (err) {
        console.error('Query error:', err);
        console.error('Query:', hanaQuery);
        console.error('Params:', paramOrder);
        reject(err);
      } else {
        resolve({ recordset: rows || [] });
      }
    });
  });
};

/**
 * Create a request object compatible with mssql API
 */
const createRequest = () => {
  const inputs = {};
  const request = {
    input: (name, type, value) => {
      inputs[name] = value;
      return request;
    },
    query: async (sql) => {
      return await executeQuery(sql, inputs);
    }
  };
  return request;
};

/**
 * Get pool-like interface for compatibility
 */
const getPool = async () => {
  await getConnection();
  return {
    request: () => createRequest()
  };
};

/**
 * SQL type constants for compatibility with controllers
 */
const sql = {
  NVarChar: (length) => ({ type: 'NVarChar', length }),
  DateTime2: { type: 'DateTime2' },
  Decimal: (precision, scale) => ({ type: 'Decimal', precision, scale }),
  Bit: { type: 'Bit' },
  MAX: 2147483647 // Maximum length for NCLOB
};

/**
 * Helper to run a statement against the current connection
 */
const execStatement = (conn, statement, params = []) => {
  return new Promise((resolve, reject) => {
    conn.exec(statement, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * Check if a table already exists in the current schema
 */
const tableExists = async (conn, tableName) => {
  const result = await execStatement(
    conn,
    `
      SELECT COUNT(*) AS CNT
      FROM TABLES
      WHERE TABLE_NAME = ?
        AND SCHEMA_NAME = CURRENT_SCHEMA
    `,
    [tableName.toUpperCase()]
  );
  return result[0].CNT > 0;
};

/**
 * Check if an index already exists in the current schema
 */
const indexExists = async (conn, indexName) => {
  const result = await execStatement(
    conn,
    `
      SELECT COUNT(*) AS CNT
      FROM INDEXES
      WHERE INDEX_NAME = ?
        AND SCHEMA_NAME = CURRENT_SCHEMA
    `,
    [indexName.toUpperCase()]
  );
  return result[0].CNT > 0;
};

/**
 * Create a table only when it does not exist
 */
const createTableIfNotExists = async (conn, tableName, createSQL) => {
  if (await tableExists(conn, tableName)) {
    console.log(`Table ${tableName} already exists.`);
    return;
  }
  await execStatement(conn, createSQL);
  console.log(`Table ${tableName} created.`);
};

/**
 * Create an index only when it does not exist
 */
const createIndexIfNotExists = async (conn, indexName, createSQL) => {
  if (await indexExists(conn, indexName)) {
    console.log(`Index ${indexName} already exists.`);
    return;
  }
  await execStatement(conn, createSQL);
  console.log(`Index ${indexName} created.`);
};

/**
 * Ensure database schema exists (HANA-compatible SQL)
 */
const ensureSchema = async () => {
  const conn = await getConnection();
  
  const tableDefinitions = [
    {
      name: 'Users',
      sql: `CREATE TABLE Users (
      Id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      Name NVARCHAR(150) NOT NULL,
      Email NVARCHAR(255) NOT NULL UNIQUE,
      PasswordHash NVARCHAR(255) NOT NULL,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    },
    {
      name: 'ParameterMaster',
      sql: `CREATE TABLE ParameterMaster (
      Id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      ParameterType NVARCHAR(100) NOT NULL,
      ParameterName NVARCHAR(150) NOT NULL,
      ProcessProduct NVARCHAR(150) NOT NULL,
      SpecCharacteristic NVARCHAR(150) NOT NULL,
      ParameterCode NVARCHAR(100) NOT NULL,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    },
    {
      name: 'ProductInspections',
      sql: `CREATE TABLE ProductInspections (
      Id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      ItemId NVARCHAR(100) NOT NULL,
      ItemDescription NVARCHAR(255) NOT NULL,
      ProductionOrderNo NVARCHAR(100),
      ReceiptFromProduction NVARCHAR(150),
      InspectedBy NVARCHAR(150),
      ControlPlanNo NVARCHAR(100),
      ContainerBagNo NVARCHAR(100),
      BottlePelletNo NVARCHAR(100),
      DocNumber NVARCHAR(50),
      InspectionDate TIMESTAMP,
      ProductionOrderDate TIMESTAMP,
      SampleQty DECIMAL(18,4) DEFAULT 0 NOT NULL,
      Department NVARCHAR(150),
      PreProduction TINYINT DEFAULT 0 NOT NULL,
      ProducedQty DECIMAL(18,4) DEFAULT 0 NOT NULL,
      AcceptedQty DECIMAL(18,4) DEFAULT 0 NOT NULL,
      RejectedQty DECIMAL(18,4) DEFAULT 0 NOT NULL,
      Status NVARCHAR(100),
      Remarks NVARCHAR(255),
      SpecialInstructions NCLOB,
      Details NCLOB NOT NULL,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    },
    {
      name: 'IncomingMaterialInspections',
      sql: `CREATE TABLE IncomingMaterialInspections (
      Id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      InwardType NVARCHAR(100),
      GrnType NVARCHAR(100),
      SupplierVendor NVARCHAR(255),
      ReworkLocation TINYINT DEFAULT 0 NOT NULL,
      InspectionRequired TINYINT DEFAULT 0 NOT NULL,
      TestCertificate TINYINT DEFAULT 0 NOT NULL,
      CorrActionRequired TINYINT DEFAULT 0 NOT NULL,
      Remarks NVARCHAR(255),
      Details NCLOB NOT NULL,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    },
    {
      name: 'ProductInspectionPlans',
      sql: `CREATE TABLE ProductInspectionPlans (
      Id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      ItemId NVARCHAR(100) NOT NULL,
      ItemDescription NVARCHAR(255) NOT NULL,
      PlanType NVARCHAR(100),
      Frequency NVARCHAR(100),
      Customer NVARCHAR(150),
      ContactPerson NVARCHAR(150),
      SupplierPlant NVARCHAR(150),
      CustomerApproval NVARCHAR(150),
      DocNumber NVARCHAR(50),
      PlanDate TIMESTAMP,
      SampleSize DECIMAL(18,4) DEFAULT 0 NOT NULL,
      PreparedBy NVARCHAR(150),
      RevisionNumber NVARCHAR(50),
      Remarks NVARCHAR(255),
      Details NCLOB NOT NULL,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    },
    {
      name: 'IncomingMaterialInspectionPlans',
      sql: `CREATE TABLE IncomingMaterialInspectionPlans (
      Id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      ItemId NVARCHAR(100) NOT NULL,
      ItemDescription NVARCHAR(255) NOT NULL,
      DocNumber NVARCHAR(50),
      DocDate TIMESTAMP,
      RevisionNumber NVARCHAR(50),
      PreparedBy NVARCHAR(150),
      Remarks NVARCHAR(255),
      Details NCLOB NOT NULL,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    }
  ];

  const indexDefinitions = [
    {
      name: 'IX_ParameterMaster_CreatedAt',
      sql: `CREATE INDEX IX_ParameterMaster_CreatedAt ON ParameterMaster (CreatedAt DESC)`
    },
    {
      name: 'IX_ProductInspections_CreatedAt',
      sql: `CREATE INDEX IX_ProductInspections_CreatedAt ON ProductInspections (CreatedAt DESC)`
    },
    {
      name: 'IX_IncomingMaterialInspections_CreatedAt',
      sql: `CREATE INDEX IX_IncomingMaterialInspections_CreatedAt ON IncomingMaterialInspections (CreatedAt DESC)`
    },
    {
      name: 'IX_ProductInspectionPlans_CreatedAt',
      sql: `CREATE INDEX IX_ProductInspectionPlans_CreatedAt ON ProductInspectionPlans (CreatedAt DESC)`
    },
    {
      name: 'IX_IncomingMaterialInspectionPlans_CreatedAt',
      sql: `CREATE INDEX IX_IncomingMaterialInspectionPlans_CreatedAt ON IncomingMaterialInspectionPlans (CreatedAt DESC)`
    }
  ];
  
  try {
    for (const { name, sql } of tableDefinitions) {
      await createTableIfNotExists(conn, name, sql);
    }

    for (const { name, sql } of indexDefinitions) {
      await createIndexIfNotExists(conn, name, sql);
    }
    
    console.log('Database schema initialized successfully.');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
};

module.exports = {
  sql,
  getPool,
  getConnection,
  ensureSchema
};
