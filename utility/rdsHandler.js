const { Client } = require("pg");
const { getRdsAddress } = require("./paramHandler");
const { getRDSSecret } = require("./secretHandler");

async function retrievePresets(email) {
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

    // Query the database for the preset associated with the email
    const result = await client.query("SELECT preset FROM creature_presets WHERE email = $1", [email]);

    // If a result is found, return the preset JSONB
    if (result.rows.length > 0) {
      return result.rows[0].preset; // JSONB object
    } else {
      return null; // No preset found for this email
    }
  } catch (err) {
    console.error("Error fetching preset:", err);
    throw err;
  } finally {
    // Always close the database connection
    await client.end();
  }
}

async function createTable() {
  const password = await getRDSSecret();
  const address = await getRdsAddress();

  const client = new Client({
    host: address, // Retrieve RDS address
    user: process.env.RDS_USER, // Environment variable for RDS user
    password: password, // Use the awaited secret for password
    database: "postgres", // Database name
    port: 5432, // Default PostgreSQL port
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // SQL statement to create the table
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS creature_presets (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          preset JSONB NOT NULL
        );
      `;

    // Execute the SQL query to create the table
    await client.query(createTableQuery);
    console.log("Table 'creature_presets' created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
    throw err;
  } finally {
    // Always close the database connection
    await client.end();
  }
}

async function upsertPreset(email, newPresetData) {
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

    // Insert a new row or update the existing one
    const upsertQuery = `
      INSERT INTO creature_presets (email, preset)
      VALUES ($1, $2)
      ON CONFLICT (email) 
      DO UPDATE SET preset = $2;
    `;

    const result = await client.query(upsertQuery, [email, newPresetData]);

    if (result.rowCount > 0) {
      console.log("Preset upserted successfully.");
    }
  } catch (err) {
    console.error("Error upserting preset:", err);
    throw err;
  } finally {
    await client.end();
  }
}

module.exports = { retrievePresets, createTable, upsertPreset };
