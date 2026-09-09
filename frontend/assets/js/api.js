const API_BASE_URL = "http://localhost:5000/api";

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("homestrideToken");

  const headers = {
    ...options.headers
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(
        data.message || "The request could not be completed."
      );

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to HomeStride. Confirm that the backend server is running."
      );
    }

    throw error;
  }
}

function saveSession(token, user) {
  localStorage.setItem("homestrideToken", token);
  localStorage.setItem(
    "homestrideUser",
    JSON.stringify(user)
  );
}

function getCurrentUser() {
  const storedUser =
    localStorage.getItem("homestrideUser");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    clearSession();
    return null;
  }
}

function clearSession() {
  localStorage.removeItem("homestrideToken");
  localStorage.removeItem("homestrideUser");
}

window.HomeStrideAPI = {
  request: apiRequest,
  saveSession,
  getCurrentUser,
  clearSession
};