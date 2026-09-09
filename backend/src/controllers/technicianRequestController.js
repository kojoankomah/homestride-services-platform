const pool = require("../config/database");

async function getAssignedRequests(
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
          customer.phone AS customer_phone,
          customer_addresses.address_line,
          customer_addresses.city,
          customer_addresses.region,
          customer_addresses.landmark
        FROM service_requests
        INNER JOIN services
          ON services.id = service_requests.service_id
        INNER JOIN users AS customer
          ON customer.id = service_requests.customer_id
        INNER JOIN customer_addresses
          ON customer_addresses.id =
            service_requests.address_id
        WHERE
          service_requests.assigned_technician_id = $1
        ORDER BY
          service_requests.preferred_date ASC,
          service_requests.preferred_time ASC
      `,
      [request.user.id]
    );

    const assignedRequests = result.rows.map((item) => ({
      id: item.id,
      service: {
        id: item.service_id,
        name: item.service_name
      },
      customer: {
        id: item.customer_id,
        name: item.customer_name,
        phone: item.customer_phone
      },
      address: {
        id: item.address_id,
        addressLine: item.address_line,
        city: item.city,
        region: item.region,
        landmark: item.landmark
      },
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
      count: assignedRequests.length,
      assignedRequests
    });
  } catch (error) {
    next(error);
  }
}


async function updateRequestStatus(
  request,
  response,
  next
) {
  const client = await pool.connect();

  try {
    const requestId = Number(request.params.requestId);
    const newStatus = request.body.status;
    const note = request.body.note?.trim() || null;

    if (!Number.isInteger(requestId) || requestId < 1) {
      response.status(400).json({
        success: false,
        message: "The service request ID is invalid."
      });

      return;
    }

    if (
      !["in_progress", "completed"].includes(newStatus)
    ) {
      response.status(400).json({
        success: false,
        message:
          "Technicians can only use in_progress or completed."
      });

      return;
    }

    await client.query("BEGIN");

    const result = await client.query(
      `
        SELECT id, status
        FROM service_requests
        WHERE
          id = $1
          AND assigned_technician_id = $2
        FOR UPDATE
      `,
      [
        requestId,
        request.user.id
      ]
    );

    const serviceRequest = result.rows[0];

    if (!serviceRequest) {
      await client.query("ROLLBACK");

      response.status(404).json({
        success: false,
        message:
          "This request was not found among your assigned jobs."
      });

      return;
    }

    const allowedTransition =
      (
        serviceRequest.status === "assigned" &&
        newStatus === "in_progress"
      ) ||
      (
        serviceRequest.status === "in_progress" &&
        newStatus === "completed"
      );

    if (!allowedTransition) {
      await client.query("ROLLBACK");

      response.status(409).json({
        success: false,
        message:
          `The request cannot change from ${serviceRequest.status} to ${newStatus}.`
      });

      return;
    }

    await client.query(
    `
        UPDATE service_requests
        SET
        status = $1::VARCHAR(20),
        completed_at = CASE
            WHEN $1::VARCHAR(20) = 'completed'
            THEN CURRENT_TIMESTAMP
            ELSE completed_at
        END
        WHERE id = $2
    `,
    [
        newStatus,
        requestId
    ]
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
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        requestId,
        request.user.id,
        serviceRequest.status,
        newStatus,
        note
      ]
    );

    if (newStatus === "completed") {
      await client.query(
        `
          UPDATE technician_profiles
          SET availability_status = 'available'
          WHERE user_id = $1
        `,
        [request.user.id]
      );
    }

    await client.query("COMMIT");

    response.status(200).json({
      success: true,
      message: `Request status updated to ${newStatus}.`,
      serviceRequest: {
        id: requestId,
        previousStatus: serviceRequest.status,
        status: newStatus
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
  getAssignedRequests,
  updateRequestStatus
};