const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');


// Gets
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
    const tagName = req.body;
    if (!tagName) {
        return res.status(400).json({ error: 'Name is required' });
    }
    try {
        const [result] = await pool.query('INSERT INTO Tag (nome) VALUES (?)', [tagName]);
        res.status(201).json({ id: result.insertId, tagName });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

router.put('/:oldTagName', authenticateJWT, authorizeRole(['admin', 'gestore']), async (req, res) => {
    const oldTagName = req.params.oldTagName;
    const { newTagName } = req.body;
    if (!tagName) {
        return res.status(400).json({ error: 'tag name is required' });
    }
    try {
        const [result] = await pool.query('UPDATE Tag SET nome = ? WHERE nome = ?', [newTagName, oldTagName]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        res.json({ newTagName });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

router.delete('/:tagName', authenticateJWT, authorizeRole(['admin', 'gestore']), async (req, res) => {
    const tagName = req.params.tagName;
    try {
        const [result] = await pool.query('DELETE FROM Tag WHERE nome = ?', [tagName]);
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


module.exports = router;