const QRCode = require('qrcode');
const Attendance = require('../models/Attendance');
const { generateQrToken, TTL_MINUTES } = require('../utils/qrToken');

// GET /api/employee/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

// GET /api/employee/qr  -> returns a fresh, short-lived QR image (base64) for the logged-in employee
exports.getMyQr = async (req, res) => {
  try {
    const token = generateQrToken(req.user.employeeCode);
    const qrDataUrl = await QRCode.toDataURL(token, { errorCorrectionLevel: 'M', margin: 4, width: 400 });
    res.json({ qrDataUrl, expiresInMinutes: TTL_MINUTES });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/employee/my-attendance?from=&to=
exports.getMyAttendance = async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = { employee: req.user._id };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }
    const records = await Attendance.find(query).sort({ date: -1 });
    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
