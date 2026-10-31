const express = require('express');
const router = express.Router();
const { getDoctors, getDoctorById, createDoctor } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getDoctors)
  .post(protect, authorize('ADMIN'), createDoctor);

router.route('/:id')
  .get(getDoctorById);

module.exports = router;
