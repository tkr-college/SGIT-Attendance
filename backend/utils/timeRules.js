// Parses "HH:MM" env vars into today's Date objects for comparison.
function todayAt(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function getWindows() {
  return {
    checkInStart: todayAt(process.env.CHECKIN_START || '10:00'),
    checkInLateAfter: todayAt(process.env.CHECKIN_LATE_AFTER || '10:20'),
    checkOutStart: todayAt(process.env.CHECKOUT_START || '17:30'),
    checkOutEnd: todayAt(process.env.CHECKOUT_END || '18:30'),
  };
}

function evaluateCheckIn(now = new Date()) {
  const { checkInStart, checkInLateAfter } = getWindows();
  if (now < checkInStart) {
    return { allowed: false, reason: `Check-in opens at ${process.env.CHECKIN_START}` };
  }
  const status = now <= checkInLateAfter ? 'Present' : 'Late';
  return { allowed: true, status };
}

function evaluateCheckOut(now = new Date()) {
  const { checkOutStart, checkOutEnd } = getWindows();
  if (now < checkOutStart) {
    return { allowed: false, reason: `Check-out opens at ${process.env.CHECKOUT_START}` };
  }
  if (now > checkOutEnd) {
    return { allowed: false, reason: `Check-out window closed at ${process.env.CHECKOUT_END}` };
  }
  return { allowed: true };
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = { evaluateCheckIn, evaluateCheckOut, todayDateString };
