function getDashboardPath(role) {
  const dashboardPaths = {
    customer: "../dashboards/customer.html",
    technician: "../dashboards/technician.html",
    admin: "../dashboards/admin.html"
  };

  return dashboardPaths[role] || "../index.html";
}

function formatStatus(status) {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(dateValue));
}

function formatTime(timeValue) {
  if (!timeValue) {
    return "Not specified";
  }

  const [hours, minutes] = timeValue.split(":");

  const time = new Date();
  time.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-GH", {
    hour: "numeric",
    minute: "2-digit"
  }).format(time);
}

function clearSessionAndRedirect() {
  window.HomeStrideAPI.clearSession();
  window.location.href = "../auth/login.html";
}

async function initializeProtectedPage() {
  const requiredRole = document.body.dataset.requiredRole;
  const token = localStorage.getItem("homestrideToken");
  const storedUser =
    window.HomeStrideAPI.getCurrentUser();

  if (!requiredRole) {
    return;
  }

  if (!token || !storedUser) {
    clearSessionAndRedirect();
    return;
  }

  try {
    const data = await window.HomeStrideAPI.request(
      "/users/me"
    );

    const user = data.user;

    if (user.role !== requiredRole) {
      window.location.href = getDashboardPath(user.role);
      return;
    }

    window.HomeStrideAPI.saveSession(token, user);

    document
      .querySelectorAll("[data-user-name]")
      .forEach((element) => {
        element.textContent = user.full_name;
      });

    document
      .querySelectorAll("[data-user-role]")
      .forEach((element) => {
        element.textContent = formatStatus(user.role);
      });

    document.body.classList.remove("is-auth-checking");

    document.dispatchEvent(
      new CustomEvent("homestride:authenticated", {
        detail: {
          user
        }
      })
    );
  } catch (error) {
    if (error.status === 401) {
      clearSessionAndRedirect();
      return;
    }

    document.body.classList.remove("is-auth-checking");

    const pageMessage = document.querySelector(
      "#pageMessage"
    );

    if (pageMessage) {
      pageMessage.textContent = error.message;
      pageMessage.classList.add("is-error");
    }
  }
}

document
  .querySelectorAll("[data-logout]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      clearSessionAndRedirect();
    });
  });

const navigationToggle = document.querySelector(
  "[data-navigation-toggle]"
);

const dashboardNavigation = document.querySelector(
  "[data-dashboard-navigation]"
);

navigationToggle?.addEventListener("click", () => {
  const navigationIsOpen =
    navigationToggle.getAttribute("aria-expanded") ===
    "true";

  navigationToggle.setAttribute(
    "aria-expanded",
    String(!navigationIsOpen)
  );

  dashboardNavigation?.classList.toggle(
    "is-open",
    !navigationIsOpen
  );
});

function updateDashboardNavigation() {
  const navigationLinks = document.querySelectorAll(
    ".dashboard-navigation a"
  );

  if (!navigationLinks.length) {
    return;
  }

  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;

  let matchingLink = null;

  navigationLinks.forEach((link) => {
    link.classList.remove("is-active");
    link.removeAttribute("aria-current");

    const linkUrl = new URL(link.href);

    if (
      currentHash &&
      linkUrl.pathname === currentPath &&
      linkUrl.hash === currentHash
    ) {
      matchingLink = link;
    }
  });

  if (!matchingLink && !currentHash) {
    matchingLink = Array.from(navigationLinks).find(
      (link) => {
        const linkUrl = new URL(link.href);

        return (
          linkUrl.pathname === currentPath &&
          !linkUrl.hash
        );
      }
    );
  }

  if (matchingLink) {
    matchingLink.classList.add("is-active");
    matchingLink.setAttribute("aria-current", "page");
  }
}

document
  .querySelectorAll(".dashboard-navigation a")
  .forEach((link) => {
    link.addEventListener("click", () => {
      const linkUrl = new URL(link.href);

      if (
        linkUrl.pathname === window.location.pathname &&
        linkUrl.hash
      ) {
        window.setTimeout(
          updateDashboardNavigation,
          0
        );
      }

      navigationToggle?.setAttribute(
        "aria-expanded",
        "false"
      );

      dashboardNavigation?.classList.remove("is-open");
    });
  });

window.addEventListener(
  "hashchange",
  updateDashboardNavigation
);

updateDashboardNavigation();


window.HomeStrideUI = {
  formatStatus,
  formatDate,
  formatTime,
  getDashboardPath
};

initializeProtectedPage();