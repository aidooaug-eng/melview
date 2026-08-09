const API_BASE_URL = "PASTE_API_BASE_URL_HERE";

const byId = (id) => document.getElementById(id);
const eventsList = byId("events-list");
const eventsStatus = byId("events-status");
const eventSelect = byId("eventId");

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
  try {
    const events = await request("/events");
    if (!events.length) { setStatus(eventsStatus, "No events are available right now."); return; }
    eventSelect.innerHTML = '<option value="">Select an event</option>';
    events.forEach((event) => {
      const remaining = Math.max(0, Number(event.capacity) - Number(event.registeredCount || 0));
      eventsList.insertAdjacentHTML("beforeend", `<article class="event-card"><p class="eyebrow">${escapeHtml(event.date || "DATE TBA")}</p><h3>${escapeHtml(event.name)}</h3><p>${escapeHtml(event.location || "Location TBA")}</p><p>${remaining} seat${remaining === 1 ? "" : "s"} remaining</p></article>`);
      if (remaining > 0) eventSelect.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(event.eventId)}">${escapeHtml(event.name)}</option>`);
    });
    setStatus(eventsStatus, "");
  } catch (error) { setStatus(eventsStatus, error.message, true); }
}
byId("refresh-events").addEventListener("click", loadEvents);
byId("registration-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const status = byId("registration-status");
  const payload = { eventId: eventSelect.value, attendeeName: byId("attendeeName").value.trim(), email: byId("email").value.trim() };
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
