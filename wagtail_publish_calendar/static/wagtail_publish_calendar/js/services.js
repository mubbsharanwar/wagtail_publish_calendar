/**
 * Fetch events JSON from the server.
 * Expects the server to return FullCalendar-compatible event objects.
 */
export async function fetchEvents(eventsUrl) {
  const resp = await fetch(eventsUrl, { method: 'GET', credentials: 'same-origin' });
  if (!resp.ok) throw new Error('Failed to fetch events');
  return resp.json();
}

/**
 * Update event (page) go_live_at on the server.
 * Returns parsed json or throws on non-OK status.
 */
export async function updateEvent(updateUrl, csrfToken, eventId, newDateIso) {
  const pageEventType = eventId.split("-");
  const resp = await fetch(updateUrl, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    // body: JSON.stringify({ id: pageEventType[0], type: pageEventType[1], new_date: newDateIso }),
    body: JSON.stringify({ id: eventId, new_date: newDateIso }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error('Failed to update event: ' + text);
  }
  return resp.json().catch(() => ({}));
}
