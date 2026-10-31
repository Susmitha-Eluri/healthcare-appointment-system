const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
  try {
    // If department filter is passed
    const { department } = req.query;
    let query = { status: 'ACTIVE' };
    if (department) {
      query.department = department;
    }

    const doctors = await DoctorProfile.find(query)
      .populate('user', 'name email phone')
      .populate('department', 'name');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('department', 'name');
    
    if (doctor) {
      res.json(doctor);
    } else {
      res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create doctor profile
// @route   POST /api/doctors
// @access  Private/Admin
const createDoctor = async (req, res) => {
  const { name, email, password, phone, department, specialization, experience, consultationDuration, workingDays, startTime, endTime, breakStartTime, breakEndTime } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'DOCTOR'
    });

    const doctorProfile = await DoctorProfile.create({
      user: user._id,
      department,
      specialization,
      experience,
      consultationDuration,
      workingDays,
      startTime,
      endTime,
      breakStartTime,
      breakEndTime
    });

    res.status(201).json({ user, doctorProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDoctors, getDoctorById, createDoctor };
