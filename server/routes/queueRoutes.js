const express = require('express');
const router = express.Router();
const {
  getQueue,
  checkIn,
  startConsultation,
  completeConsultation,
  markNoShow
} = require('../controllers/queueController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:doctorId', protect, getQueue);
router.post('/check-in', protect, authorize('PATIENT'), checkIn);
router.put('/:id/start', protect, authorize('DOCTOR'), startConsultation);
router.put('/:id/complete', protect, authorize('DOCTOR'), completeConsultation);
router.put('/:id/no-show', protect, authorize('DOCTOR'), markNoShow);

module.exports = router;
