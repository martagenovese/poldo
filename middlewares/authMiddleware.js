const jwt = require('jsonwebtoken');
const { DB } = require('../config');

module.exports = {
    authenticateJWT: (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
                if (err) return res.sendStatus(403);
                req.user = user;
                next();
            });
        } else {
            res.sendStatus(401);
        }
    },

    // Ruolo salvato nel token JWT, non ricerca ogni volta db (o si?)
    authorizeRole: (roles) => (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        next();
    }
};