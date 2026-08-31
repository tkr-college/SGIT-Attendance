const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getDashboard,
  createEmployee,
  listEmployees,
  updateEmployee,
  deleteEmployee,
  exportAttendance,
} = require('../controllers/adminController');

router.use(protect, adminOnly);
router.get('/dashboard', getDashboard);
router.get('/employees', listEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);
router.get('/export', exportAttendance);

module.exports = router;
