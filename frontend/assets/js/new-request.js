let availableServices = [];
let savedAddresses = [];

const serviceRequestForm = document.querySelector(
  "#serviceRequestForm"
);

const serviceField = document.querySelector("#serviceId");
const addressField = document.querySelector("#addressId");
const newAddressFields = document.querySelector(
  "#newAddressFields"
);

const serviceSummary = document.querySelector(
  "#serviceSummary"
);

const formMessage = document.querySelector("#formMessage");
const pageMessage = document.querySelector("#pageMessage");

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS"
  }).format(amount);
}

function setMinimumDate() {
  const dateField = document.querySelector(
    "#preferredDate"
  );

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(today.getDate()).padStart(2, "0");

  dateField.min = `${year}-${month}-${day}`;
}

function populateServices() {
  serviceField.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a service";

  serviceField.append(placeholder);

  availableServices.forEach((service) => {
    const option = document.createElement("option");

    option.value = service.id;
    option.textContent = service.name;

    serviceField.append(option);
  });

  const parameters = new URLSearchParams(
    window.location.search
  );

  const requestedServiceId =
    parameters.get("serviceId");

  if (
    requestedServiceId &&
    availableServices.some(
      (service) =>
        String(service.id) === requestedServiceId
    )
  ) {
    serviceField.value = requestedServiceId;
    updateServiceSummary();
  }
}

function populateAddresses() {
  addressField.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select an address";

  addressField.append(placeholder);

  savedAddresses.forEach((address) => {
    const option = document.createElement("option");

    option.value = address.id;
    option.textContent =
      `${address.label} — ${address.city}, ${address.region}`;

    addressField.append(option);
  });

  const newAddressOption =
    document.createElement("option");

  newAddressOption.value = "new";
  newAddressOption.textContent = "Add a new address";

  addressField.append(newAddressOption);

  if (savedAddresses.length === 0) {
    addressField.value = "new";
    showNewAddressFields(true);
  }
}

function updateServiceSummary() {
  const selectedService = availableServices.find(
    (service) =>
      String(service.id) === serviceField.value
  );

  if (!selectedService) {
    serviceSummary.hidden = true;
    return;
  }

  document.querySelector(
    "#selectedServiceName"
  ).textContent = selectedService.name;

  document.querySelector(
    "#selectedServiceDescription"
  ).textContent = selectedService.description;

  document.querySelector(
    "#selectedServicePrice"
  ).textContent = formatCurrency(
    selectedService.basePrice
  );

  document.querySelector(
    "#selectedServiceDuration"
  ).textContent =
    `${selectedService.estimatedDurationMinutes} minutes`;

  serviceSummary.hidden = false;
}

function showNewAddressFields(showFields) {
  newAddressFields.hidden = !showFields;

  const requiredFieldIds = [
    "addressLabel",
    "addressLine",
    "city",
    "region"
  ];

  requiredFieldIds.forEach((fieldId) => {
    const field = document.querySelector(`#${fieldId}`);

    if (showFields) {
      field.setAttribute("required", "");
    } else {
      field.removeAttribute("required");
    }
  });
}

async function loadBookingOptions() {
  try {
    const [servicesData, addressesData] =
      await Promise.all([
        window.HomeStrideAPI.request("/services"),
        window.HomeStrideAPI.request("/addresses")
      ]);

    availableServices = servicesData.services;
    savedAddresses = addressesData.addresses;

    populateServices();
    populateAddresses();
  } catch (error) {
    pageMessage.textContent = error.message;
    pageMessage.classList.add("is-error");

    serviceField.innerHTML =
      '<option value="">Unable to load services</option>';

    addressField.innerHTML =
      '<option value="">Unable to load addresses</option>';
  }
}

serviceField?.addEventListener(
  "change",
  updateServiceSummary
);

addressField?.addEventListener("change", () => {
  showNewAddressFields(addressField.value === "new");
});

setMinimumDate();

document.addEventListener(
  "homestride:authenticated",
  loadBookingOptions
);


