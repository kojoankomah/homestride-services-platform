const loginForm = document.querySelector("#loginForm");
const formMessage = document.querySelector("#formMessage");

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

function redirectToDashboard(role) {
  const dashboardPaths = {
    customer: "../dashboards/customer.html",
    technician: "../dashboards/technician.html",
    admin: "../dashboards/admin.html"
  };

  window.location.href =
    dashboardPaths[role] || "../index.html";
}

loginForm?.querySelectorAll("input").forEach(
  (field) => {
    field.addEventListener("input", () => {
      clearFieldError(field.id);
      setFormMessage("");
    });
  }
);

loginForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;
    const submitButton = loginForm.querySelector(
      'button[type="submit"]'
    );

    clearFieldError("email");
    clearFieldError("password");
    setFormMessage("");

    let formIsValid = true;

    if (!email) {
      showFieldError(
        "email",
        "Please enter your email address."
      );

      formIsValid = false;
    }

    if (!password) {
      showFieldError(
        "password",
        "Please enter your password."
      );

      formIsValid = false;
    }

    if (!formIsValid) {
      loginForm
        .querySelector('[aria-invalid="true"]')
        ?.focus();

      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Signing in...";

    try {
      const data = await window.HomeStrideAPI.request(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      window.HomeStrideAPI.saveSession(
        data.token,
        data.user
      );

      setFormMessage(
        "Login successful. Redirecting...",
        "is-success"
      );

      window.setTimeout(() => {
        redirectToDashboard(data.user.role);
      }, 600);
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
      submitButton.textContent = "Sign In";
    }
  }
);