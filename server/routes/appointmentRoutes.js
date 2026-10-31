const express = require('express');
const router = express.Router();
const {
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/slots/:doctorId', protect, getAvailableSlots);
router.post('/', protect, authorize('PATIENT'), bookAppointment);
router.get('/my', protect, authorize('PATIENT'), getMyAppointments);
router.get('/doctor', protect, authorize('DOCTOR'), getDoctorAppointments);
router.put('/:id/status', protect, updateAppointmentStatus);

module.exports = router;