function showFieldError(fieldId, message) {
  const field = document.querySelector(`#${fieldId}`);
  const errorElement = document.querySelector(
    `#${fieldId}Error`
  );

  field?.setAttribute("aria-invalid", "true");

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearFieldError(fieldId) {
  const field = document.querySelector(`#${fieldId}`);
  const errorElement = document.querySelector(
    `#${fieldId}Error`
  );

  field?.removeAttribute("aria-invalid");

  if (errorElement) {
    errorElement.textContent = "";
  }
}

function setFormMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`.trim();
}

function validateRequestForm() {
  const errors = {};

  if (!serviceField.value) {
    errors.serviceId = "Please select a service.";
  }

  if (!addressField.value) {
    errors.addressId = "Please select an address.";
  }

  if (addressField.value === "new") {
    const addressLabel = document
      .querySelector("#addressLabel")
      .value.trim();

    const addressLine = document
      .querySelector("#addressLine")
      .value.trim();

    const city = document
      .querySelector("#city")
      .value.trim();

    const region = document
      .querySelector("#region")
      .value;

    if (addressLabel.length < 2) {
      errors.addressLabel =
        "Please enter an address label.";
    }

    if (addressLine.length < 5) {
      errors.addressLine =
        "Please enter complete address details.";
    }

    if (city.length < 2) {
      errors.city = "Please enter the town or city.";
    }

    if (!region) {
      errors.region = "Please select the region.";
    }
  }

  const preferredDate = document.querySelector(
    "#preferredDate"
  ).value;

  const preferredTime = document.querySelector(
    "#preferredTime"
  ).value;

  const problemDescription = document
    .querySelector("#problemDescription")
    .value.trim();

  if (
    !preferredDate ||
    preferredDate <
      document.querySelector("#preferredDate").min
  ) {
    errors.preferredDate =
      "Please select a date that is not in the past.";
  }

  if (!preferredTime) {
    errors.preferredTime =
      "Please select a preferred time.";
  }

  if (problemDescription.length < 20) {
    errors.problemDescription =
      "Please enter at least 20 characters.";
  }

  return errors;
}

async function createNewAddress() {
  const data = await window.HomeStrideAPI.request(
    "/addresses",
    {
      method: "POST",
      body: JSON.stringify({
        label: document
          .querySelector("#addressLabel")
          .value.trim(),
        addressLine: document
          .querySelector("#addressLine")
          .value.trim(),
        city: document
          .querySelector("#city")
          .value.trim(),
        region: document.querySelector("#region").value,
        landmark: document
          .querySelector("#landmark")
          .value.trim()
      })
    }
  );

  return data.address.id;
}

serviceRequestForm
  ?.querySelectorAll("input, select, textarea")
  .forEach((field) => {
    const eventName =
      field.tagName === "SELECT" ? "change" : "input";

    field.addEventListener(eventName, () => {
      clearFieldError(field.id);
      setFormMessage("");
    });
  });

serviceRequestForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const fieldIds = [
      "serviceId",
      "addressId",
      "addressLabel",
      "addressLine",
      "city",
      "region",
      "preferredDate",
      "preferredTime",
      "problemDescription"
    ];

    fieldIds.forEach(clearFieldError);
    setFormMessage("");

    const errors = validateRequestForm();

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(
        ([fieldId, message]) => {
          showFieldError(fieldId, message);
        }
      );

      serviceRequestForm
        .querySelector('[aria-invalid="true"]')
        ?.focus();

      return;
    }

    const submitButton =
      serviceRequestForm.querySelector(
        'button[type="submit"]'
      );

    submitButton.disabled = true;
    submitButton.textContent = "Submitting request...";

    try {
      let selectedAddressId = addressField.value;

      if (selectedAddressId === "new") {
        selectedAddressId = await createNewAddress();
      }

      const data = await window.HomeStrideAPI.request(
        "/requests",
        {
          method: "POST",
          body: JSON.stringify({
            serviceId: Number(serviceField.value),
            addressId: Number(selectedAddressId),
            preferredDate: document.querySelector(
              "#preferredDate"
            ).value,
            preferredTime: document.querySelector(
              "#preferredTime"
            ).value,
            problemDescription: document
              .querySelector("#problemDescription")
              .value.trim()
          })
        }
      );

      setFormMessage(
        "Service request submitted successfully. Redirecting...",
        "is-success"
      );

      window.setTimeout(() => {
        window.location.href =
          `request-details.html?id=${data.serviceRequest.id}`;
      }, 800);
    } catch (error) {
      const fieldNameMap = {
        label: "addressLabel",
        addressLine: "addressLine",
        city: "city",
        region: "region"
      };

      if (error.data?.errors) {
        Object.entries(error.data.errors).forEach(
          ([fieldName, message]) => {
            showFieldError(
              fieldNameMap[fieldName] || fieldName,
              message
            );
          }
        );
      }

      setFormMessage(error.message, "is-error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent =
        "Submit Service Request";
    }
  }
);