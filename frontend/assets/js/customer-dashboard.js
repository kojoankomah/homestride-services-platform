let customerRequests = [];

const requestList = document.querySelector("#requestList");
const emptyState = document.querySelector("#emptyState");
const statusFilter = document.querySelector(
  "#requestStatusFilter"
);
const pageMessage = document.querySelector("#pageMessage");

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

function updateStatistics(requests) {
  const pendingCount = requests.filter(
    (item) => item.status === "pending"
  ).length;

  const activeCount = requests.filter(
    (item) =>
      item.status === "assigned" ||
      item.status === "in_progress"
  ).length;

  const completedCount = requests.filter(
    (item) => item.status === "completed"
  ).length;

  document.querySelector("#allRequestCount").textContent =
    requests.length;

  document.querySelector(
    "#pendingRequestCount"
  ).textContent = pendingCount;

  document.querySelector(
    "#activeRequestCount"
  ).textContent = activeCount;

  document.querySelector(
    "#completedRequestCount"
  ).textContent = completedCount;
}

function createDetail(label, value) {
  const wrapper = document.createElement("div");
  const term = createElement("dt", "", label);
  const description = createElement("dd", "", value);

  wrapper.append(term, description);

  return wrapper;
}

function createRequestCard(serviceRequest) {
  const card = createElement(
    "article",
    "request-card"
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
    "request-card-details"
  );

  details.append(
    createDetail(
      "Preferred date",
      window.HomeStrideUI.formatDate(
        serviceRequest.preferredDate
      )
    ),
    createDetail(
      "Preferred time",
      window.HomeStrideUI.formatTime(
        serviceRequest.preferredTime
      )
    ),
    createDetail(
      "Location",
      `${serviceRequest.address.city}, ${serviceRequest.address.region}`
    ),
    createDetail(
      "Technician",
      serviceRequest.technician?.name ||
        "Not assigned yet"
    )
  );

  const description = createElement(
    "p",
    "request-description",
    serviceRequest.problemDescription
  );

  const footer = createElement(
    "div",
    "request-card-footer"
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

  const detailsLink = createElement(
    "a",
    "request-details-link",
    "View request details"
  );

  detailsLink.href =
    `../requests/request-details.html?id=${serviceRequest.id}`;

  footer.append(detailsLink);

  card.append(
    heading,
    details,
    description,
    footer
  );

  return card;
}

function renderRequests(status = "all") {
  requestList.replaceChildren();

  const filteredRequests =
    status === "all"
      ? customerRequests
      : customerRequests.filter(
          (item) => item.status === status
        );

  emptyState.hidden = filteredRequests.length > 0;

  filteredRequests.forEach((serviceRequest) => {
    requestList.append(
      createRequestCard(serviceRequest)
    );
  });
}

async function loadCustomerRequests() {
  try {
    const data = await window.HomeStrideAPI.request(
      "/requests"
    );

    customerRequests = data.serviceRequests;

    updateStatistics(customerRequests);
    renderRequests(statusFilter.value);
  } catch (error) {
    requestList.replaceChildren();
    emptyState.hidden = true;
    pageMessage.textContent = error.message;
    pageMessage.classList.add("is-error");
  }
}

statusFilter?.addEventListener("change", () => {
  renderRequests(statusFilter.value);
});

document.addEventListener(
  "homestride:authenticated",
  loadCustomerRequests
);