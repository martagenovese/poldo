const express = require('express');
const router = express.Router();
const passport = require('passport');
const { pool } = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id, role: req.user.role }, process.env.JWT_SECRET);
    res.json({ token });
});

// Local login for bar managers
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM UtenteGestione WHERE username = ?',
            [username]
        );
        if (!rows[0] || !bcrypt.compareSync(password, rows[0].password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { id: rows[0].idUtente, role: 'gestore' },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );
        res.json({ token });
    } finally {
        connection.release();
    }
});

// Activate Paninaro role

module.exports = router;