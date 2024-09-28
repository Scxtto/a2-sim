const { Client } = require("pg");
const { getRdsAddress } = require("./paramHandler");
const { getRDSSecret } = require("./secretHandler");

async function createHistoryTable() {
  const password = await getRDSSecret();
  const address = await getRdsAddress();

  const client = new Client({
    host: address,
    user: process.env.RDS_USER,
    password: password,
    database: "postgres",
    port: 5432,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    //const dropTableQuery = `DROP TABLE IF EXISTS history;`;
    // SQL statement to create the history table
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS history (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          sim_uuid UUID NOT NULL,
          datetime TIMESTAMP NOT NULL,
          compute_cost DECIMAL(10, 2) NOT NULL,
          status VARCHAR(50) NOT NULL,
          node_type VARCHAR(50),
          result_size DECIMAL(10, 2),
          duration DECIMAL(10, 2),
          failure_reason VARCHAR(255)
        );
      `;

    // Execute the SQL query to create the table
    //await client.query(dropTableQuery);
    await client.query(createTableQuery);
    console.log("Table 'history' created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
    throw err;
  } finally {
    await client.end();
  }
}

async function retrieveHistory(email) {
  const password = await getRDSSecret();
  const address = await getRdsAddress();

  const client = new Client({
    host: address,
    user: process.env.RDS_USER,
    password: password,
    database: "postgres",
    port: 5432,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Query the database for the history associated with the email
    const result = await client.query("SELECT * FROM history WHERE email = $1", [email]);

    // If results are found, return them
    if (result.rows.length > 0) {
      return result.rows;
    } else {
      return null; // No history found for this email
    }
  } catch (err) {
    console.error("Error fetching history:", err);
    throw err;
  } finally {
    await client.end();
  }
}

async function retrieveAllHistory() {
  const password = await getRDSSecret();
  const address = await getRdsAddress();

  const client = new Client({
    host: address,
    user: process.env.RDS_USER,
    password: password,
    database: "postgres",
    port: 5432,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Query the database for the history associated with the email
    const result = await client.query("SELECT * FROM history ");

    //console.log(result.rows);
    //console.log("History retrieved successfully");

    // If results are found, return them
    if (result.rows.length > 0) {
      return result.rows;
    } else {
      return null; // No history found for this email
    }
  } catch (err) {
    console.error("Error fetching history:", err);
    throw err;
  } finally {
    await client.end();
  }
}

async function insertHistoryRecord(
  email,
  simUUID,
  computeCost,
  datetime,
  status,
  nodeType = null,
  resultSize = null,
  duration = null,
  failureReason = null
) {
  const password = await getRDSSecret();
  const address = await getRdsAddress();

  const client = new Client({
    host: address,
    user: process.env.RDS_USER,
    password: password,
    database: "postgres",
    port: 5432, // Default PostgreSQL port
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Insert a new history record
    const insertQuery = `
      INSERT INTO history (email, sim_uuid, compute_cost, datetime, status, node_type, result_size, duration, failure_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const result = await client.query(insertQuery, [
      email,
      simUUID,
      computeCost,
      datetime,
      status,
      nodeType,
      resultSize,
      duration,
      failureReason,
    ]);

    if (result.rows.length > 0) {
      console.log("History record inserted successfully.");
      return result.rows[0];
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error inserting history record:", err);
    throw err;
  } finally {
    await client.end();
  }
}

module.exports = { retrieveHistory, retrieveAllHistory, createHistoryTable, insertHistoryRecord };
