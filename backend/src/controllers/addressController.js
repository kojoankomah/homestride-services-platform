const pool = require("../config/database");

function formatAddress(address) {
  return {
    id: address.id,
    customerId: address.customer_id,
    label: address.label,
    addressLine: address.address_line,
    city: address.city,
    region: address.region,
    landmark: address.landmark,
    createdAt: address.created_at
  };
}

async function createAddress(request, response, next) {
  try {
    const {
      label,
      addressLine,
      city,
      region,
      landmark
    } = request.body;

    const result = await pool.query(
      `
        INSERT INTO customer_addresses (
          customer_id,
          label,
          address_line,
          city,
          region,
          landmark
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        request.user.id,
        label.trim(),
        addressLine.trim(),
        city.trim(),
        region.trim(),
        landmark?.trim() || null
      ]
    );

    response.status(201).json({
      success: true,
      message: "Service address saved successfully.",
      address: formatAddress(result.rows[0])
    });
  } catch (error) {
    next(error);
  }
}

async function getMyAddresses(request, response, next) {
  try {
    const result = await pool.query(
      `
        SELECT *
        FROM customer_addresses
        WHERE customer_id = $1
        ORDER BY created_at DESC
      `,
      [request.user.id]
    );

    const addresses = result.rows.map(formatAddress);

    response.status(200).json({
      success: true,
      count: addresses.length,
      addresses
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAddress,
  getMyAddresses
};