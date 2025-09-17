import { fetchEvents, updateEvent } from './services.js';
import { getCookie, localInputToIso } from './utils.js';

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  const eventsUrl = calendarEl.getAttribute('data-events-url');
  const updateUrl = calendarEl.getAttribute('data-update-url');

  const modalEl = document.getElementById('event-modal');
  const startDateTimeInputEl = document.getElementById('start-datetime');
  const endDateTimeInputEl = document.getElementById('end-datetime');
  const startDateBlock = document.getElementById('go_live');
  const endDateBlock = document.getElementById('expiry');
  const cancelBtn = document.getElementById('modal-cancel');
  const saveBtn = document.getElementById('modal-save');
  let activeEvent = null;

  // Ensure dialog starts hidden in browsers without <dialog> support
  try {
    modalEl.removeAttribute('open');
  } catch (e) {}
  if (modalEl) modalEl.style.display = 'none';

  const csrfToken = getCookie('csrftoken');

  function formatForWagtailInput(date) {
    if (!(date instanceof Date)) date = new Date(date);

    // convert to local timezone string in format YYYY-MM-DD HH:mm
    const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
      .replace('T', ' ');

    return iso;
  }

  // Prefill input using local time formatted for the Wagtail datetime widget (Y-m-d H:i)
  function openModalForEvent(event) {
    activeEvent = event;
    const { id } = event;
    const eventType = id.split('-')[1];

    if (startDateTimeInputEl) startDateTimeInputEl.value = formatForWagtailInput(event.start || new Date());
    if (endDateTimeInputEl) endDateTimeInputEl.value = formatForWagtailInput(event.end || new Date());

    if (eventType === 'start') {
      if (startDateBlock) startDateBlock.style.display = 'none';
    } else if (eventType === 'end') {
      if (endDateBlock) endDateBlock.style.display = 'none';
    }

    if (modalEl) {
      modalEl.style.display = 'block';
      if (typeof modalEl.showModal === 'function') modalEl.showModal();
    }
  }

  function closeModal() {
    if (modalEl) {
      if (typeof modalEl.close === 'function') modalEl.close();
      modalEl.style.display = 'none';
      endDateBlock.style.display = '';
      startDateBlock.style.display = '';
    }
    activeEvent = null;
  }

  /**
   * Handle legacy xdsoft picker only.
   * Flatpickr is configured to append directly into the modal via its own options.
   */
  function relocateLegacyXdsoftPicker() {
    try {
      if (!modalEl) return;
      const xd = document.querySelector('.xdsoft_datetimepicker');
      if (xd && xd.parentNode !== modalEl) {
        modalEl.appendChild(xd);
      }
    } catch (e) {
      console.error('Error relocating legacy xdsoft picker:', e);
    }
  }

  if (startDateTimeInputEl) {
    // If this is flatpickr, configure it to append into modal
    if (startDateTimeInputEl._flatpickr) {
      startDateTimeInputEl._flatpickr.set('appendTo', modalEl);
    }

    // Still attach listeners for xdsoft
    startDateTimeInputEl.addEventListener('focus', relocateLegacyXdsoftPicker);
    startDateTimeInputEl.addEventListener('click', relocateLegacyXdsoftPicker);
  }

  cancelBtn && cancelBtn.addEventListener('click', function () {
    closeModal();
  });

  saveBtn && saveBtn.addEventListener('click', async function () {
    if (!activeEvent) return;
    const localValue = startDateTimeInputEl && startDateTimeInputEl.value;
    if (!localValue) return;

    let isoString;
    try {
      isoString = localInputToIso(localValue);
    } catch (err) {
      console.error('Invalid date/time format: ' + err.message);
      return;
    }

    try {
      await updateEvent(updateUrl, csrfToken, activeEvent.id, isoString);
      // update event on calendar
      activeEvent.setStart(new Date(isoString));
      closeModal();
    } catch (err) {
      console.error(err);
    }
  });

  // Build the calendar and use fetchEvents from services.js
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    editable: true,
    events: function (fetchInfo, successCallback, failureCallback) {
      fetchEvents(eventsUrl)
        .then((data) => successCallback(data))
        .catch((err) => {
          console.error('Failed to load events', err);
          failureCallback(err);
        });
    },
    eventClick: function (info) {
      info.jsEvent.preventDefault();
      openModalForEvent(info.event);
    },
    eventDrop: async function (info) {
      try {
        await updateEvent(updateUrl, csrfToken, info.event.id, info.event.start.toISOString());
      } catch (err) {
        console.error('Event update failed', err);
        info.revert();
      }
    },
  });

  calendar.render();
});
