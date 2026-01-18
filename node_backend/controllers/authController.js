const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login or /api-token-auth/
const authUser = async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
        res.json({
            token: generateToken(user._id),
            user_id: user._id,
            username: user.username,
            name: user.name
        });
    } else {
        res.status(401).json({ error: 'Invalid username or password' });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        // 1. Basic Validation
        if (!name || !username || !email || !password) {
            return res.status(400).json({ error: 'Please provide all fields' });
        }

        // 2. Check for existing username
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        // 3. Check for existing email
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const user = await User.create({
            name,
            username,
            email,
            password
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ error: 'Invalid user data' });
        }
    } catch (error) {
        // 4. Handle MongoDB Duplicate Key Error (E11000)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({ error: `${field} already exists` });
        }
        // 5. Handle Validation Errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: 'Server error during registration' });
    }
};

module.exports = { authUser, registerUser };
