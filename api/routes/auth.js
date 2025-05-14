const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const pool = require('../utils/db');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
    const connection = await pool.getConnection();
    console.log(profile);
    try {
        const [rows] = await connection.execute(
            'SELECT idUtente as id, ruolo FROM Utente WHERE google_id = ?',
            [profile.id]
        );
        
        if (rows.length > 0) {
            return done(null, rows[0]);
        }

        const ruolo = profile.emails[0].value.endsWith('@studenti.marconiverona.it') ? 'studente' : 'prof';
        
        const classe = 0; 
        
        const [newUser] = await connection.execute(
            'INSERT INTO Utente (mail, google_id, ruolo, foto_url, classe) VALUES (?, ?, ?, ?, ?)',
            [profile.emails[0].value, profile.id, ruolo, profile.photos[0].value, classe]
        );

        newUser.id = newUser.insertId;
        newUser.ruolo = ruolo;

        done(null, newUser);
        
    } catch (err) {
        done(err);
    } finally {
        connection.release();
    }
}));

// Google OAuth
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'], 
    session: false
}));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), (req, res) => {
    const token = jwt.sign(
        { id: req.user.id, ruolo: req.user.ruolo },
        process.env.JWT_SECRET,
        { expiresIn: '1y' }
    );
    
    //TODO: cambiare
    //res.status(200).json({token: token});
    res.redirect(`http://localhost:5173/callback#token=${token}`);
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT utenteId as id, idUtenteGestione as idGestione, password FROM UtenteGestione WHERE username = ?',
            [username]
        );

        //TODO: da criptare e cambiare if

        // if (!rows[0] || !bcrypt.compareSync(password, rows[0].password)) {
        //     return res.status(401).json({ message: 'Credenziali non valide' });
        // }

        if(!rows[0] || rows[0].password !== password) {
            return res.status(401).json({ message: 'Credenziali non valide' });
        }
        
        const token = jwt.sign(
            { idGestione: rows[0].idGestione, ruolo: 'gestore', id: rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '1y' }
        );
        res.json({ token });
    } finally {
        connection.release();
    }
});

// Attivare ruolo Paninaro

module.exports = router;
