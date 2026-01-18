const express = require('express');
const router = express.Router();
const {
    getGroupExpenses,
    createExpense,
    getGroupBalances,
    getUserGlobalBalance,
    getUserActivity
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.route('/groups/:id/expenses/')
    .get(protect, getGroupExpenses)
    .post(protect, createExpense);

router.get('/groups/:id/balances/', protect, getGroupBalances);
router.get('/groups/:id/members/', async (req, res) => {
    // Redirect to group controller logic if needed, but the route structure in Django was:
    // /api/expenses/groups/:id/members/ handled by GroupMembersView.
    // In Node, I put getGroupMembers in groupController but routed it via groupRoutes.
    // Wait, my groupRoutes file handled /:id/members/.
    // But the Django app had URLs like /expenses/groups/...
    // I need to make sure my server.js mounts these correctly.
});

// Global Routes
router.get('/global-balance/', protect, getUserGlobalBalance);
router.get('/activity/', protect, getUserActivity);

module.exports = router;
