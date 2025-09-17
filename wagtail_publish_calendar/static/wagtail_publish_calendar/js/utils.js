
/**
 * Convert a local datetime string in format "YYYY-MM-DD HH:MM" (as used in your input)
 * into an ISO UTC string (with Z). Handles missing seconds.
 */
export function localInputToIso(localValue) {
  if (!localValue) throw new Error('Empty local datetime value');
  // Turn "YYYY-MM-DD HH:MM" into "YYYY-MM-DDTHH:MM" and construct Date
  const isoLike = localValue.replace(' ', 'T');
  const localDate = new Date(isoLike);
  if (isNaN(localDate.getTime())) {
    // try adding seconds if needed
    const alt = isoLike + ':00';
    const localDate2 = new Date(alt);
    if (isNaN(localDate2.getTime())) {
      throw new Error('Invalid local datetime format: ' + localValue);
    }
    // convert to UTC ISO
    return new Date(localDate2.getTime() - localDate2.getTimezoneOffset() * 60000).toISOString();
  }
  return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString();
}


// helper functions: getCookie, fetchEvents, updateEvent, localInputToIso
export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
