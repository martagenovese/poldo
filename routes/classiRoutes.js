const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');


// gets

router.get('/', authenticateJWT, authorizeRole('admin'), async (req, res) => {
    connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM Classe');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

router.get('/:id', authenticateJWT, authorizeRole('admin'), async (req, res) => {
    const { id } = req.params.id;
    connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('SELECT c.nome, u.* FROM Classe c, Utente u WHERE c.id = ? AND c.id = u.classe_id', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Classe not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

router.get('/miaClasse', authenticateJWT, authorizeRole('paninaro'), async (req, res) => {
    const { id } = req.user.id;
    connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('SELECT u.*, c.nome FROM Classe c, Utente u WHERE c.id = ? AND c.id = u.classe_id', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Classe not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});



