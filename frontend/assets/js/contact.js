const contactForm = document.querySelector(
  "#contactForm"
);

const contactFormSuccess = document.querySelector(
  "#contactFormSuccess"
);

function showContactError(field, message) {
  const formField = field.closest(".form-field");

  const errorElement = document.querySelector(
    `#${field.id}Error`
  );

  formField?.classList.add("has-error");
  field.setAttribute("aria-invalid", "true");

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearContactError(field) {
  const formField = field.closest(".form-field");

  const errorElement = document.querySelector(
    `#${field.id}Error`
  );

  formField?.classList.remove("has-error");
  field.removeAttribute("aria-invalid");

  if (errorElement) {
    errorElement.textContent = "";
  }
}

function validateContactName() {
  const field = document.querySelector("#contactName");

  if (field.value.trim().length < 2) {
    showContactError(field, "Please enter your full name.");
    return false;
  }

  clearContactError(field);
  return true;
}

function validateContactEmail() {
  const field = document.querySelector("#contactEmail");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(field.value.trim())) {
    showContactError(
      field,
      "Please enter a valid email address."
    );

    return false;
  }

  clearContactError(field);
  return true;
}

function validateContactTopic() {
  const field = document.querySelector("#contactTopic");

  if (!field.value) {
    showContactError(
      field,
      "Please select an enquiry topic."
    );

    return false;
  }

  clearContactError(field);
  return true;
}

function validateContactMessage() {
  const field = document.querySelector("#contactMessage");

  if (field.value.trim().length < 20) {
    showContactError(
      field,
      "Please enter a message of at least 20 characters."
    );

    return false;
  }

  clearContactError(field);
  return true;
}

const contactValidators = [
  {
    field: document.querySelector("#contactName"),
    validate: validateContactName
  },
  {
    field: document.querySelector("#contactEmail"),
    validate: validateContactEmail
  },
  {
    field: document.querySelector("#contactTopic"),
    validate: validateContactTopic
  },
  {
    field: document.querySelector("#contactMessage"),
    validate: validateContactMessage
  }
];

contactValidators.forEach(({ field, validate }) => {
  const eventName =
    field.tagName === "SELECT" ? "change" : "input";

  field.addEventListener(eventName, () => {
    if (field.hasAttribute("aria-invalid")) {
      validate();
    }

    contactFormSuccess.hidden = true;
  });
});

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  contactFormSuccess.hidden = true;

  const validationResults = contactValidators.map(
    ({ validate }) => validate()
  );

  const formIsValid = validationResults.every(
    (result) => result
  );

  if (!formIsValid) {
    contactForm
      .querySelector('[aria-invalid="true"]')
      ?.focus();

    return;
  }

  contactForm.reset();
  contactFormSuccess.hidden = false;

  contactFormSuccess.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
});