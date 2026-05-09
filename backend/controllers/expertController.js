const Expert = require('../models/Expert');

// GET /api/experts
const getExperts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 6,
      category,
      search,
      sortBy = 'rating',
      order = 'desc',
    } = req.query;

    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };

    const [experts, total] = await Promise.all([
      Expert.find(query)
        .select('-availableSlots')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Expert.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: experts,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching experts', error: error.message });
  }
};

// GET /api/experts/:id
const getExpertById = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert not found' });
    }

    // Group available slots by date
    const slotsByDate = {};
    expert.availableSlots.forEach((slot) => {
      if (!slotsByDate[slot.date]) {
        slotsByDate[slot.date] = [];
      }
      slotsByDate[slot.date].push({
        _id: slot._id,
        time: slot.time,
        isBooked: slot.isBooked,
      });
    });

    const expertData = expert.toObject();
    expertData.slotsByDate = slotsByDate;

    res.json({ success: true, data: expertData });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Expert not found' });
    }
    res.status(500).json({ success: false, message: 'Server error fetching expert', error: error.message });
  }
};

// GET /api/experts/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Expert.distinct('category');
    res.json({ success: true, data: ['All', ...categories] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getExperts, getExpertById, getCategories };
