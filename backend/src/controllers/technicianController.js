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

async function updateTechnician(
  request,
  response,
  next
) {
  const technicianId = Number(
    request.params.technicianId
  );

  if (
    !Number.isInteger(technicianId) ||
    technicianId < 1
  ) {
    response.status(400).json({
      success: false,
      message: "A valid technician ID is required."
    });

    return;
  }

  const client = await pool.connect();

  try {
    const {
      fullName,
      email,
      phone,
      employeeCode,
      specialization,
      availabilityStatus,
      serviceIds
    } = request.body;

    const normalizedEmail =
      email.trim().toLowerCase();

    const normalizedPhone = phone.trim();

    const normalizedEmployeeCode =
      employeeCode.trim().toUpperCase();

    const uniqueServiceIds = [
      ...new Set(serviceIds.map(Number))
    ];

    await client.query("BEGIN");

    const technicianResult = await client.query(
      `
        SELECT
          users.id,
          users.is_active,
          technician_profiles.availability_status
        FROM users
        INNER JOIN technician_profiles
          ON technician_profiles.user_id = users.id
        WHERE
          users.id = $1
          AND users.role = 'technician'
        FOR UPDATE
      `,
      [technicianId]
    );

    if (technicianResult.rows.length === 0) {
      await client.query("ROLLBACK");

      response.status(404).json({
        success: false,
        message: "The technician was not found."
      });

      return;
    }

    const activeJobsResult = await client.query(
      `
        SELECT COUNT(*)::INTEGER AS count
        FROM service_requests
        WHERE
          assigned_technician_id = $1
          AND status IN (
            'confirmed',
            'assigned',
            'in_progress'
          )
      `,
      [technicianId]
    );

    const hasActiveJob =
      activeJobsResult.rows[0].count > 0;

    if (
      hasActiveJob &&
      availabilityStatus !== "assigned"
    ) {
      await client.query("ROLLBACK");

      response.status(409).json({
        success: false,
        message:
          "A technician with active assigned work must remain assigned."
      });

      return;
    }

    if (
      !hasActiveJob &&
      availabilityStatus === "assigned"
    ) {
      await client.query("ROLLBACK");

      response.status(400).json({
        success: false,
        message:
          "Assigned status can only be used when the technician has active work."
      });

      return;
    }

    const duplicateResult = await client.query(
      `
        SELECT id
        FROM users
        WHERE
          id <> $1
          AND (
            email = $2
            OR phone = $3
          )

        UNION ALL

        SELECT user_id AS id
        FROM technician_profiles
        WHERE
          user_id <> $1
          AND employee_code = $4

        LIMIT 1
      `,
      [
        technicianId,
        normalizedEmail,
        normalizedPhone,
        normalizedEmployeeCode
      ]
    );

    if (duplicateResult.rows.length > 0) {
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

    await client.query(
      `
        UPDATE users
        SET
          full_name = $1,
          email = $2,
          phone = $3
        WHERE id = $4
      `,
      [
        fullName.trim(),
        normalizedEmail,
        normalizedPhone,
        technicianId
      ]
    );

    await client.query(
      `
        UPDATE technician_profiles
        SET
          employee_code = $1,
          specialization = $2,
          availability_status = $3
        WHERE user_id = $4
      `,
      [
        normalizedEmployeeCode,
        specialization.trim(),
        availabilityStatus,
        technicianId
      ]
    );

    await client.query(
      `
        DELETE FROM technician_skills
        WHERE technician_id = $1
      `,
      [technicianId]
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
        technicianId,
        uniqueServiceIds
      ]
    );

    await client.query("COMMIT");

    response.status(200).json({
      success: true,
      message:
        "Technician details updated successfully."
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


async function updateTechnicianAccountStatus(
  request,
  response,
  next
) {
  const technicianId = Number(
    request.params.technicianId
  );

  if (
    !Number.isInteger(technicianId) ||
    technicianId < 1
  ) {
    response.status(400).json({
      success: false,
      message: "A valid technician ID is required."
    });

    return;
  }

  const { isActive } = request.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const technicianResult = await client.query(
      `
        SELECT
          users.id,
          users.is_active
        FROM users
        INNER JOIN technician_profiles
          ON technician_profiles.user_id = users.id
        WHERE
          users.id = $1
          AND users.role = 'technician'
        FOR UPDATE
      `,
      [technicianId]
    );

    if (technicianResult.rows.length === 0) {
      await client.query("ROLLBACK");

      response.status(404).json({
        success: false,
        message: "The technician was not found."
      });

      return;
    }

    if (!isActive) {
      const activeJobsResult = await client.query(
        `
          SELECT COUNT(*)::INTEGER AS count
          FROM service_requests
          WHERE
            assigned_technician_id = $1
            AND status IN (
              'confirmed',
              'assigned',
              'in_progress'
            )
        `,
        [technicianId]
      );

      if (activeJobsResult.rows[0].count > 0) {
        await client.query("ROLLBACK");

        response.status(409).json({
          success: false,
          message:
            "This technician cannot be deactivated while assigned work is active."
        });

        return;
      }
    }

    await client.query(
      `
        UPDATE users
        SET is_active = $1
        WHERE id = $2
      `,
      [
        isActive,
        technicianId
      ]
    );

    await client.query(
      `
        UPDATE technician_profiles
        SET availability_status = $1
        WHERE user_id = $2
      `,
      [
        isActive ? "available" : "unavailable",
        technicianId
      ]
    );

    await client.query("COMMIT");

    response.status(200).json({
      success: true,
      message: isActive
        ? "Technician account activated successfully."
        : "Technician account deactivated successfully."
    });
  } catch (error) {
    await client.query("ROLLBACK");
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
        WHERE users.role = 'technician'
        GROUP BY
          users.id,
          technician_profiles.user_id
        ORDER BY
          users.is_active DESC,
          users.full_name ASC
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
  updateTechnician,
  updateTechnicianAccountStatus,
  getTechnicians
};