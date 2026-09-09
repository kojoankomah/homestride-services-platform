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

async function getTechnicians(request, response, next) {
  try {
    const result = await pool.query(
      `
        SELECT
          users.id,
          users.full_name,
          users.email,
          users.phone,
          users.is_active,
          technician_profiles.employee_code,
          technician_profiles.specialization,
          technician_profiles.availability_status,
          COALESCE(
            json_agg(
              json_build_object(
                'id', services.id,
                'name', services.name
              )
              ORDER BY services.name
            ) FILTER (WHERE services.id IS NOT NULL),
            '[]'
          ) AS skills
        FROM users
        INNER JOIN technician_profiles
          ON technician_profiles.user_id = users.id
        LEFT JOIN technician_skills
          ON technician_skills.technician_id = users.id
        LEFT JOIN services
          ON services.id = technician_skills.service_id
        WHERE
          users.role = 'technician'
          AND users.is_active = TRUE
        GROUP BY
          users.id,
          technician_profiles.user_id
        ORDER BY users.full_name ASC
      `
    );

    response.status(200).json({
      success: true,
      count: result.rows.length,
      technicians: result.rows.map((technician) => ({
        id: technician.id,
        fullName: technician.full_name,
        email: technician.email,
        phone: technician.phone,
        employeeCode: technician.employee_code,
        specialization: technician.specialization,
        availabilityStatus:
          technician.availability_status,
        isActive: technician.is_active,
        skills: technician.skills
      }))
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTechnician,
  getTechnicians
};