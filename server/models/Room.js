const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  status: { type: String, enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'], default: 'AVAILABLE' },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // reference to Doctor (User model)
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
