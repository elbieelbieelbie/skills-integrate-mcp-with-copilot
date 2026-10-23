document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const signupContainer = document.getElementById("signup-container");
  const messageDiv = document.getElementById("message");
  const loginToggle = document.getElementById("login-toggle");
  const loginForm = document.getElementById("login-form");
  const teacherSession = document.getElementById("teacher-session");
  const authMessage = document.getElementById("auth-message");
  let teacherCredentials = null;

  function encodeCredentials(username, password) {
    const bytes = new TextEncoder().encode(`${username}:${password}`);
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return `Basic ${btoa(binary)}`;
  }

  function updateTeacherControls() {
    const isTeacher = teacherCredentials !== null;
    signupContainer.classList.toggle("hidden", !isTeacher);
    loginToggle.classList.toggle("hidden", isTeacher);
    teacherSession.classList.toggle("hidden", !isTeacher);
  }

  function showMessage(element, message, type) {
    element.textContent = message;
    element.className = type;
    element.classList.remove("hidden");
    setTimeout(() => element.classList.add("hidden"), 5000);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error(`Activity request failed with status ${response.status}`);
      }
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        teacherCredentials
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}" aria-label="Unregister ${email} from ${name}">Remove</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : "<p><em>No participants yet</em></p>";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;
        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function teacherFetch(url, options) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: teacherCredentials.authorization,
      },
    });
    if (response.status === 401) {
      teacherCredentials = null;
      updateTeacherControls();
      loginForm.classList.remove("hidden");
      showMessage(authMessage, "Your teacher session is no longer valid. Please log in again.", "error");
      await fetchActivities();
    }
    return response;
  }

  async function handleUnregister(event) {
    const button = event.currentTarget;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await teacherFetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (response.ok) {
        showMessage(messageDiv, result.message, "success");
        await fetchActivities();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(messageDiv, "Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  loginToggle.addEventListener("click", () => {
    const isHidden = loginForm.classList.toggle("hidden");
    loginToggle.setAttribute("aria-expanded", String(!isHidden));
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("teacher-username").value;
    const password = document.getElementById("teacher-password").value;
    const authorization = encodeCredentials(username, password);

    try {
      const response = await fetch("/auth/teacher", {
        headers: { Authorization: authorization },
      });
      if (!response.ok) {
        const result = await response.json();
        showMessage(authMessage, result.detail || "Unable to log in", "error");
        return;
      }

      teacherCredentials = { authorization };
      loginForm.reset();
      loginForm.classList.add("hidden");
      loginToggle.setAttribute("aria-expanded", "false");
      authMessage.classList.add("hidden");
      updateTeacherControls();
      await fetchActivities();
    } catch (error) {
      showMessage(authMessage, "Unable to contact the server. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  document.getElementById("logout-button").addEventListener("click", async () => {
    teacherCredentials = null;
    updateTeacherControls();
    loginForm.classList.add("hidden");
    loginToggle.setAttribute("aria-expanded", "false");
    await fetchActivities();
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const activity = activitySelect.value;

    try {
      const response = await teacherFetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();
      if (response.ok) {
        showMessage(messageDiv, result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(messageDiv, "Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  updateTeacherControls();
  fetchActivities();
});