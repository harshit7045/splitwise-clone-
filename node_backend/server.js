const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json()); // Body parser
app.use(cors({
    origin: '*', // Allow all origins for now
    credentials: true
}));
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Logging
}

// Routes
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/expenses/groups', require('./routes/groupRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
// Note: /api/expenses/groups is also handled by groupRoutes.
// But expenseRoutes handles /expenses/groups/:id/expenses etc.
// The routing structure needs be accurate.
// In Django:
// /expenses/groups/ -> GroupList
// /expenses/groups/:id/ -> GroupDetail
// /expenses/groups/:id/expenses/ -> ExpenseList
// /expenses/ -> Global? No, Django 'expenses/urls.py' had it all.

// To match EXACTLY:
// 1. Groups URL: /api/expenses/groups
// 2. Global URL: /api/expenses/global-balance
// 3. Auth URL: /api/auth (and /api-token-auth)
// My mounting above works if the Router paths are relative.
// - groupRoutes ('/') -> /api/expenses/groups/
// - expenseRoutes ('/global-balance/') -> /api/expenses/global-balance/
// - expenseRoutes ('/groups/:id/expenses/') -> /api/expenses/groups/:id/expenses/
// This looks correct.

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
