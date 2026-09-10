const servicesCatalogGrid = document.querySelector(
  "#servicesCatalogGrid"
);

const servicesCatalogMessage = document.querySelector(
  "#servicesCatalogMessage"
);

function createServicesElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function formatServicePrice(amount) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0
  }).format(amount);
}

function createCatalogCard(service, index) {
  const card = createServicesElement(
    "article",
    "services-catalog-card"
  );

  card.id = `service-${service.id}`;

  const number = createServicesElement(
    "span",
    "service-number",
    String(index + 1).padStart(2, "0")
  );

  const title = createServicesElement(
    "h3",
    "",
    service.name
  );

  const description = createServicesElement(
    "p",
    "",
    service.description
  );

  const details = createServicesElement(
    "div",
    "catalog-service-details"
  );

  details.append(
    createServicesElement(
      "span",
      "",
      `From ${formatServicePrice(service.basePrice)}`
    ),
    createServicesElement(
      "span",
      "",
      `${service.estimatedDurationMinutes} minutes`
    )
  );

  const link = createServicesElement(
    "a",
    "button button-secondary",
    "View Service Details"
  );

  link.href =
    `service-details.html?serviceId=${service.id}`;

  card.append(
    number,
    title,
    description,
    details,
    link
  );

  return card;
}

function focusRequestedService() {
  const parameters = new URLSearchParams(
    window.location.search
  );

  const serviceId = parameters.get("serviceId");

  if (!serviceId) {
    return;
  }

  const selectedCard = document.querySelector(
    `#service-${CSS.escape(serviceId)}`
  );

  if (!selectedCard) {
    return;
  }

  selectedCard.classList.add("is-highlighted");

  selectedCard.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

async function loadServicesCatalog() {
  try {
    const data = await window.HomeStrideAPI.request(
      "/services"
    );

    servicesCatalogGrid.replaceChildren();

    data.services.forEach((service, index) => {
      servicesCatalogGrid.append(
        createCatalogCard(service, index)
      );
    });

    servicesCatalogMessage.hidden = true;
    focusRequestedService();
  } catch (error) {
    servicesCatalogGrid.replaceChildren();
    servicesCatalogMessage.hidden = false;
    servicesCatalogMessage.textContent = error.message;
    servicesCatalogMessage.classList.add("is-error");
  }
}

loadServicesCatalog();