const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');

const getDayName = (dateString) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateString);
  return days[d.getDay()];
};

const generateTimeSlots = (start, end, duration) => {
  const slots = [];
  let current = new Date(`2000-01-01T${start}:00`);
  const endTime = new Date(`2000-01-01T${end}:00`);

  while (current < endTime) {
    const slotTime = current.toTimeString().substring(0, 5);
    slots.push(slotTime);
    current.setMinutes(current.getMinutes() + duration);
  }
  return slots;
};

// @desc    Get available slots for a doctor on a specific date
// @route   GET /api/appointments/slots/:doctorId?date=YYYY-MM-DD
// @access  Private
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const doctor = await DoctorProfile.findOne({ user: doctorId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if the date is a working day
    const dayName = getDayName(date);
    if (!doctor.workingDays.includes(dayName)) {
      return res.json([]); // No slots on non-working days
    }

    // Check if date is in unavailable dates
    const dateObj = new Date(date);
    const isUnavailable = doctor.unavailableDates.some(
      (unavailDate) => unavailDate.toISOString().split('T')[0] === date
    );
    if (isUnavailable) {
      return res.json([]);
    }

    // Generate all slots
    let allSlots = generateTimeSlots(doctor.startTime, doctor.endTime, doctor.consultationDuration);

    // Remove break time slots
    if (doctor.breakStartTime && doctor.breakEndTime) {
      const breakStart = new Date(`2000-01-01T${doctor.breakStartTime}:00`);
      const breakEnd = new Date(`2000-01-01T${doctor.breakEndTime}:00`);
      
      allSlots = allSlots.filter((slot) => {
        const slotTime = new Date(`2000-01-01T${slot}:00`);
        return slotTime < breakStart || slotTime >= breakEnd;
      });
    }

    // Fetch existing appointments for this date
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $in: ['BOOKED', 'CHECKED_IN', 'WAITING', 'IN_PROGRESS'] }
    });

    const bookedSlotTimes = existingAppointments.map(app => app.startTime);
    const availableSlots = allSlots.filter(slot => !bookedSlotTimes.includes(slot));

    res.json(availableSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Private
const bookAppointment = async (req, res) => {
  const { doctor, department, date, startTime } = req.body;

  try {
    const doctorProfile = await DoctorProfile.findOne({ user: doctor });
    if (!doctorProfile) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    // Calculate end time
    const end = new Date(`2000-01-01T${startTime}:00`);
    end.setMinutes(end.getMinutes() + doctorProfile.consultationDuration);
    const endTime = end.toTimeString().substring(0, 5);

    // Double-booking check happens primarily via the MongoDB unique index,
    // but we can also check manually for a friendly error message
    const existing = await Appointment.findOne({
      doctor,
      date: startOfDay,
      startTime,
      status: { $in: ['BOOKED', 'CHECKED_IN', 'WAITING', 'IN_PROGRESS'] }
    });

    if (existing) {
      return res.status(400).json({ message: 'This slot is already booked.' });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor,
      department,
      date: startOfDay,
      startTime,
      endTime,
      status: 'BOOKED'
    });

    res.status(201).json(appointment);
  } catch (error) {
    // Check if it's a MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This slot is already booked.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient appointments
// @route   GET /api/appointments/my
// @access  Private
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name')
      .populate('department', 'name')
      .sort({ date: 1, startTime: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor appointments
// @route   GET /api/appointments/doctor
// @access  Private/Doctor
const getDoctorAppointments = async (req, res) => {
  try {
    const { date } = req.query;
    let query = { doctor: req.user._id };
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .sort({ date: 1, startTime: 1 });
      
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status (Cancel/Reschedule)
// @route   PUT /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Patients can only cancel their own appointments
    if (req.user.role === 'PATIENT' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (req.user.role === 'PATIENT' && status !== 'CANCELLED') {
       return res.status(403).json({ message: 'Patients can only cancel appointments' });
    }

    appointment.status = status;
    const updatedAppointment = await appointment.save();
    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus
};
