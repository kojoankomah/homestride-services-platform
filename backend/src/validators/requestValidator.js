function validateServiceRequest(request, response, next) {
  const {
    serviceId,
    addressId,
    preferredDate,
    preferredTime,
    problemDescription
  } = request.body;

  const errors = {};

  const parsedServiceId = Number(serviceId);
  const parsedAddressId = Number(addressId);

  if (
    !Number.isInteger(parsedServiceId) ||
    parsedServiceId < 1
  ) {
    errors.serviceId = "Please select a valid service.";
  }

  if (
    !Number.isInteger(parsedAddressId) ||
    parsedAddressId < 1
  ) {
    errors.addressId = "Please select a valid address.";
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (
    typeof preferredDate !== "string" ||
    !datePattern.test(preferredDate)
  ) {
    errors.preferredDate =
      "Please enter a valid preferred date.";
  } else {
    const selectedDate = new Date(
      `${preferredDate}T00:00:00`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate < today
    ) {
      errors.preferredDate =
        "The preferred date cannot be in the past.";
    }
  }

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (
    typeof preferredTime !== "string" ||
    !timePattern.test(preferredTime)
  ) {
    errors.preferredTime =
      "Please enter a valid preferred time.";
  }

  if (
    typeof problemDescription !== "string" ||
    problemDescription.trim().length < 20
  ) {
    errors.problemDescription =
      "Please provide at least 20 characters describing the work required.";
  }

  if (Object.keys(errors).length > 0) {
    response.status(400).json({
      success: false,
      message:
        "Please correct the service-request details.",
      errors
    });

    return;
  }

  next();
}

module.exports = validateServiceRequest;