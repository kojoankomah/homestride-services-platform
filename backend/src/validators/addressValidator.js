function validateAddress(request, response, next) {
  const {
    label,
    addressLine,
    city,
    region,
    landmark
  } = request.body;

  const errors = {};

  if (
    typeof label !== "string" ||
    label.trim().length < 2 ||
    label.trim().length > 50
  ) {
    errors.label =
      "Enter a label between 2 and 50 characters.";
  }

  if (
    typeof addressLine !== "string" ||
    addressLine.trim().length < 5
  ) {
    errors.addressLine =
      "Please enter a complete address.";
  }

  if (
    typeof city !== "string" ||
    city.trim().length < 2
  ) {
    errors.city = "Please enter the town or city.";
  }

  if (
    typeof region !== "string" ||
    region.trim().length < 2
  ) {
    errors.region = "Please enter the region.";
  }

  if (
    landmark !== undefined &&
    landmark !== null &&
    typeof landmark !== "string"
  ) {
    errors.landmark = "The landmark must be text.";
  }

  if (Object.keys(errors).length > 0) {
    response.status(400).json({
      success: false,
      message: "Please correct the address details.",
      errors
    });

    return;
  }

  next();
}

module.exports = validateAddress;