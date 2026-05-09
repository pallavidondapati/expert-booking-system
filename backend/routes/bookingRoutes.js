const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createBooking, getBookingsByEmail, updateBookingStatus } = require('../controllers/bookingController');

const bookingValidation = [
  body('expertId').notEmpty().withMessage('Expert ID is required'),
  body('userName')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('userEmail')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address'),
  body('userPhone')
    .notEmpty().withMessage('Phone is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      const selected = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) throw new Error('Date cannot be in the past');
      return true;
    }),
  body('timeSlot')
    .notEmpty().withMessage('Time slot is required')
    .matches(/^\d{2}:\d{2}$/).withMessage('Time must be in HH:MM format'),
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes must be under 500 characters'),
];

// POST /api/bookings
router.post('/', bookingValidation, createBooking);

// GET /api/bookings?email=user@example.com
router.get('/', getBookingsByEmail);

// PATCH /api/bookings/:id/status
router.patch('/:id/status', updateBookingStatus);

module.exports = router;
