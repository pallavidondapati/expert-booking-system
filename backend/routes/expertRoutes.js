const express = require('express');
const router = express.Router();
const { getExperts, getExpertById, getCategories } = require('../controllers/expertController');

// GET /api/experts/categories
router.get('/categories', getCategories);

// GET /api/experts?page=1&limit=6&category=Technology&search=AI
router.get('/', getExperts);

// GET /api/experts/:id
router.get('/:id', getExpertById);

module.exports = router;
