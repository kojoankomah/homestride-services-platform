const publicNavigationToggle = document.querySelector(
  "[data-public-navigation-toggle]"
);

const publicNavigation = document.querySelector(
  "[data-public-navigation]"
);

function closePublicNavigation() {
  publicNavigationToggle?.setAttribute(
    "aria-expanded",
    "false"
  );

  publicNavigation?.classList.remove("is-open");
}

publicNavigationToggle?.addEventListener(
  "click",
  () => {
    const navigationIsOpen =
      publicNavigationToggle.getAttribute(
        "aria-expanded"
      ) === "true";

    publicNavigationToggle.setAttribute(
      "aria-expanded",
      String(!navigationIsOpen)
    );

    publicNavigation?.classList.toggle(
      "is-open",
      !navigationIsOpen
    );
  }
);

publicNavigation
  ?.querySelectorAll("a")
  .forEach((link) => {
    link.addEventListener(
      "click",
      closePublicNavigation
    );
  });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePublicNavigation();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 960) {
    closePublicNavigation();
  }
});

const siteHeader = document.querySelector(".site-header");

function updateHeaderAppearance() {
  siteHeader?.classList.toggle(
    "is-scrolled",
    window.scrollY > 20
  );
}

window.addEventListener(
  "scroll",
  updateHeaderAppearance,
  {
    passive: true
  }
);

updateHeaderAppearance();

const currentYear = document.querySelector(
  "#currentYear"
);

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

function updateAccountNavigation() {
  if (!window.HomeStrideAPI) {
    return;
  }

  const user = window.HomeStrideAPI.getCurrentUser();
  const token = localStorage.getItem("homestrideToken");

  if (!user || !token) {
    return;
  }

  const isInsidePages =
    window.location.pathname.includes("/pages/");

  const pathPrefix = isInsidePages ? "../" : "";

  const dashboardPaths = {
    customer: `${pathPrefix}dashboards/customer.html`,
    technician:
      `${pathPrefix}dashboards/technician.html`,
    admin: `${pathPrefix}dashboards/admin.html`
  };

  const loginLink = document.querySelector(
    ".header-login"
  );

  const registerLink = document.querySelector(
    ".header-actions .button"
  );

  if (loginLink) {
    loginLink.textContent = "Dashboard";
    loginLink.href =
      dashboardPaths[user.role] ||
      `${pathPrefix}index.html`;
  }

  if (registerLink) {
    registerLink.textContent = "Open Dashboard";
    registerLink.href =
      dashboardPaths[user.role] ||
      `${pathPrefix}index.html`;
  }
}

updateAccountNavigation();