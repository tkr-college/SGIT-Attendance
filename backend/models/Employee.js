const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    employeeCode: { type: String, required: true, unique: true }, // stable ID encoded in QR
    deviceId: { type: String, default: null }, // for optional 1-device-per-employee restriction
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
