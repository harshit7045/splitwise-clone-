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
    const { name, username, email, password } = req.body;

    const userExists = await User.findOne({ username });

    if (userExists) {
        return res.status(400).json({ error: 'User already exists' });
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
            token: generateToken(user._id)
        });
    } else {
        res.status(400).json({ error: 'Invalid user data' });
    }
};

module.exports = { authUser, registerUser };
