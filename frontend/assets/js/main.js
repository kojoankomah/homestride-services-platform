function getDashboardPath(role) {
  const dashboardPaths = {
    customer: "../dashboards/customer.html",
    technician: "../dashboards/technician.html",
    admin: "../dashboards/admin.html"
  };

  return dashboardPaths[role] || "../index.html";
}

function formatStatus(status) {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(dateValue));
}

function formatTime(timeValue) {
  if (!timeValue) {
    return "Not specified";
  }

  const [hours, minutes] = timeValue.split(":");

  const time = new Date();
  time.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-GH", {
    hour: "numeric",
    minute: "2-digit"
  }).format(time);
}

function clearSessionAndRedirect() {
  window.HomeStrideAPI.clearSession();
  window.location.href = "../auth/login.html";
}

async function initializeProtectedPage() {
  const requiredRole = document.body.dataset.requiredRole;
  const token = localStorage.getItem("homestrideToken");
  const storedUser =
    window.HomeStrideAPI.getCurrentUser();

  if (!requiredRole) {
    return;
  }

  if (!token || !storedUser) {
    clearSessionAndRedirect();
    return;
  }

  try {
    const data = await window.HomeStrideAPI.request(
      "/users/me"
    );

    const user = data.user;

    if (user.role !== requiredRole) {
      window.location.href = getDashboardPath(user.role);
      return;
    }

    window.HomeStrideAPI.saveSession(token, user);

    document
      .querySelectorAll("[data-user-name]")
      .forEach((element) => {
        element.textContent = user.full_name;
      });

    document
      .querySelectorAll("[data-user-role]")
      .forEach((element) => {
        element.textContent = formatStatus(user.role);
      });

    document.body.classList.remove("is-auth-checking");

    document.dispatchEvent(
      new CustomEvent("homestride:authenticated", {
        detail: {
          user
        }
      })
    );
  } catch (error) {
    if (error.status === 401) {
      clearSessionAndRedirect();
      return;
    }

    document.body.classList.remove("is-auth-checking");

    const pageMessage = document.querySelector(
      "#pageMessage"
    );

    if (pageMessage) {
      pageMessage.textContent = error.message;
      pageMessage.classList.add("is-error");
    }
  }
}

document
  .querySelectorAll("[data-logout]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      clearSessionAndRedirect();
    });
  });

const navigationToggle = document.querySelector(
  "[data-navigation-toggle]"
);

const dashboardNavigation = document.querySelector(
  "[data-dashboard-navigation]"
);

navigationToggle?.addEventListener("click", () => {
  const navigationIsOpen =
    navigationToggle.getAttribute("aria-expanded") ===
    "true";

  navigationToggle.setAttribute(
    "aria-expanded",
    String(!navigationIsOpen)
  );

  dashboardNavigation?.classList.toggle(
    "is-open",
    !navigationIsOpen
  );
});

function updateDashboardNavigation() {
  const navigationLinks = document.querySelectorAll(
    ".dashboard-navigation a"
  );

  if (!navigationLinks.length) {
    return;
  }

  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;

  let matchingLink = null;

  navigationLinks.forEach((link) => {
    link.classList.remove("is-active");
    link.removeAttribute("aria-current");

    const linkUrl = new URL(link.href);

    if (
      currentHash &&
      linkUrl.pathname === currentPath &&
      linkUrl.hash === currentHash
    ) {
      matchingLink = link;
    }
  });

  if (!matchingLink && !currentHash) {
    matchingLink = Array.from(navigationLinks).find(
      (link) => {
        const linkUrl = new URL(link.href);

        return (
          linkUrl.pathname === currentPath &&
          !linkUrl.hash
        );
      }
    );
  }

  if (matchingLink) {
    matchingLink.classList.add("is-active");
    matchingLink.setAttribute("aria-current", "page");
  }
}

document
  .querySelectorAll(".dashboard-navigation a")
  .forEach((link) => {
    link.addEventListener("click", () => {
      const linkUrl = new URL(link.href);

      if (
        linkUrl.pathname === window.location.pathname &&
        linkUrl.hash
      ) {
        window.setTimeout(
          updateDashboardNavigation,
          0
        );
      }

      navigationToggle?.setAttribute(
        "aria-expanded",
        "false"
      );

      dashboardNavigation?.classList.remove("is-open");
    });
  });

window.addEventListener(
  "hashchange",
  updateDashboardNavigation
);

updateDashboardNavigation();


window.HomeStrideUI = {
  formatStatus,
  formatDate,
  formatTime,
  getDashboardPath
};

initializeProtectedPage();

const technicianDialog = document.querySelector(
  "#technicianDialog"
);

const technicianForm = document.querySelector(
  "#technicianForm"
);

const technicianSkills = document.querySelector(
  "#technicianSkills"
);

const technicianFormMessage = document.querySelector(
  "#technicianFormMessage"
);

