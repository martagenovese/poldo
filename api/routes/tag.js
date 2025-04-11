const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

// Ottieni tutti i tag
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Tag');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});

// Aggiungi un nuovo tag
router.post('/', authenticateJWT, authorizeRole(['admin', 'gestore']), async (req, res) => {
    const tagName = req.body;
    if (!tagName) {
        return res.status(400).json({ error: 'Nome richiesto' });
    }

    try {
        const [result] = await pool.query('INSERT INTO Tag (nome) VALUES (?)', [tagName]);
        res.status(201).json({ id: result.insertId, tagName });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Tag già esistente' });
        }
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});

// Elimina un tag
router.delete('/:tagName', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    const tagName = req.params.tagName;
    try {
        const [rows] = await pool.query('SELECT idProdotto FROM ProdottoTag WHERE tag = ?', [tagName]);

        if (rows.length > 0) {
            return res.status(400).json({ error: 'Il tag non può essere eliminato perché associato a prodotti' });
        }

        const [result] = await pool.query('DELETE FROM Tag WHERE nome = ?', [tagName]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tag non trovato' });
        }
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});

module.exports = router;