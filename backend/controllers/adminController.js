const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Parser } = require('json2csv');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { todayDateString } = require('../utils/timeRules');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const date = req.query.date || todayDateString();
    const totalEmployees = await Employee.countDocuments({ role: 'employee', isActive: true });

    const records = await Attendance.find({ date });
    const present = records.filter((r) => r.status === 'Present').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const absentMarked = records.filter((r) => r.status === 'Absent').length;
    const checkedInCount = records.filter((r) => r.checkInTime).length;
    const absentees = totalEmployees - checkedInCount; // employees with no record yet today

    res.json({
      date,
      totalEmployees,
      present,
      late,
      absent: Math.max(absentees, absentMarked),
      pendingCheckouts: records.filter((r) => r.checkInTime && !r.checkOutTime).length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/employees
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email, password required' });

    const existing = await Employee.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const employeeCode = 'EMP-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const employee = await Employee.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: role === 'admin' ? 'admin' : 'employee',
      employeeCode,
    });

    res.status(201).json({ employee: { ...employee.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/employees
exports.listEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select('-password').sort({ createdAt: -1 });
    res.json({ employees });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/employees/:id
exports.updateEmployee = async (req, res) => {
  try {
    const { name, email, role, isActive, password, deviceId } = req.body;
    const update = {};
    if (name) update.name = name;
    if (email) update.email = email.toLowerCase();
    if (role) update.role = role;
    if (typeof isActive === 'boolean') update.isActive = isActive;
    if (typeof deviceId !== 'undefined') update.deviceId = deviceId; // set null to unlock device
    if (password) update.password = await bcrypt.hash(password, 10);

    const employee = await Employee.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/employees/:id
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/export?from=&to=&format=csv
exports.exportAttendance = async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = {};
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }
    const records = await Attendance.find(query).populate('employee', 'name email employeeCode').sort({ date: -1 });

    const rows = records.map((r) => ({
      date: r.date,
      employeeCode: r.employee?.employeeCode,
      name: r.employee?.name,
      email: r.employee?.email,
      status: r.status,
      checkInTime: r.checkInTime ? r.checkInTime.toISOString() : '',
      checkOutTime: r.checkOutTime ? r.checkOutTime.toISOString() : '',
    }));

    const parser = new Parser({ fields: ['date', 'employeeCode', 'name', 'email', 'status', 'checkInTime', 'checkOutTime'] });
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment(`attendance_${from || 'all'}_${to || 'all'}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Used by the daily cron job: any active employee with no attendance record
// for today gets an explicit "Absent" record created.
exports.markAbsentees = async () => {
  const date = todayDateString();
  const employees = await Employee.find({ role: 'employee', isActive: true });
  const existing = await Attendance.find({ date }).select('employee');
  const existingIds = new Set(existing.map((r) => r.employee.toString()));

  const toInsert = employees
    .filter((e) => !existingIds.has(e._id.toString()))
    .map((e) => ({ employee: e._id, date, status: 'Absent' }));

  if (toInsert.length) {
    await Attendance.insertMany(toInsert, { ordered: false }).catch(() => {});
  }
  return toInsert.length;
};