const createTechnicianButton = document.querySelector(
  "#createTechnician"
);

const technicianErrorElements = {
  fullName: document.querySelector(
    "#technicianFullNameError"
  ),
  email: document.querySelector(
    "#technicianEmailError"
  ),
  phone: document.querySelector(
    "#technicianPhoneError"
  ),
  password: document.querySelector(
    "#technicianPasswordError"
  ),
  employeeCode: document.querySelector(
    "#technicianEmployeeCodeError"
  ),
  specialization: document.querySelector(
    "#technicianSpecializationError"
  ),
  serviceIds: document.querySelector(
    "#technicianServiceIdsError"
  )
};

function clearTechnicianErrors() {
  Object.values(technicianErrorElements).forEach(
    (element) => {
      if (element) {
        element.textContent = "";
      }
    }
  );

  technicianForm
    ?.querySelectorAll(".has-error")
    .forEach((element) => {
      element.classList.remove("has-error");
    });

  if (technicianFormMessage) {
    technicianFormMessage.textContent = "";
    technicianFormMessage.className = "form-message";
  }
}

function showTechnicianErrors(errors = {}) {
  Object.entries(errors).forEach(
    ([fieldName, message]) => {
      const errorElement =
        technicianErrorElements[fieldName];

      if (!errorElement) {
        return;
      }

      errorElement.textContent = message;

      const fieldWrapper = errorElement.closest(
        ".form-field, .technician-skills-fieldset"
      );

      fieldWrapper?.classList.add("has-error");
    }
  );
}

function createTechnicianSkillOption(service) {
  const label = createElement(
    "label",
    "technician-skill-option"
  );

  const checkbox = document.createElement("input");

  checkbox.type = "checkbox";
  checkbox.name = "technicianService";
  checkbox.value = service.id;

  const text = createElement(
    "span",
    "",
    service.name
  );

  label.append(checkbox, text);

  return label;
}

async function loadTechnicianServices() {
  technicianSkills.replaceChildren(
    createElement(
      "p",
      "loading-message",
      "Loading services..."
    )
  );

  try {
    const data = await window.HomeStrideAPI.request(
      "/services"
    );

    technicianSkills.replaceChildren();

    data.services.forEach((service) => {
      technicianSkills.append(
        createTechnicianSkillOption(service)
      );
    });
  } catch (error) {
    technicianSkills.replaceChildren(
      createElement(
        "p",
        "form-message is-error",
        error.message
      )
    );
  }
}

function closeTechnicianDialog() {
  technicianDialog?.close();
  technicianForm?.reset();
  clearTechnicianErrors();
}

document
  .querySelector("#openTechnicianDialog")
  ?.addEventListener("click", async () => {
    technicianForm?.reset();
    clearTechnicianErrors();
    technicianDialog?.showModal();

    await loadTechnicianServices();
  });

document
  .querySelector("#closeTechnicianDialog")
  ?.addEventListener(
    "click",
    closeTechnicianDialog
  );

document
  .querySelector("#cancelTechnician")
  ?.addEventListener(
    "click",
    closeTechnicianDialog
  );

technicianDialog?.addEventListener(
  "click",
  (event) => {
    if (event.target === technicianDialog) {
      closeTechnicianDialog();
    }
  }
);

technicianForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    clearTechnicianErrors();

    const serviceIds = Array.from(
      technicianForm.querySelectorAll(
        'input[name="technicianService"]:checked'
      )
    ).map((checkbox) => Number(checkbox.value));

    const technicianData = {
      fullName: document
        .querySelector("#technicianFullName")
        .value.trim(),

      email: document
        .querySelector("#technicianEmail")
        .value.trim(),

      phone: document
        .querySelector("#technicianPhone")
        .value.trim(),

      password: document.querySelector(
        "#technicianPassword"
      ).value,

      employeeCode: document
        .querySelector("#technicianEmployeeCode")
        .value.trim(),

      specialization: document
        .querySelector("#technicianSpecialization")
        .value.trim(),

      serviceIds
    };

    createTechnicianButton.disabled = true;
    createTechnicianButton.textContent =
      "Creating Technician...";

    try {
      const data =
        await window.HomeStrideAPI.request(
          "/technicians",
          {
            method: "POST",
            body: JSON.stringify(technicianData)
          }
        );

      closeTechnicianDialog();
      await loadAdminData();

      pageMessage.textContent = data.message;
      pageMessage.className =
        "page-message is-success";

      document
        .querySelector("#techniciansSection")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    } catch (error) {
      showTechnicianErrors(
        error.data?.errors || {}
      );

      technicianFormMessage.textContent =
        error.message;

      technicianFormMessage.className =
        "form-message is-error";
    } finally {
      createTechnicianButton.disabled = false;
      createTechnicianButton.textContent =
        "Create Technician";
    }
  }
);