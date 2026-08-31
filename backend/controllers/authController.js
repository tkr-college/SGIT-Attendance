const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Employee = require('../models/Employee');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

// POST /api/auth/register  (admin-only in practice; first user can bootstrap as admin)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password are required' });
    }

    const existing = await Employee.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    // Only allow admin role assignment if no admin exists yet OR request is from an authenticated admin.
    const adminCount = await Employee.countDocuments({ role: 'admin' });
    let finalRole = 'employee';
    if (role === 'admin' && adminCount === 0) finalRole = 'admin';

    const hashed = await bcrypt.hash(password, 10);
    const employeeCode = 'EMP-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const user = await Employee.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: finalRole,
      employeeCode,
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, employeeCode: user.employeeCode },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const user = await Employee.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, employeeCode: user.employeeCode },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
