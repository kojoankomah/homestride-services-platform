const serviceDetailMessage = document.querySelector(
  "#serviceDetailMessage"
);

const serviceDetailHero = document.querySelector(
  "#serviceDetailHero"
);

const serviceDetailBody = document.querySelector(
  "#serviceDetailBody"
);

function formatDetailPrice(amount) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0
  }).format(amount);
}

function showServiceDetailError(message) {
  serviceDetailHero.hidden = true;
  serviceDetailBody.hidden = true;

  serviceDetailMessage.hidden = false;
  serviceDetailMessage.textContent = message;
  serviceDetailMessage.classList.add("is-error");
}

function displayServiceDetails(service) {
  document.querySelector("#serviceBreadcrumb").textContent =
    service.name;

  document.querySelector("#serviceDetailName").textContent =
    service.name;

  document.querySelector(
    "#serviceDetailDescription"
  ).textContent = service.description;

  document.querySelector("#serviceDetailPrice").textContent =
    `From ${formatDetailPrice(service.basePrice)}`;

  document.querySelector(
    "#serviceDetailDuration"
  ).textContent =
    `${service.estimatedDurationMinutes} minutes`;

  document.querySelector(
    "#serviceDetailCtaTitle"
  ).textContent =
    `Request ${service.name.toLowerCase()} support.`;

  const requestLink = document.querySelector(
    "#serviceRequestLink"
  );

  requestLink.href =
    `../requests/new-request.html?serviceId=${service.id}`;

  document.title =
    `${service.name} | HomeStride Services`;

  serviceDetailMessage.hidden = true;
  serviceDetailHero.hidden = false;
  serviceDetailBody.hidden = false;
}

async function loadServiceDetails() {
  const parameters = new URLSearchParams(
    window.location.search
  );

  const serviceId = parameters.get("serviceId");

  if (!serviceId || !/^\d+$/.test(serviceId)) {
    showServiceDetailError(
      "Select a service from the Services page to view its details."
    );

    return;
  }

  try {
    const data = await window.HomeStrideAPI.request(
      `/services/${encodeURIComponent(serviceId)}`
    );

    displayServiceDetails(data.service);
  } catch (error) {
    showServiceDetailError(error.message);
  }
}

loadServiceDetails();