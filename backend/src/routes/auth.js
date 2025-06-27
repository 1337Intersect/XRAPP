const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
ECHO disattivato.
    // Simple login (add proper password hashing in production)
    if (username === 'admin' 
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

module.exports = router;
