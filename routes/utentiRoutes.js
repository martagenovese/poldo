const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');


// gets

router.get('/', authenticateJWT, authorizeRole('admin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('SELECT c.nome, u.* FROM Utente u, Classe c WHERE c.id=u.classe');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});
router.get('/:id', authenticateJWT, authorizeRole('admin'), async (req, res) => {
    const id = req.params.id;
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('SELECT c.nome, u.* FROM Utente u, Classe c WHERE c.id=u.classe AND u.id = ?', [id]);
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
router.get('/io', authenticateJWT, async (req, res) => {
    const id = req.user.id;
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('SELECT u.*, c.nome FROM Utente u, Classe c WHERE c.id=u.classe AND u.id = ?', [id]);
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
router.get('/paninari', authenticateJWT, authorizeRole('admin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('SELECT u.*, c.nome FROM Utente u, Classe c WHERE paninaro = 1 AND c.id=u.classe');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});
router.get('/banned', authenticateJWT, authorizeRole('admin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('SELECT u.*, c.classe FROM Utente u, Classe c WHERE u.classe=c.id AND banned = 1');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});


// patches

router.patch('/:id/ban', authenticateJWT, authorizeRole('admin'), async (req, res) => {
    const id = req.params.id;
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('UPDATE Utente SET banned = 1 WHERE idUtente = ?', [id]);
        if (rows.affectedRows === 0) {
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
router.patch('/:id/unban', authenticateJWT, authorizeRole('admin'), async (req, res) => {
    const id = req.params.id;
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('UPDATE Utente SET banned = 0 WHERE idUtente = ?', [id]);
        if (rows.affectedRows === 0) {
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
router.patch('/:id/ruolo', authenticateJWT, authorizeRole('admin'), async (req, res) => {
    const id = req.params.id;
    const { ruolo } = req.body;
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('UPDATE Utente SET ruolo = ? WHERE idUtente = ?', [ruolo, id]);
        if (rows.affectedRows === 0) {
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

// puts
router.put('/:id', authenticateJWT, authorizeRole('admin'), async (req, res) => {
    const id = req.params.id;
    const { email, classe } = req.body;
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('UPDATE Utente SET mail = ?, classe = ? WHERE idUtente = ?', [email, classe, id]);
        if (rows.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        connection.release();
    }
});



