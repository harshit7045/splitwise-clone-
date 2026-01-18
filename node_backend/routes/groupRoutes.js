const express = require('express');
const router = express.Router();
const { createGroup, getUserGroups, getGroupExpenses } = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createGroup); // Create a group
router.get('/', protect, getUserGroups); // Get all groups for user
// router.get('/:id', protect, getGroupExpenses); // Get details of one group

module.exports = router;
