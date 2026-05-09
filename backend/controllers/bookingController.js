const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Expert = require('../models/Expert');

// POST /api/bookings — with atomic operation to prevent double booking
const createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { expertId, userName, userEmail, userPhone, date, timeSlot, notes } = req.body;
  const io = req.app.get('io');

  // Use a MongoDB session for atomic transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Atomically mark the slot as booked using findOneAndUpdate with $elemMatch
    // This prevents race conditions — only ONE request can successfully update isBooked: false -> true
    const updatedExpert = await Expert.findOneAndUpdate(
      {
        _id: expertId,
        availableSlots: {
          $elemMatch: {
            date,
            time: timeSlot,
            isBooked: false, // KEY: only matches if slot is still available
          },
        },
      },
      {
        $set: { 'availableSlots.$.isBooked': true },
      },
      { new: true, session }
    );

    if (!updatedExpert) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: 'This time slot has already been booked. Please choose another slot.',
      });
    }

    // Step 2: Create the booking record
    const booking = new Booking({
      expertId,
      expertName: updatedExpert.name,
      expertCategory: updatedExpert.category,
      userName,
      userEmail,
      userPhone,
      date,
      timeSlot,
      notes: notes || '',
      status: 'Pending',
    });

    await booking.save({ session });

    // Step 3: Update the slot with the booking reference
    await Expert.updateOne(
      { _id: expertId, 'availableSlots.date': date, 'availableSlots.time': timeSlot },
      { $set: { 'availableSlots.$.bookingId': booking._id } },
      { session }
    );

    await session.commitTransaction();

    // Step 4: Emit real-time update to all clients viewing this expert
    if (io) {
      io.to(`expert-${expertId}`).emit('slot-booked', {
        expertId,
        date,
        timeSlot,
        bookingId: booking._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      data: booking,
    });
  } catch (error) {
    await session.abortTransaction();

    // Handle MongoDB duplicate key error (unique index as backup)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This slot was just booked by someone else. Please choose another slot.',
      });
    }

    res.status(500).json({ success: false, message: 'Server error creating booking', error: error.message });
  } finally {
    session.endSession();
  }
};

// GET /api/bookings?email=
const getBookingsByEmail = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email query parameter is required' });
  }

  try {
    const bookings = await Booking.find({ userEmail: email.toLowerCase() })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching bookings', error: error.message });
  }
};

// PATCH /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = status;
    await booking.save({ session });

    // If cancelled, free up the slot
    if (status === 'Cancelled') {
      await Expert.updateOne(
        {
          _id: booking.expertId,
          'availableSlots.date': booking.date,
          'availableSlots.time': booking.timeSlot,
        },
        {
          $set: {
            'availableSlots.$.isBooked': false,
            'availableSlots.$.bookingId': null,
          },
        },
        { session }
      );

      const io = req.app.get('io');
      if (io) {
        io.to(`expert-${booking.expertId}`).emit('slot-released', {
          expertId: booking.expertId,
          date: booking.date,
          timeSlot: booking.timeSlot,
        });
      }
    }

    await session.commitTransaction();
    res.json({ success: true, message: 'Booking status updated', data: booking });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: 'Server error updating booking', error: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = { createBooking, getBookingsByEmail, updateBookingStatus };
