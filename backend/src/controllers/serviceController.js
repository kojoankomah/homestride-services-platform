const pool = require("../config/database");

async function getServices(request, response, next) {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          name,
          description,
          base_price,
          estimated_duration_minutes,
          is_active
        FROM services
        WHERE is_active = TRUE
        ORDER BY name ASC
      `
    );

    const services = result.rows.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      basePrice: Number(service.base_price),
      estimatedDurationMinutes:
        service.estimated_duration_minutes,
      isActive: service.is_active
    }));

    response.status(200).json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    next(error);
  }
}

async function getServiceById(request, response, next) {
  try {
    const serviceId = Number(request.params.serviceId);

    if (!Number.isInteger(serviceId) || serviceId < 1) {
      response.status(400).json({
        success: false,
        message: "The service ID is invalid."
      });

      return;
    }

    const result = await pool.query(
      `
        SELECT
          id,
          name,
          description,
          base_price,
          estimated_duration_minutes,
          is_active
        FROM services
        WHERE id = $1 AND is_active = TRUE
        LIMIT 1
      `,
      [serviceId]
    );

    const service = result.rows[0];

    if (!service) {
      response.status(404).json({
        success: false,
        message: "The requested service was not found."
      });

      return;
    }

    response.status(200).json({
      success: true,
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
        basePrice: Number(service.base_price),
        estimatedDurationMinutes:
          service.estimated_duration_minutes,
        isActive: service.is_active
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getServices,
  getServiceById
};