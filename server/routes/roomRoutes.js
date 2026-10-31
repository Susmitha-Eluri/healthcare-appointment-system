const express = require('express');
const router = express.Router();
const { getRooms, createRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getRooms)
  .post(protect, authorize('ADMIN'), createRoom);

router.route('/:id')
  .put(protect, authorize('ADMIN'), updateRoom)
  .delete(protect, authorize('ADMIN'), deleteRoom);

module.exports = router;
