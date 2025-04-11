const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

// GET tutti gli utenti (admin)
router.get('/', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    const { bannato, classe, ruolo } = req.query;
    const connection = await pool.getConnection();
    
    try {
        let baseQuery = `
            SELECT u.idUtente, u.mail, u.bannato, c.nome AS classe, 
                   u.google_id, u.foto_url, u.ruolo 
            FROM Utente u 
            INNER JOIN Classe c ON c.id = u.classe
        `;

        const whereClauses = [];
        const values = [];

        if (bannato) {
            whereClauses.push('u.bannato = ?');
            values.push(bannato);
        }

        if (classe) {
            whereClauses.push('c.nome = ?');
            values.push(classe);
        }

        if (ruolo) {
            whereClauses.push('u.ruolo = ?');
            values.push(ruolo);
        }

        if (whereClauses.length > 0) {
            baseQuery += ' WHERE ' + whereClauses.join(' AND ');
        }

        const [rows] = await connection.query(baseQuery, values);
        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// GET profilo utente corrente
router.get('/me', authenticateJWT, async (req, res) => {
    const userId = req.user.user;
    const userRole = req.user.ruolo;
    const connection = await pool.getConnection();

    try {
        let rows;
        if (userRole === 'gestore') {
            [rows] = await connection.query(
                'SELECT ug.username, g.nome as gestione FROM UtenteGestione ug, Gestione g WHERE utenteId = ? AND ug.idGestione = g.idGestione',
                [userId]
            );
        } else {
            [rows] = await connection.query(
                'SELECT u.idUtente, u.mail, c.nome AS classe, u.google_id, u.foto_url, u.ruolo FROM Utente u INNER JOIN Classe c ON c.id = u.classe WHERE u.idUtente = ?',
                [userId]
            );
        }
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});


// GET utenti paninari (admin)
router.get('/paninari', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    const { bannato, classe } = req.query;

    const connection = await pool.getConnection();
    try {
        let query = `
            SELECT u.idUtente, u.mail, u.bannato, c.nome AS classe, u.google_id, u.foto_url, u.ruolo
            FROM Utente u
            INNER JOIN Classe c ON c.id = u.classe
            WHERE u.ruolo = "paninaro"
        `;
        
        const queryParams = [];
        
        if (bannato) {
            query += ' AND u.bannato = ?';
            queryParams.push(bannato);
        }
        
        if (classe) {
            console.log("classe: " + classe);
            query += ' AND c.nome = ?';
            queryParams.push(classe);
        }
        
        const [rows] = await connection.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// PATCH banna utente (admin)
router.patch('/:userId/ban', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    const userId = req.params.userId;
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query('UPDATE Utente SET bannato = 1 WHERE idUtente = ?', [userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User banned successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// PATCH sbanna utente (admin)
router.patch('/:userId/unban', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    const userId = req.params.userId;
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query('UPDATE Utente SET bannato = 0 WHERE idUtente = ?', [userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User unbanned successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// PATCH modifica ruolo (admin)
router.patch('/:userId/ruolo', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    const userId = req.params.userId;
    const { ruolo } = req.body;
    
    const validRoles = ['paninaro', 'studente', 'prof'];
    
    if (!validRoles.includes(ruolo)) {
        return res.status(400).json({ error: 'Ruolo not found' });
    }
    
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query(
            'UPDATE Utente SET ruolo = ? WHERE idUtente = ?',
            [ruolo, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});


// GET singolo utente (admin)
router.get('/:userId', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    const userId = req.params.userId;
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(
            'SELECT c.nome AS classe_nome, u.* FROM Utente u INNER JOIN Classe c ON c.id = u.classe WHERE u.idUtente = ?',
            [userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// PUT modifica utente (admin)
router.put('/:userId', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    const userId = req.params.userId;
    const { email, classe } = req.body;
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query('UPDATE Utente SET mail = ?, classe = ? WHERE idUtente = ?', [email, classe, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

module.exports = router;