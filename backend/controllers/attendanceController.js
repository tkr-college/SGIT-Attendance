const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { verifyQrToken } = require('../utils/qrToken');
const { isWithinOffice } = require('../utils/geo');
const { evaluateCheckIn, evaluateCheckOut, todayDateString } = require('../utils/timeRules');

/**
 * POST /api/attendance/scan
 * body: { qrToken, action: 'check-in' | 'check-out', lat, lng, deviceId }
 *
 * The scanning employee must be the currently logged-in user (JWT), and the
 * QR token must decode to that same employee's code. This prevents someone
 * from scanning another employee's QR to fake their attendance, and prevents
 * a stale/screenshotted QR (expired JWT) from being replayed.
 */
exports.scan = async (req, res) => {
  try {
    const { qrToken, action, lat, lng, deviceId } = req.body;
    if (!qrToken || !action) return res.status(400).json({ message: 'qrToken and action are required' });

    const decoded = verifyQrToken(qrToken);
    if (!decoded) return res.status(400).json({ message: 'QR code is invalid or has expired. Please refresh it.' });

    if (decoded.employeeCode !== req.user.employeeCode) {
      return res.status(403).json({ message: 'This QR code does not belong to your account' });
    }

    // Optional device binding
    if (deviceId) {
      if (req.user.deviceId && req.user.deviceId !== deviceId) {
        return res.status(403).json({ message: 'This account is locked to a different device' });
      }
      if (!req.user.deviceId) {
        req.user.deviceId = deviceId;
        await req.user.save();
      }
    }

    // Geofencing
    if (typeof lat === 'number' && typeof lng === 'number') {
      const geoCheck = isWithinOffice(lat, lng);
      if (geoCheck !== true && geoCheck.allowed === false) {
        return res.status(403).json({
          message: `You are ${geoCheck.distance}m from office (allowed radius ${geoCheck.radius}m)`,
        });
      }
    } else {
      return res.status(400).json({ message: 'Location (lat, lng) is required' });
    }

    const date = todayDateString();
    let record = await Attendance.findOne({ employee: req.user._id, date });

    if (action === 'check-in') {
      if (record && record.checkInTime) {
        return res.status(409).json({ message: 'Already checked in today' });
      }
      const evalResult = evaluateCheckIn();
      if (!evalResult.allowed) return res.status(403).json({ message: evalResult.reason });

      if (!record) {
        record = new Attendance({ employee: req.user._id, date });
      }
      record.checkInTime = new Date();
      record.status = evalResult.status; // Present | Late
      record.checkInLocation = { lat, lng };
      await record.save();

      return res.json({ message: `Checked in successfully (${evalResult.status})`, record });
    }

    if (action === 'check-out') {
      if (!record || !record.checkInTime) {
        return res.status(400).json({ message: 'You must check in before checking out' });
      }
      if (record.checkOutTime) {
        return res.status(409).json({ message: 'Already checked out today' });
      }
      const evalResult = evaluateCheckOut();
      if (!evalResult.allowed) return res.status(403).json({ message: evalResult.reason });

      record.checkOutTime = new Date();
      record.checkOutLocation = { lat, lng };
      await record.save();

      return res.json({ message: 'Checked out successfully', record });
    }

    return res.status(400).json({ message: "action must be 'check-in' or 'check-out'" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/attendance?date=&employeeId=  (admin)
exports.listAttendance = async (req, res) => {
  try {
    const { date, from, to, employeeId } = req.query;
    const query = {};
    if (date) query.date = date;
    if (from || to) {
      query.date = query.date || {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }
    if (employeeId) query.employee = employeeId;

    const records = await Attendance.find(query)
      .populate('employee', 'name email employeeCode')
      .sort({ date: -1, createdAt: -1 });

    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
