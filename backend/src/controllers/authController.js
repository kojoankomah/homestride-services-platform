const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../config/database");

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d"
    }
  );
}

async function registerCustomer(request, response, next) {
  try {
    const {
      fullName,
      email,
      phone,
      password
    } = request.body;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    const existingUser = await pool.query(
      `
        SELECT id
        FROM users
        WHERE email = $1 OR phone = $2
        LIMIT 1
      `,
      [normalizedEmail, normalizedPhone]
    );

    if (existingUser.rows.length > 0) {
      response.status(409).json({
        success: false,
        message:
          "An account already exists with that email address or telephone number."
      });

      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
        INSERT INTO users (
          full_name,
          email,
          phone,
          password_hash,
          role
        )
        VALUES ($1, $2, $3, $4, 'customer')
        RETURNING
          id,
          full_name,
          email,
          phone,
          role,
          is_active,
          created_at
      `,
      [
        fullName.trim(),
        normalizedEmail,
        normalizedPhone,
        passwordHash
      ]
    );

    const user = result.rows[0];
    const token = createToken(user);

    response.status(201).json({
      success: true,
      message: "Customer account created successfully.",
      token,
      user
    });
  } catch (error) {
    next(error);
  }
}

async function login(request, response, next) {
  try {
    const { email, password } = request.body;
    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `
        SELECT
          id,
          full_name,
          email,
          phone,
          password_hash,
          role,
          is_active,
          created_at
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [normalizedEmail]
    );

    const user = result.rows[0];

    if (!user) {
      response.status(401).json({
        success: false,
        message: "The email address or password is incorrect."
      });

      return;
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      response.status(401).json({
        success: false,
        message: "The email address or password is incorrect."
      });

      return;
    }

    if (!user.is_active) {
      response.status(403).json({
        success: false,
        message:
          "This account is inactive. Please contact HomeStride support."
      });

      return;
    }

    const token = createToken(user);

    delete user.password_hash;

    response.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerCustomer,
  login
};