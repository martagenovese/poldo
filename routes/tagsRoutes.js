const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');


// gets
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Tag');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

router.get('/gestioni', authenticateJWT, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.proprietario, pt.tag 
            FROM Prodotto p, ProdottoTag pt 
            WHERE p.id = pt.idProdotto AND p.proprietario = ?
            ORDER BY p.proprietario`, [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});


// ---
router.post('/', authenticateJWT, authorizeRole(['admin', 'gestore']), async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    try {
        const [result] = await pool.query('INSERT INTO Tag (nome) VALUES (?)', [name]);
        res.status(201).json({ id: result.insertId, name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

router.put('/:id', authenticateJWT, authorizeRole(['admin', 'gestore']), async (req, res) => {
    const { id } = req.params.id;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    try {
        const [result] = await pool.query('UPDATE Tag SET nome = ? WHERE nome = ?', [name, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        res.json({ id, name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

router.delete('/:id', authenticateJWT, authorizeRole(['admin', 'gestore']), async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM Tag WHERE nome = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});