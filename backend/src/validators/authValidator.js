function validateRegistration(request, response, next) {
  const {
    fullName,
    email,
    phone,
    password
  } = request.body;

  const errors = {};

  if (
    typeof fullName !== "string" ||
    fullName.trim().length < 2
  ) {
    errors.fullName = "Please enter your full name.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    typeof email !== "string" ||
    !emailPattern.test(email.trim())
  ) {
    errors.email = "Please enter a valid email address.";
  }

  const numberOfPhoneDigits =
    typeof phone === "string"
      ? phone.replace(/\D/g, "").length
      : 0;

  if (
    numberOfPhoneDigits < 9 ||
    numberOfPhoneDigits > 15
  ) {
    errors.phone = "Please enter a valid telephone number.";
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    errors.password =
      "Password must contain at least 8 characters, including a letter and number.";
  }

  if (Object.keys(errors).length > 0) {
    response.status(400).json({
      success: false,
      message: "Please correct the highlighted fields.",
      errors
    });

    return;
  }

  next();
}

function validateLogin(request, response, next) {
  const { email, password } = request.body;
  const errors = {};

  if (
    typeof email !== "string" ||
    email.trim() === ""
  ) {
    errors.email = "Email address is required.";
  }

  if (
    typeof password !== "string" ||
    password === ""
  ) {
    errors.password = "Password is required.";
  }

  if (Object.keys(errors).length > 0) {
    response.status(400).json({
      success: false,
      message: "Email and password are required.",
      errors
    });

    return;
  }

  next();
}

module.exports = {
  validateRegistration,
  validateLogin
};