const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization) {
        try {
            // Frontend sends "Token <token>", typical for Django DRF
            // We need to handle "Token" or "Bearer"
            const parts = req.headers.authorization.split(' ');
            if (parts.length === 2 && (parts[0] === 'Token' || parts[0] === 'Bearer')) {
                token = parts[1];

                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                req.user = await User.findById(decoded.id).select('-password');

                next();
            } else {
                res.status(401).json({ error: 'Not authorized, token failed format' });
            }
        } catch (error) {
            console.error(error);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }
};

module.exports = { protect };
