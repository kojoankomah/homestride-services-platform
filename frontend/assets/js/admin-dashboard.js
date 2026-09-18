let adminRequests = [];
let adminTechnicians = [];
let selectedRequestId = null;
let selectedTechnicianId = null;
let technicianMessageTimer = null;

const adminRequestList = document.querySelector(
  "#adminRequestList"
);

const adminTechnicianGrid = document.querySelector(
  "#adminTechnicianGrid"
);

const adminRequestEmpty = document.querySelector(
  "#adminRequestEmpty"
);

const requestSearch = document.querySelector(
  "#requestSearch"
);

const adminStatusFilter = document.querySelector(
  "#adminStatusFilter"
);

const pageMessage = document.querySelector(
  "#pageMessage"
);

const assignmentDialog = document.querySelector(
  "#assignmentDialog"
);

const technicianManagementMessage =
  document.querySelector(
    "#technicianManagementMessage"
  );
  
  function showTechnicianManagementMessage(
  message,
  stateClass = ""
) {
  window.clearTimeout(technicianMessageTimer);

  technicianManagementMessage.textContent = message;

  technicianManagementMessage.className =
    stateClass
      ? `page-message ${stateClass}`
      : "page-message";

  if (!message) {
    return;
  }

  technicianMessageTimer = window.setTimeout(() => {
    technicianManagementMessage.textContent = "";
    technicianManagementMessage.className =
      "page-message";
  }, 5000);
}

