const express = require('express');
const router = express.Router();
const { authUser, registerUser } = require('../controllers/authController');

router.post('/login', authUser);
router.post('/register', registerUser);
// Alias for Django compatibility if needed
router.post('/api-token-auth/', authUser);

module.exports = router;
