const express = require('express');
const router = express.Router();
const { getDepartments, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getDepartments)
  .post(protect, authorize('ADMIN'), createDepartment);

router.route('/:id')
  .put(protect, authorize('ADMIN'), updateDepartment)
  .delete(protect, authorize('ADMIN'), deleteDepartment);

module.exports = router;
