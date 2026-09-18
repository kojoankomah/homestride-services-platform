function validatePasswordChange(
  request,
  response,
  next
) {
  const {
    currentPassword,
    newPassword,
    confirmPassword
  } = request.body;

  const errors = {};

  if (
    typeof currentPassword !== "string" ||
    currentPassword.length === 0
  ) {
    errors.currentPassword =
      "Please enter your current password.";
  }

  if (
    typeof newPassword !== "string" ||
    newPassword.length < 8 ||
    !/[A-Za-z]/.test(newPassword) ||
    !/\d/.test(newPassword)
  ) {
    errors.newPassword =
      "The new password must contain at least 8 characters, including a letter and number.";
  }

  if (
    typeof newPassword === "string" &&
    newPassword === currentPassword
  ) {
    errors.newPassword =
      "Your new password must be different from your current password.";
  }

  if (
    typeof confirmPassword !== "string" ||
    confirmPassword !== newPassword
  ) {
    errors.confirmPassword =
      "The password confirmation does not match.";
  }

  if (Object.keys(errors).length > 0) {
    response.status(400).json({
      success: false,
      message: "Please correct the password details.",
      errors
    });

    return;
  }

  next();
}

module.exports = validatePasswordChange;