require("dotenv").config({ quiet: true });

const app = require("./src/app");
const pool = require("./src/config/database");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await pool.query("SELECT 1");

    app.listen(PORT, () => {
      console.log(`HomeStride API running on port ${PORT}`);
      console.log("PostgreSQL database connected");
    });
  } catch (error) {
    console.error("Unable to start the server:", error.message);
    process.exitCode = 1;
  }
}

startServer();