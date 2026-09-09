let technicianJobs = [];
let selectedJobId = null;
let selectedNextStatus = null;

const jobList = document.querySelector(
  "#technicianJobList"
);

const emptyJobState = document.querySelector(
  "#emptyJobState"
);

const jobStatusFilter = document.querySelector(
  "#jobStatusFilter"
);

const pageMessage = document.querySelector(
  "#pageMessage"
);

const statusDialog = document.querySelector(
  "#statusDialog"
);

const statusNote = document.querySelector(
  "#statusNote"
);

const statusFormMessage = document.querySelector(
  "#statusFormMessage"
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

function createJobDetail(label, value) {
  const wrapper = document.createElement("div");

  wrapper.append(
    createElement("dt", "", label),
    createElement("dd", "", value)
  );

  return wrapper;
}

function updateJobStatistics() {
  document.querySelector("#allJobCount").textContent =
    technicianJobs.length;

  document.querySelector(
    "#assignedJobCount"
  ).textContent = technicianJobs.filter(
    (job) => job.status === "assigned"
  ).length;

  document.querySelector(
    "#progressJobCount"
  ).textContent = technicianJobs.filter(
    (job) => job.status === "in_progress"
  ).length;

  document.querySelector(
    "#completedJobCount"
  ).textContent = technicianJobs.filter(
    (job) => job.status === "completed"
  ).length;
}

function openStatusDialog(job) {
  selectedJobId = job.id;

  selectedNextStatus =
    job.status === "assigned"
      ? "in_progress"
      : "completed";

  const actionName =
    selectedNextStatus === "in_progress"
      ? "Start Work"
      : "Complete Job";

  document.querySelector(
    "#statusDialogTitle"
  ).textContent = actionName;

  document.querySelector(
    "#statusDialogDescription"
  ).textContent =
    `${actionName} for Request #${job.id}: ` +
    job.service.name;

  statusNote.value = "";
  statusFormMessage.textContent = "";
  statusFormMessage.className = "form-message";

  statusDialog.showModal();
}

function createJobCard(job) {
  const card = createElement(
    "article",
    "technician-job-card"
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
      `Request #${job.id}`
    ),
    createElement("h3", "", job.service.name)
  );

  const status = createElement(
    "span",
    `status-badge status-${job.status}`,
    window.HomeStrideUI.formatStatus(job.status)
  );

  heading.append(titleGroup, status);

  const details = createElement(
    "dl",
    "technician-job-details"
  );

  details.append(
    createJobDetail(
      "Customer",
      job.customer.name
    ),
    createJobDetail(
      "Telephone",
      job.customer.phone
    ),
    createJobDetail(
      "Date",
      window.HomeStrideUI.formatDate(
        job.preferredDate
      )
    ),
    createJobDetail(
      "Time",
      window.HomeStrideUI.formatTime(
        job.preferredTime
      )
    ),
    createJobDetail(
      "Location",
      `${job.address.addressLine}, ` +
        `${job.address.city}, ${job.address.region}`
    ),
    createJobDetail(
      "Landmark",
      job.address.landmark || "Not provided"
    )
  );

  const description = createElement(
    "p",
    "request-description",
    job.problemDescription
  );

  const footer = createElement(
    "div",
    "technician-job-footer"
  );

  const telephoneLink = createElement(
    "a",
    "button button-secondary",
    "Call Customer"
  );

  telephoneLink.href =
    `tel:${job.customer.phone.replace(/\s/g, "")}`;

  footer.append(telephoneLink);

  if (
    job.status === "assigned" ||
    job.status === "in_progress"
  ) {
    const actionButton = createElement(
      "button",
      "button button-primary",
      job.status === "assigned"
        ? "Start Work"
        : "Mark Completed"
    );

    actionButton.type = "button";

    actionButton.addEventListener("click", () => {
      openStatusDialog(job);
    });

    footer.append(actionButton);
  }

  card.append(
    heading,
    details,
    description,
    footer
  );

  return card;
}

function renderJobs() {
  jobList.replaceChildren();

  const selectedStatus = jobStatusFilter.value;

  const filteredJobs =
    selectedStatus === "all"
      ? technicianJobs
      : technicianJobs.filter(
          (job) => job.status === selectedStatus
        );

  emptyJobState.hidden = filteredJobs.length > 0;

  filteredJobs.forEach((job) => {
    jobList.append(createJobCard(job));
  });
}

async function loadTechnicianJobs() {
  pageMessage.textContent = "";
  pageMessage.className = "page-message";

  try {
    const data = await window.HomeStrideAPI.request(
      "/technician/requests"
    );

    technicianJobs = data.assignedRequests;

    updateJobStatistics();
    renderJobs();
  } catch (error) {
    jobList.replaceChildren();
    emptyJobState.hidden = true;
    pageMessage.textContent = error.message;
    pageMessage.classList.add("is-error");
  }
}

async function confirmStatusUpdate() {
  if (!selectedJobId || !selectedNextStatus) {
    return;
  }

  const confirmButton = document.querySelector(
    "#confirmStatusUpdate"
  );

  confirmButton.disabled = true;
  confirmButton.textContent = "Updating...";

  try {
    await window.HomeStrideAPI.request(
      `/technician/requests/${selectedJobId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: selectedNextStatus,
          note: statusNote.value.trim()
        })
      }
    );

    statusDialog.close();

    pageMessage.textContent =
      "Job status updated successfully.";
    pageMessage.className =
      "page-message is-success";

    await loadTechnicianJobs();
  } catch (error) {
    statusFormMessage.textContent = error.message;
    statusFormMessage.className =
      "form-message is-error";
  } finally {
    confirmButton.disabled = false;
    confirmButton.textContent = "Confirm Update";
  }
}

jobStatusFilter?.addEventListener(
  "change",
  renderJobs
);

document
  .querySelector("#refreshJobs")
  ?.addEventListener("click", loadTechnicianJobs);

document
  .querySelector("#closeStatusDialog")
  ?.addEventListener("click", () => {
    statusDialog.close();
  });

document
  .querySelector("#cancelStatusUpdate")
  ?.addEventListener("click", () => {
    statusDialog.close();
  });

document
  .querySelector("#confirmStatusUpdate")
  ?.addEventListener("click", confirmStatusUpdate);

statusDialog?.addEventListener("click", (event) => {
  if (event.target === statusDialog) {
    statusDialog.close();
  }
});

document.addEventListener(
  "homestride:authenticated",
  loadTechnicianJobs
);