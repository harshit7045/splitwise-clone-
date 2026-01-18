const express = require('express');
const router = express.Router();
const { createGroup, getUserGroups, joinGroup, getGroupMembers } = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createGroup); // Create a group
router.get('/', protect, getUserGroups); // Get all groups for user
router.post('/:id/join/', protect, joinGroup); // Join a group
router.get('/:id/members/', protect, getGroupMembers); // Get group members

module.exports = router;
