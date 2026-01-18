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

// Global Routes
router.get('/global-balance/', protect, getUserGlobalBalance);
router.get('/activity/', protect, getUserActivity);

module.exports = router;
