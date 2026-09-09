const registerForm = document.querySelector(
  "#registerForm"
);

const formMessage = document.querySelector(
  "#formMessage"
);

function showFieldError(fieldName, message) {
  const field = document.querySelector(`#${fieldName}`);
  const errorElement = document.querySelector(
    `#${fieldName}Error`
  );

  field?.setAttribute("aria-invalid", "true");

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearFieldError(fieldName) {
  const field = document.querySelector(`#${fieldName}`);
  const errorElement = document.querySelector(
    `#${fieldName}Error`
  );

  field?.removeAttribute("aria-invalid");

  if (errorElement) {
    errorElement.textContent = "";
  }
}

function setFormMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`.trim();
}

function validateForm(formData) {
  const errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (formData.fullName.trim().length < 2) {
    errors.fullName = "Please enter your full name.";
  }

  if (!emailPattern.test(formData.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  const phoneDigits =
    formData.phone.replace(/\D/g, "").length;

  if (phoneDigits < 9 || phoneDigits > 15) {
    errors.phone =
      "Please enter a valid telephone number.";
  }

  if (
    formData.password.length < 8 ||
    !/[A-Za-z]/.test(formData.password) ||
    !/\d/.test(formData.password)
  ) {
    errors.password =
      "Use at least 8 characters, including a letter and number.";
  }

  if (
    formData.confirmPassword !== formData.password
  ) {
    errors.confirmPassword =
      "The passwords do not match.";
  }

  return errors;
}

registerForm?.querySelectorAll("input").forEach(
  (field) => {
    field.addEventListener("input", () => {
      clearFieldError(field.id);
      setFormMessage("");
    });
  }
);

registerForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const submitButton = registerForm.querySelector(
      'button[type="submit"]'
    );

    const formData = {
      fullName:
        registerForm.fullName.value.trim(),
      email:
        registerForm.email.value.trim(),
      phone:
        registerForm.phone.value.trim(),
      password:
        registerForm.password.value,
      confirmPassword:
        registerForm.confirmPassword.value
    };

    [
      "fullName",
      "email",
      "phone",
      "password",
      "confirmPassword"
    ].forEach(clearFieldError);

    setFormMessage("");

    const errors = validateForm(formData);

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(
        ([fieldName, message]) => {
          showFieldError(fieldName, message);
        }
      );

      const firstInvalidField =
        registerForm.querySelector(
          '[aria-invalid="true"]'
        );

      firstInvalidField?.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";

    try {
      const data = await window.HomeStrideAPI.request(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
          })
        }
      );

      window.HomeStrideAPI.saveSession(
        data.token,
        data.user
      );

      setFormMessage(
        "Account created successfully. Redirecting...",
        "is-success"
      );

      window.setTimeout(() => {
        window.location.href =
          "../dashboards/customer.html";
      }, 700);
    } catch (error) {
      const fieldErrors = error.data?.errors;

      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(
          ([fieldName, message]) => {
            showFieldError(fieldName, message);
          }
        );
      }

      setFormMessage(
        error.message,
        "is-error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent =
        "Create Customer Account";
    }
  }
);