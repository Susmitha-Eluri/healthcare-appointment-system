const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');

// Helper to notify clients
const notifyQueueUpdate = (req, doctorId) => {
  const io = req.app.get('io');
  if (io) {
    io.to(`queue_${doctorId}`).emit('queue_updated', { doctorId });
  }
};

// @desc    Get current queue for a doctor (today)
// @route   GET /api/queue/:doctorId
// @access  Private
const getQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setUTCHours(23, 59, 59, 999);

    const queue = await Appointment.find({
      doctor: doctorId,
      date: { $gte: today, $lte: endOfToday },
      status: { $in: ['CHECKED_IN', 'WAITING', 'IN_PROGRESS'] }
    })
      .populate('patient', 'name')
      .sort({ queueNumber: 1, startTime: 1 }); // Sort by queue number

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check-in patient (Generate queue number)
// @route   POST /api/queue/check-in
// @access  Private/Patient
const checkIn = async (req, res) => {
  const { appointmentId } = req.body;
  try {
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to check-in for this appointment' });
    }

    if (appointment.status !== 'BOOKED') {
      return res.status(400).json({ message: `Cannot check-in. Current status is ${appointment.status}` });
    }

    // Verify it's today
    const appDate = new Date(appointment.date);
    const today = new Date();
    if (
      appDate.getUTCFullYear() !== today.getUTCFullYear() ||
      appDate.getUTCMonth() !== today.getUTCMonth() ||
      appDate.getUTCDate() !== today.getUTCDate()
    ) {
      return res.status(400).json({ message: 'Can only check-in on the day of the appointment' });
    }

    // Generate Queue Number (e.g., A101)
    // Find highest queue number for this doctor today
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const latestAppt = await Appointment.findOne({
      doctor: appointment.doctor,
      date: { $gte: startOfDay, $lte: endOfDay },
      queueNumber: { $exists: true, $ne: null }
    }).sort({ queueNumber: -1 });

    let nextQueueNumber = 'A101';
    if (latestAppt && latestAppt.queueNumber) {
      const numPart = parseInt(latestAppt.queueNumber.substring(1), 10);
      nextQueueNumber = `A${numPart + 1}`;
    }

    appointment.status = 'WAITING'; // skips CHECKED_IN for simplicity, or we can use WAITING directly
    appointment.queueNumber = nextQueueNumber;
    await appointment.save();

    notifyQueueUpdate(req, appointment.doctor);

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Start consultation
// @route   PUT /api/queue/:id/start
// @access  Private/Doctor
const startConsultation = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Not found' });
    
    // Ensure only the assigned doctor can start
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    appointment.status = 'IN_PROGRESS';
    await appointment.save();

    notifyQueueUpdate(req, appointment.doctor);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete consultation
// @route   PUT /api/queue/:id/complete
// @access  Private/Doctor
const completeConsultation = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Not found' });
    
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    appointment.status = 'COMPLETED';
    await appointment.save();

    notifyQueueUpdate(req, appointment.doctor);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark no-show
// @route   PUT /api/queue/:id/no-show
// @access  Private/Doctor
const markNoShow = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Not found' });
    
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    appointment.status = 'NO_SHOW';
    await appointment.save();

    notifyQueueUpdate(req, appointment.doctor);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getQueue,
  checkIn,
  startConsultation,
  completeConsultation,
  markNoShow
};
