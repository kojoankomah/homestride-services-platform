const changePasswordForm = document.querySelector(
  "#changePasswordForm"
);

const changePasswordButton = document.querySelector(
  "#changePasswordButton"
);

const formMessage = document.querySelector(
  "#formMessage"
);

const passwordFields = {
  currentPassword: document.querySelector(
    "#currentPassword"
  ),
  newPassword: document.querySelector(
    "#newPassword"
  ),
  confirmPassword: document.querySelector(
    "#confirmPassword"
  )
};

const passwordErrors = {
  currentPassword: document.querySelector(
    "#currentPasswordError"
  ),
  newPassword: document.querySelector(
    "#newPasswordError"
  ),
  confirmPassword: document.querySelector(
    "#confirmPasswordError"
  )
};

function redirectToLogin() {
  window.HomeStrideAPI.clearSession();
  window.location.href = "login.html";
}

function clearPasswordErrors() {
  Object.values(passwordErrors).forEach(
    (element) => {
      if (element) {
        element.textContent = "";
      }
    }
  );

  Object.values(passwordFields).forEach((field) => {
    field
      ?.closest(".form-field")
      ?.classList.remove("has-error");
  });

  formMessage.textContent = "";
  formMessage.className = "form-message";
}

function showPasswordErrors(errors = {}) {
  Object.entries(errors).forEach(
    ([fieldName, message]) => {
      const field = passwordFields[fieldName];
      const errorElement = passwordErrors[fieldName];

      if (!field || !errorElement) {
        return;
      }

      errorElement.textContent = message;

      field
        .closest(".form-field")
        ?.classList.add("has-error");
    }
  );
}

async function initializePasswordPage() {
  const token = localStorage.getItem(
    "homestrideToken"
  );

  const storedUser =
    window.HomeStrideAPI.getCurrentUser();

  if (!token || !storedUser) {
    redirectToLogin();
    return;
  }

  const dashboardPaths = {
    customer: "../dashboards/customer.html",
    technician: "../dashboards/technician.html",
    admin: "../dashboards/admin.html"
  };

  const dashboardLink = document.querySelector(
    "[data-back-dashboard]"
  );

  dashboardLink.href =
    dashboardPaths[storedUser.role] ||
    "../index.html";

  try {
    await window.HomeStrideAPI.request("/users/me");
  } catch (error) {
    if (error.status === 401) {
      redirectToLogin();
      return;
    }

    formMessage.textContent = error.message;
    formMessage.className =
      "form-message is-error";
  }
}

changePasswordForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    clearPasswordErrors();

    const passwordData = {
      currentPassword:
        passwordFields.currentPassword.value,

      newPassword:
        passwordFields.newPassword.value,

      confirmPassword:
        passwordFields.confirmPassword.value
    };

    changePasswordButton.disabled = true;
    changePasswordButton.textContent =
      "Changing Password...";

    try {
      const data =
        await window.HomeStrideAPI.request(
          "/users/password",
          {
            method: "PATCH",
            body: JSON.stringify(passwordData)
          }
        );

      changePasswordForm.reset();

      formMessage.textContent = data.message;
      formMessage.className =
        "form-message is-success";

      window.HomeStrideAPI.clearSession();

      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 1800);
    } catch (error) {
      showPasswordErrors(
        error.data?.errors || {}
      );

      formMessage.textContent = error.message;
      formMessage.className =
        "form-message is-error";
    } finally {
      changePasswordButton.disabled = false;
      changePasswordButton.textContent =
        "Change Password";
    }
  }
);

Object.values(passwordFields).forEach((field) => {
  field?.addEventListener("input", () => {
    if (
      field
        .closest(".form-field")
        ?.classList.contains("has-error")
    ) {
      clearPasswordErrors();
    }
  });
});

initializePasswordPage();