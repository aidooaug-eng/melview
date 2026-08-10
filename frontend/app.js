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
