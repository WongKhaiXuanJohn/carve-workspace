/** Heater SOP migrated from carve-lab-heater-scheduler commit cb60d1e. */
export const DEFAULT_CLASSES = ['08:15', '09:15', '10:15', '12:15', '13:15', '15:15'];
export const DEFAULT_WHATSAPP = '60143657688';

const SOP = 'SOP:\n• ALL heater ON 20 mins before class\n• Last 2 rows OFF 35 mins after class starts\n• For classes starting 12:00 PM–3:00 PM (inclusive), last 2 rows OFF after 30 mins\n• For back-to-back classes, ON last 2 rows 5 mins before the next class\n• Take photo of DB + time each time switch ON/OFF heater\n\nSCHEDULE:';
const REMINDERS = '⚠️ FOR CANCELLED CLASS/ GAP BETWEEN CLASSES:\nDO NOT leave the heater ON. Use → remote OFF heaters 1-by-1 → OFF all switches on DB board.\n\nBefore the next class:\n• Back-to-back class: ON last 2 rows (8 switches DB) 5 mins before\n• After a gap: ON all (DB + Remote) 20 mins before.';

function parseTime(value) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new RangeError('Enter valid class times.');
  }
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatEventTime(minute) {
  const wrapped = ((minute % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const time = `${hours % 12 || 12}:${String(wrapped % 60).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  return time + (minute < 0 ? ' (previous day)' : minute >= 1440 ? ' (next day)' : '');
}

export function buildSchedule({ date, pic = '', times = [] }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
    throw new RangeError('Choose a date for the schedule.');
  }
  const parsedDate = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new RangeError('Choose a valid schedule date.');
  }
  const starts = times.filter(Boolean).map(parseTime).sort((a, b) => a - b);
  if (!starts.length) throw new RangeError('Enter at least one class time.');
  if (starts.some((start, index) => index > 0 && start - starts[index - 1] < 60)) {
    throw new RangeError('Class times must be at least 60 minutes apart.');
  }

  const events = [];
  starts.forEach((start, index) => {
    const followsClass = index > 0 && start - starts[index - 1] === 60;
    const followedByClass = starts[index + 1] === start + 60;
    events.push({
      minute: start - (followsClass ? 5 : 20),
      label: followsClass ? 'ON last 2 rows (8 switches DB)' : 'ON all (DB + Remote)',
      kind: 'on',
      gapAfter: false
    });
    events.push({
      minute: start + (start >= 720 && start <= 900 ? 30 : 35),
      label: followedByClass ? 'OFF last 2 rows (8 switches DB)' : 'OFF ALL',
      kind: 'off',
      gapAfter: !followedByClass && index < starts.length - 1
    });
  });
  const header = `HEATER SCHEDULE - ${parsedDate.getUTCDate()}/${parsedDate.getUTCMonth() + 1} ${pic.trim().toUpperCase()}`;
  const rows = events.flatMap(event => [
    `${formatEventTime(event.minute)} – ${event.label}`,
    ...(event.gapAfter ? ['GAP time'] : [])
  ]);
  return {
    date,
    classCount: starts.length,
    events,
    message: `${header}\n\n${SOP}\n\n${rows.join('\n\n')}\n\n${REMINDERS}`
  };
}

export function buildWhatsappUrl(message, rawPhone) {
  const phone = rawPhone.replace(/\D/g, '');
  if (phone.length < 8 || phone.length > 15) {
    throw new RangeError('Enter a valid WhatsApp number with country code.');
  }
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
