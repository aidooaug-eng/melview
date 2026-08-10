const API_BASE_URL =  "https://kran16o3h1.execute-api.eu-west-1.amazonaws.com/Prod";

const byId = (id) => document.getElementById(id);
const eventsList = byId("events-list");
const eventsStatus = byId("events-status");
const eventSelect = byId("eventId");
let availableEvents = [];
let selectedEvent = null;

function apiUrl(path) {
  if (API_BASE_URL === "PASTE_API_BASE_URL_HERE") throw new Error("The app has not been configured with an API URL yet.");
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}
function setStatus(element, message, error = false) { element.textContent = message; element.className = `status${error ? " error" : ""}`; }
function escapeHtml(value) { const box = document.createElement("div"); box.textContent = value ?? ""; return box.innerHTML; }
async function request(path, options) {
  const response = await fetch(apiUrl(path), options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status}).`);
  return body;
}
async function loadEvents() {
  setStatus(eventsStatus, "Loading events…"); eventsList.innerHTML = "";
  eventSelect.innerHTML = '<option value="">Select an event</option>';
  selectedEvent = null;
  try {
    const response = await request("/events");
    const events = Array.isArray(response) ? response : response.events;
    if (!Array.isArray(events)) throw new Error("The events API returned an unexpected response.");
    availableEvents = events;
    if (!events.length) { setStatus(eventsStatus, "No events are available right now."); return; }
    events.forEach((event) => {
      const remaining = Math.max(0, Number(event.capacity) - Number(event.registeredCount || 0));
      eventsList.insertAdjacentHTML("beforeend", `<article class="event-card"><p class="eyebrow">${escapeHtml(event.date)} · ${escapeHtml(event.time)}</p><h3>${escapeHtml(event.name)}</h3><p>${escapeHtml(event.description)}</p><p>${escapeHtml(event.location)}</p><p>${remaining} seat${remaining === 1 ? "" : "s"} remaining</p></article>`);
      if (remaining > 0 && event.status === "ACTIVE") eventSelect.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(event.eventId)}">${escapeHtml(event.name)}</option>`);
    });
    setStatus(eventsStatus, "");
  } catch (error) { setStatus(eventsStatus, `Unable to load events: ${error.message}`, true); }
}
byId("refresh-events").addEventListener("click", loadEvents);
eventSelect.addEventListener("change", () => {
  selectedEvent = availableEvents.find((event) => event.eventId === eventSelect.value) || null;
});
byId("registration-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const status = byId("registration-status");
  if (!selectedEvent) { setStatus(status, "Please select an available event.", true); return; }
  const payload = { eventId: selectedEvent.eventId, attendeeName: byId("attendeeName").value.trim(), email: byId("email").value.trim() };
  try { const result = await request("/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); setStatus(status, `Confirmed! Ticket ID: ${result.ticket.registrationId}`); event.target.reset(); await loadEvents(); }
  catch (error) { setStatus(status, error.message, true); }
});
byId("tickets-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const status = byId("tickets-status"); const list = byId("tickets-list"); list.innerHTML = "";
  try { const tickets = await request(`/registrations/${encodeURIComponent(byId("tickets-email").value.trim())}`); if (!tickets.length) setStatus(status, "No active tickets found for that email."); else { setStatus(status, ""); tickets.forEach((ticket) => list.insertAdjacentHTML("beforeend", `<article class="ticket"><div><strong>${escapeHtml(ticket.attendeeName)}</strong><p>Event: ${escapeHtml(ticket.eventId)}</p><p>Ticket: ${escapeHtml(ticket.registrationId)}</p></div><button class="button" data-cancel="${escapeHtml(ticket.registrationId)}">Cancel</button></article>`)); } }
  catch (error) { setStatus(status, error.message, true); }
});
byId("tickets-list").addEventListener("click", async (event) => { const id = event.target.dataset.cancel; if (!id) return; try { await request(`/registration/${encodeURIComponent(id)}`, { method: "DELETE" }); byId("tickets-form").requestSubmit(); loadEvents(); } catch (error) { setStatus(byId("tickets-status"), error.message, true); } });
loadEvents();
// Emergency cancel handler for dynamically rendered ticket cards
document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
 
  if (!button) return;
 
  const buttonText = button.textContent.trim().toLowerCase();
 
  if (buttonText !== "cancel") return;
 
  event.preventDefault();
 
  const ticketCard = button.closest("[data-registration-id], article, li, div");
 
  const registrationIdFromData =
    button.dataset.registrationId ||
    button.dataset.id ||
    ticketCard?.dataset.registrationId ||
    ticketCard?.dataset.id;
 
  const ticketText = ticketCard?.innerText || "";
 
  const registrationIdFromText =
    ticketText.match(/Ticket:\s*([A-Za-z0-9-]+)/i)?.[1] ||
    ticketText.match(/Ticket ID:\s*([A-Za-z0-9-]+)/i)?.[1] ||
    ticketText.match(/Registration ID:\s*([A-Za-z0-9-]+)/i)?.[1];
 
  const registrationId = registrationIdFromData || registrationIdFromText;
 
  if (!registrationId) {
    alert("Could not find the ticket ID for cancellation.");
    return;
  }
 
  const confirmed = window.confirm("Cancel this ticket?");
 
  if (!confirmed) return;
 
  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/registration/${encodeURIComponent(registrationId)}`,
      {
        method: "DELETE",
      }
    );
 
    const data = await response.json().catch(() => ({}));
 
    if (!response.ok) {
      throw new Error(data.message || `Cancellation failed with status ${response.status}`);
    }
 
    alert(data.message || "Registration cancelled.");
 
    button.textContent = "Cancelled";
    button.disabled = true;
 
    const statusText = document.createElement("p");
    statusText.textContent = "Ticket cancelled.";
    statusText.style.marginTop = "0.75rem";
    statusText.style.color = "#2f6b4f";
 
    ticketCard?.appendChild(statusText);
  } catch (error) {
    console.error("Cancel ticket error:", error);
    alert(error.message || "Unable to cancel ticket.");
  }
});
/* =====================================================
   Register modal controller
   Frontend-only behaviour. Keeps the existing form/API.
   ===================================================== */
 
(function setupRegisterModal() {
  function initRegisterModal() {
    const registerForm =
      document.getElementById("register-form") ||
      document.querySelector("form");
 
    if (!registerForm) return;
 
    const registerSection =
      document.getElementById("register") ||
      registerForm.closest("section") ||
      registerForm.parentElement;
 
    if (!registerSection) return;
 
    registerSection.id = registerSection.id || "register";
    registerSection.classList.add("registration-modal");
 
    if (!registerSection.querySelector(".registration-modal-close")) {
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "registration-modal-close";
      closeButton.setAttribute("aria-label", "Close registration form");
      closeButton.textContent = "×";
      registerSection.prepend(closeButton);
    }
 
    function openModal(event) {
      if (event) event.preventDefault();
 
      registerSection.classList.add("is-open");
      document.body.classList.add("registration-modal-open");
 
      const firstField = registerSection.querySelector("select, input, textarea");
      setTimeout(() => firstField?.focus(), 60);
    }
 
    function closeModal() {
      registerSection.classList.remove("is-open");
      document.body.classList.remove("registration-modal-open");
    }
 
    document.addEventListener("click", (event) => {
      const closeButton = event.target.closest(".registration-modal-close");
 
      if (closeButton) {
        closeModal();
        return;
      }
 
      if (
        registerSection.classList.contains("is-open") &&
        event.target === registerSection
      ) {
        closeModal();
        return;
      }
 
      const linkToRegister = event.target.closest(
        'a[href="#register"], a[href$="#register"]'
      );
 
      const clickedButtonOrLink = event.target.closest("button, a");
 
      if (!clickedButtonOrLink) return;
 
      if (clickedButtonOrLink.closest("#register-form")) return;
 
      const text = clickedButtonOrLink.textContent.trim().toLowerCase();
 
      const shouldOpenModal =
        linkToRegister ||
        text.includes("reserve") ||
        text.includes("register") ||
        text.includes("book") ||
        text.includes("claim");
 
      if (shouldOpenModal) {
        openModal(event);
      }
    });
 
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        registerSection.classList.contains("is-open")
      ) {
        closeModal();
      }
    });
  }
 
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRegisterModal);
  } else {
    initRegisterModal();
  }
})();
/* =====================================================
   FINAL FIX: registration form submit handler
   Ensures Reserve my ticket works inside modal/full page
   ===================================================== */
 
document.addEventListener(
  "submit",
  async (event) => {
    const form = event.target.closest("#register-form");
 
    if (!form) return;
 
    event.preventDefault();
    event.stopImmediatePropagation();
 
    const eventSelect =
      form.querySelector("#eventId") ||
      form.querySelector("[name='eventId']") ||
      form.querySelector("select");
 
    const nameInput =
      form.querySelector("#attendeeName") ||
      form.querySelector("[name='attendeeName']") ||
      form.querySelector("[name='name']") ||
      form.querySelector("input[type='text']");
 
    const emailInput =
      form.querySelector("#email") ||
      form.querySelector("[name='email']") ||
      form.querySelector("input[type='email']");
 
    let statusBox =
      document.getElementById("registration-status") ||
      form.querySelector(".message") ||
      form.querySelector(".status");
 
    if (!statusBox) {
      statusBox = document.createElement("p");
      statusBox.id = "registration-status";
      statusBox.style.marginTop = "1rem";
      form.appendChild(statusBox);
    }
 
    const eventId = eventSelect?.value?.trim();
    const attendeeName = nameInput?.value?.trim();
    const email = emailInput?.value?.trim().toLowerCase();
 
    if (!eventId || !attendeeName || !email) {
      statusBox.textContent = "Please select an event and enter your name and email.";
      statusBox.className = "error";
      return;
    }
 
    const submitButton = form.querySelector("button[type='submit'], button");
 
    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Reserving...";
      }
 
      statusBox.textContent = "Reserving your ticket...";
      statusBox.className = "message";
 
      const response = await fetch(
        `${API_BASE_URL.replace(/\/$/, "")}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId,
            attendeeName,
            email,
          }),
        }
      );
 
      const data = await response.json().catch(() => ({}));
 
      if (!response.ok) {
        throw new Error(data.message || `Registration failed with status ${response.status}`);
      }
 
      const registration =
        data.registration ||
        data.ticket ||
        data;
 
      const registrationId =
        registration.registrationId ||
        registration.id ||
        data.registrationId ||
        data.id ||
        "created";
 
      statusBox.textContent = `Confirmed! Ticket ID: ${registrationId}`;
      statusBox.className = "success";
 
      alert(`Registration confirmed. Ticket ID: ${registrationId}`);
 
      if (typeof loadEvents === "function") {
        await loadEvents();
      }
 
      if (typeof fetchEvents === "function") {
        await fetchEvents();
      }
    } catch (error) {
      console.error("Registration error:", error);
      statusBox.textContent = error.message || "Unable to reserve ticket.";
      statusBox.className = "error";
      alert(error.message || "Unable to reserve ticket.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Reserve my ticket";
      }
    }
  },
  true
);
/* =====================================================
   EMERGENCY FIX: direct Reserve button click handler
   Works even if the button is not submitting the form
   ===================================================== */
 