function showTechnicianCardMessage(
  card,
  message,
  stateClass = ""
) {
  adminTechnicianGrid
    .querySelectorAll(".technician-card-message")
    .forEach((element) => {
      element.remove();
    });

  if (!card || !message) {
    return;
  }

  const messageElement = createElement(
    "p",
    `page-message technician-card-message ${stateClass}`,
    message
  );

  messageElement.setAttribute("role", "status");
  messageElement.setAttribute(
    "aria-live",
    "polite"
  );

  const actions = card.querySelector(
    ".technician-card-actions"
  );

  if (actions) {
    card.insertBefore(messageElement, actions);
  } else {
    card.append(messageElement);
  }

  window.setTimeout(() => {
    messageElement.remove();
  }, 5000);
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function updateAdminStatistics() {
  document.querySelector("#adminAllCount").textContent =
    adminRequests.length;

  document.querySelector(
    "#adminPendingCount"
  ).textContent = adminRequests.filter(
    (item) => item.status === "pending"
  ).length;

  document.querySelector(
    "#adminActiveCount"
  ).textContent = adminRequests.filter(
    (item) =>
      item.status === "assigned" ||
      item.status === "in_progress"
  ).length;

  document.querySelector(
    "#adminCompletedCount"
  ).textContent = adminRequests.filter(
    (item) => item.status === "completed"
  ).length;
}

async function loadAdminData() {
  pageMessage.textContent = "";
  pageMessage.className = "page-message";

  try {
    const [requestsData, techniciansData] =
      await Promise.all([
        window.HomeStrideAPI.request(
          "/admin/requests"
        ),
        window.HomeStrideAPI.request(
          "/technicians"
        )
      ]);

    adminRequests = requestsData.serviceRequests;
    adminTechnicians = techniciansData.technicians;

    updateAdminStatistics();

    document.dispatchEvent(
      new CustomEvent("homestride:admin-data-loaded")
    );
  } catch (error) {
    adminRequestList.replaceChildren();
    adminTechnicianGrid.replaceChildren();

    pageMessage.textContent = error.message;
    pageMessage.classList.add("is-error");
  }
}

document
  .querySelector("#refreshAdminData")
  ?.addEventListener("click", loadAdminData);

document.addEventListener(
  "homestride:authenticated",
  loadAdminData
);



function createAdminRequestDetail(label, value) {
  const wrapper = document.createElement("div");

  wrapper.append(
    createElement("dt", "", label),
    createElement("dd", "", value)
  );

  return wrapper;
}

function createAdminRequestCard(serviceRequest) {
  const card = createElement(
    "article",
    "admin-request-card"
  );

  const heading = createElement(
    "div",
    "request-card-heading"
  );

  const titleGroup = document.createElement("div");

  titleGroup.append(
    createElement(
      "p",
      "request-reference",
      `Request #${serviceRequest.id}`
    ),
    createElement(
      "h3",
      "",
      serviceRequest.service.name
    )
  );

  const status = createElement(
    "span",
    `status-badge status-${serviceRequest.status}`,
    window.HomeStrideUI.formatStatus(
      serviceRequest.status
    )
  );

  heading.append(titleGroup, status);

  const details = createElement(
    "dl",
    "admin-request-details"
  );

  details.append(
    createAdminRequestDetail(
      "Customer",
      serviceRequest.customer.name
    ),
    createAdminRequestDetail(
      "Telephone",
      serviceRequest.customer.phone
    ),
    createAdminRequestDetail(
      "Schedule",
      `${window.HomeStrideUI.formatDate(
        serviceRequest.preferredDate
      )} at ${window.HomeStrideUI.formatTime(
        serviceRequest.preferredTime
      )}`
    ),
    createAdminRequestDetail(
      "Location",
      `${serviceRequest.address.city}, ` +
        serviceRequest.address.region
    ),
    createAdminRequestDetail(
      "Technician",
      serviceRequest.technician?.name ||
        "Not assigned"
    )
  );

  const description = createElement(
    "p",
    "request-description",
    serviceRequest.problemDescription
  );

  const footer = createElement(
    "div",
    "admin-request-footer"
  );

  footer.append(
    createElement(
      "span",
      "",
      `Submitted ${window.HomeStrideUI.formatDate(
        serviceRequest.createdAt
      )}`
    )
  );

  if (serviceRequest.status === "pending") {
    const assignButton = createElement(
      "button",
      "button button-primary",
      "Assign Technician"
    );

    assignButton.type = "button";
    assignButton.dataset.assignRequest =
      serviceRequest.id;

    footer.append(assignButton);
  }

  card.append(
    heading,
    details,
    description,
    footer
  );

  return card;
}

function renderAdminRequests() {
  adminRequestList.replaceChildren();

  const searchPhrase =
    requestSearch.value.trim().toLowerCase();

  const selectedStatus = adminStatusFilter.value;

  const filteredRequests = adminRequests.filter(
    (serviceRequest) => {
      const matchesStatus =
        selectedStatus === "all" ||
        serviceRequest.status === selectedStatus;

      const searchableText = [
        serviceRequest.id,
        serviceRequest.customer.name,
        serviceRequest.customer.email,
        serviceRequest.service.name,
        serviceRequest.address.city,
        serviceRequest.address.region
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchPhrase ||
        searchableText.includes(searchPhrase);

      return matchesStatus && matchesSearch;
    }
  );

  adminRequestEmpty.hidden =
    filteredRequests.length > 0;

  filteredRequests.forEach((serviceRequest) => {
    adminRequestList.append(
      createAdminRequestCard(serviceRequest)
    );
  });
}

requestSearch?.addEventListener(
  "input",
  renderAdminRequests
);

adminStatusFilter?.addEventListener(
  "change",
  renderAdminRequests
);

document.addEventListener(
  "homestride:admin-data-loaded",
  renderAdminRequests
);


function createTechnicianCard(technician) {
  const card = createElement(
    "article",
    "admin-technician-card"
  );

  card.dataset.technicianCard = technician.id;

  const heading = createElement(
    "div",
    "technician-card-heading"
  );

  const avatar = createElement(
    "span",
    "technician-avatar",
    technician.fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .slice(0, 2)
      .join("")
  );

  const identity = document.createElement("div");

  identity.append(
    createElement("h3", "", technician.fullName),
    createElement(
      "p",
      "",
      `${technician.employeeCode} · ${technician.specialization}`
    )
  );

  heading.append(avatar, identity);

  const availability = createElement(
    "span",
    `availability-badge availability-${technician.availabilityStatus}`,
    window.HomeStrideUI.formatStatus(
      technician.availabilityStatus
    )
  );

  const skills = createElement(
    "div",
    "technician-skills"
  );

  technician.skills.forEach((skill) => {
    skills.append(
      createElement("span", "", skill.name)
    );
  });

  const contact = createElement(
    "div",
    "technician-contact"
  );

  const emailLink = createElement(
    "a",
    "",
    technician.email
  );

  emailLink.href = `mailto:${technician.email}`;

  const phoneLink = createElement(
    "a",
    "",
    technician.phone
  );

  phoneLink.href =
    `tel:${technician.phone.replace(/\s/g, "")}`;

  contact.append(emailLink, phoneLink);

  const accountStatus = createElement(
    "span",
    technician.isActive
      ? "account-status is-active"
      : "account-status is-inactive",
    technician.isActive
      ? "Active account"
      : "Inactive account"
  );

  const actions = createElement(
    "div",
    "technician-card-actions"
  );

  const editButton = createElement(
    "button",
    "button button-secondary",
    "Edit Details"
  );

  editButton.type = "button";
  editButton.dataset.editTechnician =
    technician.id;

  const statusButton = createElement(
    "button",
    technician.isActive
      ? "button button-danger"
      : "button button-primary",
    technician.isActive
      ? "Deactivate"
      : "Reactivate"
  );

  statusButton.type = "button";
  statusButton.dataset.toggleTechnician =
    technician.id;

  statusButton.dataset.nextActive =
    String(!technician.isActive);

  actions.append(editButton, statusButton);

  if (!technician.isActive) {
    card.classList.add("is-inactive");
  }

  card.append(
    heading,
    accountStatus,
    availability,
    skills,
    contact,
    actions
  );

  return card;
}

function renderTechnicians() {
  adminTechnicianGrid.replaceChildren();

  if (adminTechnicians.length === 0) {
    adminTechnicianGrid.append(
      createElement(
        "p",
        "loading-message",
        "No technicians were found."
      )
    );

    return;
  }

  adminTechnicians.forEach((technician) => {
    adminTechnicianGrid.append(
      createTechnicianCard(technician)
    );
  });
}

document.addEventListener(
  "homestride:admin-data-loaded",
  renderTechnicians
);



function openAssignmentDialog(requestId) {
  const serviceRequest = adminRequests.find(
    (item) => item.id === requestId
  );

  if (!serviceRequest) {
    return;
  }

  selectedRequestId = requestId;

  const technicianField = document.querySelector(
    "#assignmentTechnician"
  );

  const assignmentMessage = document.querySelector(
    "#assignmentMessage"
  );

  const confirmButton = document.querySelector(
    "#confirmAssignment"
  );

  technicianField.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a technician";

  technicianField.append(placeholder);

  const suitableTechnicians = adminTechnicians.filter(
  (technician) =>
    technician.isActive &&
    technician.availabilityStatus === "available" &&
      technician.skills.some(
        (skill) =>
          skill.id === serviceRequest.service.id
      )
  );

  suitableTechnicians.forEach((technician) => {
    const option = document.createElement("option");

    option.value = technician.id;
    option.textContent =
      `${technician.fullName} — ` +
      technician.specialization;

    technicianField.append(option);
  });

  document.querySelector(
    "#assignmentDescription"
  ).textContent =
    `Request #${serviceRequest.id}: ` +
    `${serviceRequest.service.name} for ` +
    serviceRequest.customer.name;

  document.querySelector(
    "#assignmentNote"
  ).value = "";

  document.querySelector(
    "#assignmentTechnicianError"
  ).textContent = "";

  technicianField.removeAttribute("aria-invalid");

  assignmentMessage.textContent = "";
  assignmentMessage.className = "form-message";

  confirmButton.disabled =
    suitableTechnicians.length === 0;

  if (suitableTechnicians.length === 0) {
    assignmentMessage.textContent =
      "No suitable available technician was found.";
    assignmentMessage.classList.add("is-error");
  }

  assignmentDialog.showModal();
}

async function confirmTechnicianAssignment() {
  const technicianField = document.querySelector(
    "#assignmentTechnician"
  );

  const assignmentMessage = document.querySelector(
    "#assignmentMessage"
  );

  const errorElement = document.querySelector(
    "#assignmentTechnicianError"
  );

  const technicianId = Number(technicianField.value);

  if (!Number.isInteger(technicianId)) {
    technicianField.setAttribute(
      "aria-invalid",
      "true"
    );

    errorElement.textContent =
      "Please select an available technician.";

    return;
  }

  const confirmButton = document.querySelector(
    "#confirmAssignment"
  );

  confirmButton.disabled = true;
  confirmButton.textContent = "Assigning...";

  try {
    await window.HomeStrideAPI.request(
      `/admin/requests/${selectedRequestId}/assign`,
      {
        method: "PATCH",
        body: JSON.stringify({
          technicianId,
          adminNote: document
            .querySelector("#assignmentNote")
            .value.trim()
        })
      }
    );

    assignmentDialog.close();

    pageMessage.textContent =
      "Technician assigned successfully.";
    pageMessage.className =
      "page-message is-success";

    await loadAdminData();
  } catch (error) {
    assignmentMessage.textContent = error.message;
    assignmentMessage.className =
      "form-message is-error";
  } finally {
    confirmButton.disabled = false;
    confirmButton.textContent =
      "Assign Technician";
  }
}

adminRequestList?.addEventListener(
  "click",
  (event) => {
    const assignButton = event.target.closest(
      "[data-assign-request]"
    );

    if (!assignButton) {
      return;
    }

    openAssignmentDialog(
      Number(assignButton.dataset.assignRequest)
    );
  }
);

document
  .querySelector("#assignmentTechnician")
  ?.addEventListener("change", (event) => {
    event.target.removeAttribute("aria-invalid");

    document.querySelector(
      "#assignmentTechnicianError"
    ).textContent = "";
  });

document
  .querySelector("#confirmAssignment")
  ?.addEventListener(
    "click",
    confirmTechnicianAssignment
  );

document
  .querySelector("#closeAssignmentDialog")
  ?.addEventListener("click", () => {
    assignmentDialog.close();
  });

document
  .querySelector("#cancelAssignment")
  ?.addEventListener("click", () => {
    assignmentDialog.close();
  });

assignmentDialog?.addEventListener(
  "click",
  (event) => {
    if (event.target === assignmentDialog) {
      assignmentDialog.close();
    }
  }
);

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
  availabilityStatus: document.querySelector(
    "#technicianAvailabilityError"
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

function createTechnicianSkillOption(
  service,
  selectedServiceIds = []
) {
  const label = createElement(
    "label",
    "technician-skill-option"
  );

  const checkbox = document.createElement("input");

  checkbox.type = "checkbox";
  checkbox.name = "technicianService";
  checkbox.value = service.id;

  checkbox.checked = selectedServiceIds.includes(
    Number(service.id)
  );

  const text = createElement(
    "span",
    "",
    service.name
  );

  label.append(checkbox, text);

  return label;
}

async function loadTechnicianServices(
  selectedServiceIds = []
) {
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
        createTechnicianSkillOption(
          service,
          selectedServiceIds
        )
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
  selectedTechnicianId = null;
}

function prepareCreateTechnicianDialog() {
  showTechnicianManagementMessage("");

  selectedTechnicianId = null;

  technicianForm.reset();
  clearTechnicianErrors();

  document.querySelector(
    "#technicianDialogTitle"
  ).textContent = "Add a technician";

  document.querySelector(
    "#technicianDialogDescription"
  ).textContent =
    "Create the technician’s account and select the services they are qualified to handle.";

  const passwordField = document.querySelector(
    "#technicianPasswordField"
  );

  const passwordInput = document.querySelector(
    "#technicianPassword"
  );

  passwordField.hidden = false;
  passwordInput.required = true;

  document.querySelector(
    "#technicianAvailabilityField"
  ).hidden = true;

  createTechnicianButton.textContent =
    "Create Technician";
}

async function openEditTechnicianDialog(
  technicianId
) {
  showTechnicianManagementMessage("");

  const technician = adminTechnicians.find(
    (item) => item.id === technicianId
  );

  if (!technician) {
    return;
  }

  selectedTechnicianId = technicianId;

  technicianForm.reset();
  clearTechnicianErrors();

  document.querySelector(
    "#technicianDialogTitle"
  ).textContent = "Edit technician";

  document.querySelector(
    "#technicianDialogDescription"
  ).textContent =
    "Update the technician’s account, availability and service skills.";

  document.querySelector(
    "#technicianFullName"
  ).value = technician.fullName;

  document.querySelector(
    "#technicianEmail"
  ).value = technician.email;

  document.querySelector(
    "#technicianPhone"
  ).value = technician.phone;

  document.querySelector(
    "#technicianEmployeeCode"
  ).value = technician.employeeCode;

  document.querySelector(
    "#technicianSpecialization"
  ).value = technician.specialization;

  const passwordField = document.querySelector(
    "#technicianPasswordField"
  );

  const passwordInput = document.querySelector(
    "#technicianPassword"
  );

  passwordField.hidden = true;
  passwordInput.required = false;
  passwordInput.value = "";

  const availabilityField = document.querySelector(
    "#technicianAvailabilityField"
  );

  availabilityField.hidden = false;

  document.querySelector(
    "#technicianAvailability"
  ).value = technician.availabilityStatus;

  createTechnicianButton.textContent =
    "Save Changes";

  technicianDialog.showModal();

  await loadTechnicianServices(
    technician.skills.map((skill) => skill.id)
  );
}

document
  .querySelector("#openTechnicianDialog")
  ?.addEventListener("click", async () => {
    prepareCreateTechnicianDialog();
    technicianDialog.showModal();

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

    const isEditing =
      Number.isInteger(selectedTechnicianId);

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

      employeeCode: document
        .querySelector("#technicianEmployeeCode")
        .value.trim(),

      specialization: document
        .querySelector("#technicianSpecialization")
        .value.trim(),

      serviceIds
    };

    if (isEditing) {
      technicianData.availabilityStatus =
        document.querySelector(
          "#technicianAvailability"
        ).value;
    } else {
      technicianData.password =
        document.querySelector(
          "#technicianPassword"
        ).value;
    }

    createTechnicianButton.disabled = true;

    createTechnicianButton.textContent =
      isEditing
        ? "Saving Changes..."
        : "Creating Technician...";

    try {
      const endpoint = isEditing
        ? `/technicians/${selectedTechnicianId}`
        : "/technicians";

      const data =
        await window.HomeStrideAPI.request(
          endpoint,
          {
            method: isEditing ? "PATCH" : "POST",
            body: JSON.stringify(technicianData)
          }
        );

      closeTechnicianDialog();
      await loadAdminData();

      showTechnicianManagementMessage(
        data.message,
        "is-success"
      );

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
        isEditing
          ? "Save Changes"
          : "Create Technician";
    }
  }
);

adminTechnicianGrid?.addEventListener(
  "click",
  async (event) => {
    const editButton = event.target.closest(
      "[data-edit-technician]"
    );

    if (editButton) {
      await openEditTechnicianDialog(
        Number(editButton.dataset.editTechnician)
      );

      return;
    }

    const statusButton = event.target.closest(
      "[data-toggle-technician]"
    );

    if (!statusButton) {
      return;
    }

    const technicianId = Number(
      statusButton.dataset.toggleTechnician
    );

    const nextActive =
      statusButton.dataset.nextActive === "true";

    const technician = adminTechnicians.find(
      (item) => item.id === technicianId
    );

    const technicianCard = statusButton.closest(
      ".admin-technician-card"
    );

    if (!technician || !technicianCard) {
      return;
    }

    if (
      !nextActive &&
      technician.availabilityStatus === "assigned"
    ) {
      showTechnicianCardMessage(
        technicianCard,
        "This technician cannot be deactivated while assigned work is active.",
        "is-error"
      );

      return;
    }

    const confirmationMessage = nextActive
      ? `Reactivate ${technician.fullName}'s account?`
      : `Deactivate ${technician.fullName}'s account? They will no longer be able to sign in or receive new assignments.`;

    const actionWasConfirmed = window.confirm(
      confirmationMessage
    );

    if (!actionWasConfirmed) {
      return;
    }

    showTechnicianManagementMessage("");

    statusButton.disabled = true;
    statusButton.textContent = nextActive
      ? "Reactivating..."
      : "Deactivating...";

    try {
      const data =
        await window.HomeStrideAPI.request(
          `/technicians/${technicianId}/status`,
          {
            method: "PATCH",
            body: JSON.stringify({
              isActive: nextActive
            })
          }
        );

      technician.isActive = nextActive;

      technician.availabilityStatus =
        nextActive ? "available" : "unavailable";

      renderTechnicians();

      const updatedCard =
        adminTechnicianGrid.querySelector(
          `[data-technician-card="${technicianId}"]`
        );

      showTechnicianCardMessage(
        updatedCard,
        data.message,
        "is-success"
      );
    } catch (error) {
      showTechnicianCardMessage(
        technicianCard,
        error.message,
        "is-error"
      );

      statusButton.disabled = false;
      statusButton.textContent = nextActive
        ? "Reactivate"
        : "Deactivate";
    }
  }
);