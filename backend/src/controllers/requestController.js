const pool = require("../config/database");

async function createServiceRequest(
  request,
  response,
  next
) {
  const client = await pool.connect();

  try {
    const {
      serviceId,
      addressId,
      preferredDate,
      preferredTime,
      problemDescription
    } = request.body;

    await client.query("BEGIN");

    const serviceResult = await client.query(
      `
        SELECT id, name
        FROM services
        WHERE id = $1 AND is_active = TRUE
        LIMIT 1
      `,
      [Number(serviceId)]
    );

    if (serviceResult.rows.length === 0) {
      await client.query("ROLLBACK");

      response.status(404).json({
        success: false,
        message: "The selected service is unavailable."
      });

      return;
    }

    const addressResult = await client.query(
      `
        SELECT id
        FROM customer_addresses
        WHERE id = $1 AND customer_id = $2
        LIMIT 1
      `,
      [
        Number(addressId),
        request.user.id
      ]
    );

    if (addressResult.rows.length === 0) {
      await client.query("ROLLBACK");

      response.status(404).json({
        success: false,
        message:
          "The selected address was not found in your account."
      });

      return;
    }

    const requestResult = await client.query(
      `
        INSERT INTO service_requests (
          customer_id,
          service_id,
          address_id,
          preferred_date,
          preferred_time,
          problem_description,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *
      `,
      [
        request.user.id,
        Number(serviceId),
        Number(addressId),
        preferredDate,
        preferredTime,
        problemDescription.trim()
      ]
    );

    const newRequest = requestResult.rows[0];

    await client.query(
      `
        INSERT INTO status_history (
          request_id,
          changed_by,
          previous_status,
          new_status,
          note
        )
        VALUES ($1, $2, NULL, 'pending', $3)
      `,
      [
        newRequest.id,
        request.user.id,
        "Service request submitted by customer."
      ]
    );

    await client.query("COMMIT");

    response.status(201).json({
      success: true,
      message: "Service request submitted successfully.",
      serviceRequest: {
        id: newRequest.id,
        customerId: newRequest.customer_id,
        serviceId: newRequest.service_id,
        addressId: newRequest.address_id,
        assignedTechnicianId:
          newRequest.assigned_technician_id,
        preferredDate: newRequest.preferred_date,
        preferredTime: newRequest.preferred_time,
        problemDescription:
          newRequest.problem_description,
        status: newRequest.status,
        adminNote: newRequest.admin_note,
        createdAt: newRequest.created_at,
        updatedAt: newRequest.updated_at
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}


async function getMyServiceRequests(
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
          services.base_price,
          customer_addresses.label AS address_label,
          customer_addresses.address_line,
          customer_addresses.city,
          customer_addresses.region,
          customer_addresses.landmark,
          technician.full_name AS technician_name
        FROM service_requests
        INNER JOIN services
          ON services.id = service_requests.service_id
        INNER JOIN customer_addresses
          ON customer_addresses.id =
            service_requests.address_id
        LEFT JOIN users AS technician
          ON technician.id =
            service_requests.assigned_technician_id
        WHERE service_requests.customer_id = $1
        ORDER BY service_requests.created_at DESC
      `,
      [request.user.id]
    );

    response.status(200).json({
      success: true,
      count: result.rows.length,
      serviceRequests: result.rows.map((item) => ({
        id: item.id,
        service: {
          id: item.service_id,
          name: item.service_name,
          basePrice: Number(item.base_price)
        },
        address: {
          id: item.address_id,
          label: item.address_label,
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
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function getMyServiceRequestById(
  request,
  response,
  next
) {
  try {
    const requestId = Number(request.params.requestId);

    if (!Number.isInteger(requestId) || requestId < 1) {
      response.status(400).json({
        success: false,
        message: "The service request ID is invalid."
      });

      return;
    }

    const requestResult = await pool.query(
      `
        SELECT
          service_requests.*,
          services.name AS service_name,
          services.base_price,
          customer_addresses.label AS address_label,
          customer_addresses.address_line,
          customer_addresses.city,
          customer_addresses.region,
          customer_addresses.landmark,
          technician.full_name AS technician_name
        FROM service_requests
        INNER JOIN services
          ON services.id = service_requests.service_id
        INNER JOIN customer_addresses
          ON customer_addresses.id =
            service_requests.address_id
        LEFT JOIN users AS technician
          ON technician.id =
            service_requests.assigned_technician_id
        WHERE
          service_requests.id = $1
          AND service_requests.customer_id = $2
        LIMIT 1
      `,
      [
        requestId,
        request.user.id
      ]
    );

    const item = requestResult.rows[0];

    if (!item) {
      response.status(404).json({
        success: false,
        message: "The service request was not found."
      });

      return;
    }

    const historyResult = await pool.query(
      `
        SELECT
          status_history.id,
          status_history.previous_status,
          status_history.new_status,
          status_history.note,
          status_history.created_at,
          users.full_name AS changed_by_name
        FROM status_history
        LEFT JOIN users
          ON users.id = status_history.changed_by
        WHERE status_history.request_id = $1
        ORDER BY status_history.created_at ASC
      `,
      [requestId]
    );

    response.status(200).json({
      success: true,
      serviceRequest: {
        id: item.id,
        service: {
          id: item.service_id,
          name: item.service_name,
          basePrice: Number(item.base_price)
        },
        address: {
          id: item.address_id,
          label: item.address_label,
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
        completedAt: item.completed_at,
        statusHistory: historyResult.rows.map(
          (history) => ({
            id: history.id,
            previousStatus: history.previous_status,
            newStatus: history.new_status,
            note: history.note,
            changedBy: history.changed_by_name,
            createdAt: history.created_at
          })
        )
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createServiceRequest,
  getMyServiceRequests,
  getMyServiceRequestById
};