import { fetchEvents } from './services.js';
import { getCookie, localInputToIso } from './utils.js';

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  // --- CONFIGURATION ---
  const eventsUrl = calendarEl.getAttribute('data-events-url');
  const updateUrl = calendarEl.getAttribute('data-update-url');
  const csrfToken = getCookie('csrftoken');

  // --- MODAL & FORM ELEMENTS ---
  const modalEl = document.getElementById('event-modal');
  const scheduleForm = document.getElementById('schedule-form'); // Use the form element
  const modalTitleEl = document.getElementById('event-modal-title');
  const pageIdInput = document.getElementById('page-id-input'); // The hidden input for the ID
  const startDateTimeInputEl = document.getElementById('start-datetime');
  const endDateTimeInputEl = document.getElementById('end-datetime');
  const unscheduleStartBtn = document.getElementById('unschedule-start');
  const unscheduleEndBtn = document.getElementById('unschedule-end');

  // --- UTILITY FUNCTION ---
  // Converts a Date object to the local time string format Wagtail's widget expects
  function dateToWagtailInput(date) {
    if (!date) return '';
    const d = new Date(date);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16).replace('T', ' ');
  }

  // --- MODAL LOGIC ---
  function openModal() {
    modalEl.style.display = 'block';
    if (modalEl && typeof modalEl.showModal === 'function') {
      modalEl.showModal();

    }
    if (modalEl && modalEl.hasAttribute('open')) {
      modalEl.close(); // Use .close() to also remove it from the top layer
    }
  }

  function closeModal() {
    if (modalEl && typeof modalEl.close === 'function') {
      modalEl.close();
    }
    modalEl.style.display = 'none';
  }

  // --- EVENT HANDLERS ---

  // Handle the main form submission for creating and updating
  scheduleForm?.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default browser submission
    const pageId = pageIdInput.value;
    if (!pageId) return;

    try {
      // Convert local datetime strings to ISO format for the backend, or null if empty
      const goLiveValue = startDateTimeInputEl.value ? localInputToIso(startDateTimeInputEl.value) : null;
      const expireValue = endDateTimeInputEl.value ? localInputToIso(endDateTimeInputEl.value) : null;

      const response = await fetch(updateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({
          page_id: pageId,
          go_live_at: goLiveValue,
          expire_at: expireValue
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update schedule.');
      }

      calendar.refetchEvents();
      closeModal();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Error saving schedule: ' + err.message);
    }
  });

  // Wire up the modal's clear and cancel buttons
  unscheduleStartBtn?.addEventListener('click', () => { startDateTimeInputEl.value = ''; });
  unscheduleEndBtn?.addEventListener('click', () => { endDateTimeInputEl.value = ''; });
  modalEl.querySelector('#modal-cancel')?.addEventListener('click', closeModal);


  // --- FULLCALENDAR INITIALIZATION ---
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek'
    },
    editable: true,
    selectable: true,

    // Use the fetchEvents service to load data
    events: (fetchInfo, successCallback, failureCallback) => {
      fetchEvents(eventsUrl)
        .then(data => successCallback(data))
        .catch(err => {
          console.error('Failed to load events via service:', err);
          failureCallback(err);
        });
    },

    // EDIT an existing schedule by clicking an event
    eventClick: function (info) {
      info.jsEvent.preventDefault();
      const pageId = parseInt(info.event.id.split('-')[0]);
      if (isNaN(pageId)) return;

      const allEvents = calendar.getEvents();
      const goLiveEvent = allEvents.find(e => e.id === `${pageId}-start`);
      const expireEvent = allEvents.find(e => e.id === `${pageId}-end`);
      const baseTitle = info.event.title.replace(/\s\(.*\)$/, '');

      // Populate the form with the existing event data
      modalTitleEl.textContent = `Update schedule for "${baseTitle}"`;
      pageIdInput.value = pageId;
      startDateTimeInputEl.value = dateToWagtailInput(goLiveEvent?.start);
      endDateTimeInputEl.value = dateToWagtailInput(expireEvent?.start);

      openModal();
    },

    // UPDATE a schedule by dragging and dropping
    eventDrop: async function (info) {
      const pageId = parseInt(info.event.id.split('-')[0]);
      const droppedType = info.event.id.split('-')[1]; // 'start' or 'end'
      if (isNaN(pageId)) { info.revert(); return; }

      const allEvents = calendar.getEvents();
      const goLiveEvent = allEvents.find(e => e.id === `${pageId}-start`);
      const expireEvent = allEvents.find(e => e.id === `${pageId}-end`);

      // Determine the new and existing dates to preserve the full schedule
      let goLiveDate = goLiveEvent ? goLiveEvent.start.toISOString() : null;
      let expireDate = expireEvent ? expireEvent.start.toISOString() : null;

      if (droppedType === 'start') {
        goLiveDate = info.event.start.toISOString();
      } else {
        expireDate = info.event.start.toISOString();
      }

      try {
        const response = await fetch(updateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
          body: JSON.stringify({ page_id: pageId, go_live_at: goLiveDate, expire_at: expireDate }),
        });
        if (!response.ok) throw new Error('Server responded with an error.');
        calendar.refetchEvents();
      } catch (err) {
        console.error('Event drop update failed:', err);
        alert('Failed to update schedule. Reverting change.');
        info.revert();
      }
    },
  });


  calendar.render();

});