const bcrypt = require("bcryptjs");

const pool = require("../config/database");

async function createTechnician(
  request,
  response,
  next
) {
  const client = await pool.connect();

  try {
    const {
      fullName,
      email,
      phone,
      password,
      employeeCode,
      specialization,
      serviceIds
    } = request.body;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedEmployeeCode =
      employeeCode.trim().toUpperCase();

    const uniqueServiceIds = [
      ...new Set(serviceIds.map(Number))
    ];

    await client.query("BEGIN");

    const existingRecord = await client.query(
      `
        SELECT id
        FROM users
        WHERE email = $1 OR phone = $2

        UNION ALL

        SELECT user_id AS id
        FROM technician_profiles
        WHERE employee_code = $3

        LIMIT 1
      `,
      [
        normalizedEmail,
        normalizedPhone,
        normalizedEmployeeCode
      ]
    );

    if (existingRecord.rows.length > 0) {
      await client.query("ROLLBACK");

      response.status(409).json({
        success: false,
        message:
          "The email, telephone number or employee code is already in use."
      });

      return;
    }

    const servicesResult = await client.query(
      `
        SELECT id
        FROM services
        WHERE
          id = ANY($1::INTEGER[])
          AND is_active = TRUE
      `,
      [uniqueServiceIds]
    );

    if (
      servicesResult.rows.length !==
      uniqueServiceIds.length
    ) {
      await client.query("ROLLBACK");

      response.status(400).json({
        success: false,
        message:
          "One or more selected services are invalid or inactive."
      });

      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userResult = await client.query(
      `
        INSERT INTO users (
          full_name,
          email,
          phone,
          password_hash,
          role
        )
        VALUES ($1, $2, $3, $4, 'technician')
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

    const technician = userResult.rows[0];

    await client.query(
      `
        INSERT INTO technician_profiles (
          user_id,
          employee_code,
          specialization,
          availability_status
        )
        VALUES ($1, $2, $3, 'available')
      `,
      [
        technician.id,
        normalizedEmployeeCode,
        specialization.trim()
      ]
    );

    await client.query(
      `
        INSERT INTO technician_skills (
          technician_id,
          service_id
        )
        SELECT $1, unnest($2::INTEGER[])
      `,
      [
        technician.id,
        uniqueServiceIds
      ]
    );

    await client.query("COMMIT");

    response.status(201).json({
      success: true,
      message: "Technician account created successfully.",
      technician: {
        ...technician,
        employeeCode: normalizedEmployeeCode,
        specialization: specialization.trim(),
        availabilityStatus: "available",
        serviceIds: uniqueServiceIds
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      response.status(409).json({
        success: false,
        message:
          "The email, telephone number or employee code is already in use."
      });

      return;
    }

    next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  createTechnician
};