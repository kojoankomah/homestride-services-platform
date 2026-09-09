const pool = require("../config/database");

async function getAllServiceRequests(
  request,
  response,
  next
) {
  try {
    const result = await pool.query(
      `
        SELECT
          service_requests.*,
          services.name AS service_name,
          customer.full_name AS customer_name,
          customer.email AS customer_email,
          customer.phone AS customer_phone,
          customer_addresses.address_line,
          customer_addresses.city,
          customer_addresses.region,
          customer_addresses.landmark,
          technician.full_name AS technician_name
        FROM service_requests
        INNER JOIN services
          ON services.id = service_requests.service_id
        INNER JOIN users AS customer
          ON customer.id = service_requests.customer_id
        INNER JOIN customer_addresses
          ON customer_addresses.id =
            service_requests.address_id
        LEFT JOIN users AS technician
          ON technician.id =
            service_requests.assigned_technician_id
        ORDER BY service_requests.created_at DESC
      `
    );

    const serviceRequests = result.rows.map((item) => ({
      id: item.id,
      customer: {
        id: item.customer_id,
        name: item.customer_name,
        email: item.customer_email,
        phone: item.customer_phone
      },
      service: {
        id: item.service_id,
        name: item.service_name
      },
      address: {
        id: item.address_id,
        addressLine: item.address_line,
        city: item.city,
        region: item.region,
        landmark: item.landmark
      },
      technician: item.assigned_technician_id
        ? {
            id: item.assigned_technician_id,
            name: item.technician_name
          }
        : null,
      preferredDate: item.preferred_date,
      preferredTime: item.preferred_time,
      problemDescription: item.problem_description,
      status: item.status,
      adminNote: item.admin_note,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      completedAt: item.completed_at
    }));

    response.status(200).json({
      success: true,
      count: serviceRequests.length,
      serviceRequests
    });
  } catch (error) {
    next(error);
  }
}

async function assignTechnician(
  request,
  response,
  next
) {
  const client = await pool.connect();

  try {
    const requestId = Number(request.params.requestId);
    const technicianId = Number(request.body.technicianId);
    const adminNote = request.body.adminNote?.trim() || null;

    if (!Number.isInteger(requestId) || requestId < 1) {
      response.status(400).json({
        success: false,
        message: "The service request ID is invalid."
      });

      return;
    }

    if (
      !Number.isInteger(technicianId) ||
      technicianId < 1
    ) {
      response.status(400).json({
        success: false,
        message: "Please select a valid technician."
      });

      return;
    }

    await client.query("BEGIN");

    const requestResult = await client.query(
      `
        SELECT id, service_id, status
        FROM service_requests
        WHERE id = $1
        FOR UPDATE
      `,
      [requestId]
    );

    const serviceRequest = requestResult.rows[0];

    if (!serviceRequest) {
      await client.query("ROLLBACK");

      response.status(404).json({
        success: false,
        message: "The service request was not found."
      });

      return;
    }

    if (
      !["pending", "confirmed"].includes(
        serviceRequest.status
      )
    ) {
      await client.query("ROLLBACK");

      response.status(409).json({
        success: false,
        message:
          "Only pending or confirmed requests can be assigned."
      });

      return;
    }

    const technicianResult = await client.query(
      `
        SELECT
          users.id,
          users.full_name,
          technician_profiles.availability_status
        FROM users
        INNER JOIN technician_profiles
          ON technician_profiles.user_id = users.id
        INNER JOIN technician_skills
          ON technician_skills.technician_id = users.id
        WHERE
          users.id = $1
          AND users.role = 'technician'
          AND users.is_active = TRUE
          AND technician_profiles.availability_status =
            'available'
          AND technician_skills.service_id = $2
        LIMIT 1
      `,
      [
        technicianId,
        serviceRequest.service_id
      ]
    );

    const technician = technicianResult.rows[0];

    if (!technician) {
      await client.query("ROLLBACK");

      response.status(400).json({
        success: false,
        message:
          "The technician is unavailable or does not provide the requested service."
      });

      return;
    }

    await client.query(
      `
        UPDATE service_requests
        SET
          assigned_technician_id = $1,
          status = 'assigned',
          admin_note = $2
        WHERE id = $3
      `,
      [
        technicianId,
        adminNote,
        requestId
      ]
    );

    await client.query(
      `
        UPDATE technician_profiles
        SET availability_status = 'assigned'
        WHERE user_id = $1
      `,
      [technicianId]
    );

    await client.query(
      `
        INSERT INTO status_history (
          request_id,
          changed_by,
          previous_status,
          new_status,
          note
        )
        VALUES ($1, $2, $3, 'assigned', $4)
      `,
      [
        requestId,
        request.user.id,
        serviceRequest.status,
        adminNote ||
          `Assigned to ${technician.full_name}.`
      ]
    );

    await client.query("COMMIT");

    response.status(200).json({
      success: true,
      message: "Technician assigned successfully.",
      assignment: {
        requestId,
        status: "assigned",
        technician: {
          id: technician.id,
          name: technician.full_name
        },
        adminNote
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  getAllServiceRequests,
  assignTechnician
};