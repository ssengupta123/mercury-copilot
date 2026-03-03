import sql from "mssql";

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    const connStr = process.env.AZURE_SQL_CONNECTION_STRING;
    if (!connStr) {
      throw new Error("AZURE_SQL_CONNECTION_STRING must be set for Azure SQL.");
    }
    poolPromise = new sql.ConnectionPool(connStr).connect();
  }
  return poolPromise;
}

export { sql };
