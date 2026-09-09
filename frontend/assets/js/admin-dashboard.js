let adminRequests = [];
let adminTechnicians = [];
let selectedRequestId = null;

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

  card.append(
    heading,
    availability,
    skills,
    contact
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
        "No active technicians were found."
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