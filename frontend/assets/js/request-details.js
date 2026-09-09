const detailsLoading = document.querySelector(
  "#detailsLoading"
);

const detailsContent = document.querySelector(
  "#requestDetailsContent"
);

const pageMessage = document.querySelector("#pageMessage");

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS"
  }).format(amount);
}

function createTimelineEntry(historyItem) {
  const item = document.createElement("li");

  const marker = document.createElement("span");
  marker.className = "timeline-marker";
  marker.setAttribute("aria-hidden", "true");

  const content = document.createElement("div");
  content.className = "timeline-content";

  const heading = document.createElement("div");

  const status = document.createElement("strong");
  status.textContent = window.HomeStrideUI.formatStatus(
    historyItem.newStatus
  );

  const date = document.createElement("time");
  date.textContent = window.HomeStrideUI.formatDate(
    historyItem.createdAt
  );

  heading.append(status, date);

  const changedBy = document.createElement("p");
  changedBy.textContent =
    `Updated by ${
      historyItem.changedBy || "HomeStride system"
    }`;

  content.append(heading, changedBy);

  if (historyItem.note) {
    const note = document.createElement("p");
    note.className = "timeline-note";
    note.textContent = historyItem.note;
    content.append(note);
  }

  item.append(marker, content);

  return item;
}

function displayRequest(serviceRequest) {
  document.querySelector(
    "#requestReference"
  ).textContent = `Request #${serviceRequest.id}`;

  document.querySelector(
    "#requestServiceName"
  ).textContent = serviceRequest.service.name;

  document.querySelector(
    "#requestDescription"
  ).textContent = serviceRequest.problemDescription;

  const statusElement = document.querySelector(
    "#requestStatus"
  );

  statusElement.textContent =
    window.HomeStrideUI.formatStatus(
      serviceRequest.status
    );

  statusElement.className =
    `status-badge status-${serviceRequest.status}`;

  document.querySelector(
    "#preferredDate"
  ).textContent = window.HomeStrideUI.formatDate(
    serviceRequest.preferredDate
  );

  document.querySelector(
    "#preferredTime"
  ).textContent = window.HomeStrideUI.formatTime(
    serviceRequest.preferredTime
  );

  document.querySelector(
    "#serviceLocation"
  ).textContent =
    `${serviceRequest.address.addressLine}, ` +
    `${serviceRequest.address.city}, ` +
    serviceRequest.address.region;

  document.querySelector(
    "#serviceLandmark"
  ).textContent =
    serviceRequest.address.landmark || "Not provided";

  document.querySelector(
    "#submittedDate"
  ).textContent = window.HomeStrideUI.formatDate(
    serviceRequest.createdAt
  );

  document.querySelector(
    "#updatedDate"
  ).textContent = window.HomeStrideUI.formatDate(
    serviceRequest.updatedAt
  );

  document.querySelector(
    "#servicePrice"
  ).textContent = formatCurrency(
    serviceRequest.service.basePrice
  );

  document.querySelector(
    "#technicianName"
  ).textContent =
    serviceRequest.technician?.name ||
    "Awaiting assignment";

  document.querySelector(
    "#adminNote"
  ).textContent =
    serviceRequest.adminNote ||
    "No administrator note has been added.";

  const timeline = document.querySelector(
    "#statusTimeline"
  );

  timeline.replaceChildren();

  serviceRequest.statusHistory.forEach(
    (historyItem) => {
      timeline.append(
        createTimelineEntry(historyItem)
      );
    }
  );

  detailsLoading.hidden = true;
  detailsContent.hidden = false;
}

async function loadRequestDetails() {
  const parameters = new URLSearchParams(
    window.location.search
  );

  const requestId = Number(parameters.get("id"));

  if (!Number.isInteger(requestId) || requestId < 1) {
    detailsLoading.hidden = true;
    pageMessage.textContent =
      "No valid service request was selected.";
    pageMessage.classList.add("is-error");
    return;
  }

  try {
    const data = await window.HomeStrideAPI.request(
      `/requests/${requestId}`
    );

    displayRequest(data.serviceRequest);
  } catch (error) {
    detailsLoading.hidden = true;
    pageMessage.textContent = error.message;
    pageMessage.classList.add("is-error");
  }
}

document.addEventListener(
  "homestride:authenticated",
  loadRequestDetails
);