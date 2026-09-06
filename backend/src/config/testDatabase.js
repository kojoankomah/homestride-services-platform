require("dotenv").config({ quiet: true });

const pool = require("./database");

async function testDatabaseConnection() {
  try {
    const databaseResult = await pool.query(
      "SELECT current_database() AS database_name"
    );

    const servicesResult = await pool.query(
      "SELECT COUNT(*)::INTEGER AS service_count FROM services"
    );

    console.log(
      `Connected to database: ${databaseResult.rows[0].database_name}`
    );

    console.log(
      `Services found: ${servicesResult.rows[0].service_count}`
    );
  } catch (error) {
    console.error("Database connection failed:", error.message);
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();