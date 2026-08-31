const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { scan, listAttendance } = require('../controllers/attendanceController');

router.use(protect);
router.post('/scan', scan);
router.get('/', adminOnly, listAttendance);

module.exports = router;
