const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:MM
  isBooked: { type: Boolean, default: false },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
});

const expertSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Technology', 'Finance', 'Healthcare', 'Legal', 'Marketing', 'Design', 'Entrepreneurship', 'Other'],
    },
    specialization: { type: String, required: true },
    experience: { type: Number, required: true, min: 0 },
    rating: { type: Number, required: true, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 },
    bio: { type: String, required: true },
    avatar: { type: String, required: true }, // initials
    hourlyRate: { type: Number, required: true },
    availableSlots: [slotSchema],
  },
  { timestamps: true }
);

expertSchema.index({ name: 'text', specialization: 'text' });
expertSchema.index({ category: 1 });

module.exports = mongoose.model('Expert', expertSchema);
