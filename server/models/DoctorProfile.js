const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  consultationDuration: { type: Number, default: 30 }, // in minutes
  profileImage: { type: String },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  workingDays: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  startTime: { type: String, required: true }, // e.g., '09:00'
  endTime: { type: String, required: true },   // e.g., '17:00'
  breakStartTime: { type: String }, // e.g., '13:00'
  breakEndTime: { type: String },   // e.g., '14:00'
  unavailableDates: [{ type: Date }]
}, { timestamps: true });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
