const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMe, getMyQr, getMyAttendance } = require('../controllers/employeeController');

router.use(protect);
router.get('/me', getMe);
router.get('/qr', getMyQr);
router.get('/my-attendance', getMyAttendance);

module.exports = router;
