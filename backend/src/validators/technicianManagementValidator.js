function validateTechnicianUpdate(
  request,
  response,
  next
) {
  const {
    fullName,
    email,
    phone,
    employeeCode,
    specialization,
    availabilityStatus,
    serviceIds
  } = request.body;

  const errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    typeof fullName !== "string" ||
    fullName.trim().length < 2
  ) {
    errors.fullName =
      "Please enter the technician’s name.";
  }

  if (
    typeof email !== "string" ||
    !emailPattern.test(email.trim())
  ) {
    errors.email =
      "Please enter a valid email address.";
  }

  const phoneDigits =
    typeof phone === "string"
      ? phone.replace(/\D/g, "").length
      : 0;

  if (phoneDigits < 9 || phoneDigits > 15) {
    errors.phone =
      "Please enter a valid telephone number.";
  }

  if (
    typeof employeeCode !== "string" ||
    employeeCode.trim().length < 3
  ) {
    errors.employeeCode =
      "Please enter a valid employee code.";
  }

  if (
    typeof specialization !== "string" ||
    specialization.trim().length < 2
  ) {
    errors.specialization =
      "Please enter the technician’s specialization.";
  }

  const validAvailabilityStatuses = [
    "available",
    "assigned",
    "unavailable"
  ];

  if (
    !validAvailabilityStatuses.includes(
      availabilityStatus
    )
  ) {
    errors.availabilityStatus =
      "Please select a valid availability status.";
  }

  const serviceIdsAreValid =
    Array.isArray(serviceIds) &&
    serviceIds.length > 0 &&
    serviceIds.every((serviceId) => {
      const parsedId = Number(serviceId);

      return (
        Number.isInteger(parsedId) &&
        parsedId > 0
      );
    });

  if (!serviceIdsAreValid) {
    errors.serviceIds =
      "Select at least one valid service skill.";
  }

  if (Object.keys(errors).length > 0) {
    response.status(400).json({
      success: false,
      message:
        "Please correct the technician details.",
      errors
    });

    return;
  }

  next();
}

function validateTechnicianAccountStatus(
  request,
  response,
  next
) {
  if (typeof request.body.isActive !== "boolean") {
    response.status(400).json({
      success: false,
      message:
        "A valid technician account status is required.",
      errors: {
        isActive:
          "Account status must be true or false."
      }
    });

    return;
  }

  next();
}

module.exports = {
  validateTechnicianUpdate,
  validateTechnicianAccountStatus
};