const jwt = require('jsonwebtoken');

module.exports = {
    authenticateJWT: (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            console.log("token: " + token);
            jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
                console.log("err:" + err); 
                if (err) 
                    return res.sendStatus(403);
                req.user = user;
                console.log("user: " + JSON.stringify(req.user));
                next();
            });
        } else {
            res.sendStatus(401);  
        }
    },

    authorizeRole: (roles) => (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        if (roles.includes(req.user.ruolo)) {
            next();
        } else {
            res.status(403).json({ error: 'Forbidden' });
        }
    }
};