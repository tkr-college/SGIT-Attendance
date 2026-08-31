const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD, one doc per employee per day
    checkInTime: { type: Date, default: null },
    checkOutTime: { type: Date, default: null },
    status: {
      type: String,
      enum: ['Present', 'Late', 'Absent', 'Incomplete'],
      default: 'Absent',
    },
    checkInLocation: {
      lat: Number,
      lng: Number,
    },
    checkOutLocation: {
      lat: Number,
      lng: Number,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
