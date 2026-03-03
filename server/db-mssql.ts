import sql from "mssql";

if (!process.env.AZURE_SQL_CONNECTION_STRING) {
  throw new Error("AZURE_SQL_CONNECTION_STRING must be set for Azure SQL.");
}

const config: sql.config = {
  connectionString: process.env.AZURE_SQL_CONNECTION_STRING,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect();
  }
  return poolPromise;
}

export { sql };
