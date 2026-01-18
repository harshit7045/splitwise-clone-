const express = require('express');
const router = express.Router();
const { getUserGroups, createGroup, joinGroup, getGroupMembers } = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getUserGroups)
    .post(protect, createGroup);

router.post('/:id/join/', protect, joinGroup);
router.get('/:id/members/', protect, getGroupMembers);

module.exports = router;
