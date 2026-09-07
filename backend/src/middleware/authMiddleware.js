const jwt = require("jsonwebtoken");

const pool = require("../config/database");

async function authenticate(request, response, next) {
  try {
    const authorizationHeader =
      request.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith("Bearer ")
    ) {
      response.status(401).json({
        success: false,
        message: "Authentication is required."
      });

      return;
    }

    const token = authorizationHeader.slice(7).trim();

    if (!token) {
      response.status(401).json({
        success: false,
        message: "Authentication is required."
      });

      return;
    }

    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const result = await pool.query(
      `
        SELECT
          id,
          full_name,
          email,
          phone,
          role,
          is_active,
          created_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [decodedToken.userId]
    );

    const user = result.rows[0];

    if (!user || !user.is_active) {
      response.status(401).json({
        success: false,
        message: "This account is unavailable."
      });

      return;
    }

    request.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      response.status(401).json({
        success: false,
        message:
          "Your session is invalid or has expired. Please log in again."
      });

      return;
    }

    next(error);
  }
}

module.exports = authenticate;