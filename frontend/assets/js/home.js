const featuredServices = document.querySelector(
  "#featuredServices"
);

function createHomeElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function formatHomePrice(amount) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0
  }).format(amount);
}

function createServiceCard(service, index) {
  const card = createHomeElement(
    "article",
    "public-service-card"
  );

  const number = createHomeElement(
    "span",
    "service-number",
    String(index + 1).padStart(2, "0")
  );

  const title = createHomeElement(
    "h3",
    "",
    service.name
  );

  const description = createHomeElement(
    "p",
    "",
    service.description
  );

  const details = createHomeElement(
    "div",
    "service-card-details"
  );

  details.append(
    createHomeElement(
      "span",
      "",
      `From ${formatHomePrice(service.basePrice)}`
    ),
    createHomeElement(
      "span",
      "",
      `${service.estimatedDurationMinutes} minutes`
    )
  );

  const link = createHomeElement(
    "a",
    "service-card-link",
    "View service"
  );

  link.href =
    `pages/services.html?serviceId=${service.id}`;

  card.append(
    number,
    title,
    description,
    details,
    link
  );

  return card;
}

async function loadFeaturedServices() {
  try {
    const data = await window.HomeStrideAPI.request(
      "/services"
    );

    featuredServices.replaceChildren();

    data.services.forEach((service, index) => {
      featuredServices.append(
        createServiceCard(service, index)
      );
    });
  } catch (error) {
    featuredServices.replaceChildren();

    const message = createHomeElement(
      "p",
      "public-load-error",
      error.message
    );

    featuredServices.append(message);
  }
}

loadFeaturedServices();