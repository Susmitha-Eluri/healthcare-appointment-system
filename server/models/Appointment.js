const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['BOOKED', 'CHECKED_IN', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'BOOKED'
  },
  queueNumber: { type: String },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
}, { timestamps: true });

// Prevent double booking for the same doctor at the same time
appointmentSchema.index({ doctor: 1, date: 1, startTime: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: { $in: ['BOOKED', 'CHECKED_IN', 'WAITING', 'IN_PROGRESS'] } } 
});

module.exports = mongoose.model('Appointment', appointmentSchema);