document.addEventListener(
  "click",
  async (event) => {
    const button = event.target.closest("button");
 
    if (!button) return;
 
    const buttonText = button.textContent.trim().toLowerCase();
 
    if (!buttonText.includes("reserve my ticket")) return;
 
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
 
    const form =
      button.closest("form") ||
      document.getElementById("register-form") ||
      document.querySelector(".registration-modal form") ||
      document.querySelector("form");
 
    if (!form) {
      alert("Registration form was not found.");
      console.error("Registration form was not found.");
      return;
    }
 
    const eventSelect =
      form.querySelector("#eventId") ||
      form.querySelector("[name='eventId']") ||
      form.querySelector("select");
 
    const nameInput =
      form.querySelector("#attendeeName") ||
      form.querySelector("[name='attendeeName']") ||
      form.querySelector("[name='name']") ||
      form.querySelector("input[type='text']");
 
    const emailInput =
      form.querySelector("#email") ||
      form.querySelector("[name='email']") ||
      form.querySelector("input[type='email']");
 
    let statusBox =
      document.getElementById("registration-status") ||
      form.querySelector(".message") ||
      form.querySelector(".status");
 
    if (!statusBox) {
      statusBox = document.createElement("p");
      statusBox.id = "registration-status";
      statusBox.style.marginTop = "1rem";
      form.appendChild(statusBox);
    }
 
    const eventId = eventSelect?.value?.trim();
    const attendeeName = nameInput?.value?.trim();
    const email = emailInput?.value?.trim().toLowerCase();
 
    console.log("Reserve button clicked.");
    console.log({ eventId, attendeeName, email });
 
    if (!eventId || !attendeeName || !email) {
      statusBox.textContent = "Please select an event and enter your name and email.";
      statusBox.className = "error";
      alert("Please select an event and enter your name and email.");
      return;
    }
 
    try {
      button.disabled = true;
      button.textContent = "Reserving...";
 
      statusBox.textContent = "Reserving your ticket...";
      statusBox.className = "message";
 
      const response = await fetch(
        `${API_BASE_URL.replace(/\/$/, "")}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId,
            attendeeName,
            email,
          }),
        }
      );
 
      const data = await response.json().catch(() => ({}));
 
      console.log("Registration response:", response.status, data);
 
      if (!response.ok) {
        throw new Error(data.message || `Registration failed with status ${response.status}`);
      }
 
      const registration = data.registration || data.ticket || data;
 
      const registrationId =
        registration.registrationId ||
        registration.id ||
        data.registrationId ||
        data.id ||
        "created";
 
      statusBox.textContent = `Confirmed! Ticket ID: ${registrationId}`;
      statusBox.className = "success";
 
      alert(`Registration confirmed. Ticket ID: ${registrationId}`);
 
      if (typeof loadEvents === "function") {
        await loadEvents();
      }
 
      if (typeof fetchEvents === "function") {
        await fetchEvents();
      }
    } catch (error) {
      console.error("Registration error:", error);
      statusBox.textContent = error.message || "Unable to reserve ticket.";
      statusBox.className = "error";
      alert(error.message || "Unable to reserve ticket.");
    } finally {
      button.disabled = false;
      button.textContent = "Reserve my ticket";
    }
  },
  true
);