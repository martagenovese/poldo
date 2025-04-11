const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM Turno');
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching turn:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});

router.post('/', authenticateJWT, authorizeRole('admin'), async (req, res) => {
    const { n, data, oraInizioOrdine, oraFineOrdine, oraInizioRitiro, oraFineRitiro } = req.body;
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query('INSERT INTO Turno (n, data, oraInizioOrdine, oraFineOrdine, oraInizioRitiro, oraFineRitiro) VALUES (?, ?, ?, ?, ?, ?)', [n, data, oraInizioOrdine, oraFineOrdine, oraInizioRitiro, oraFineRitiro]);
        res.status(201).json({ id: result.insertId });
    }
    catch (error) {
        console.error('Error creating turn:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
}
);

router.put('/:id', authenticateJWT, authorizeRole('admin'), async (req, res) => {
    const { n, data, oraInizioOrdine, oraFineOrdine, oraInizioRitiro, oraFineRitiro } = req.body;
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query('UPDATE turni SET n = ?, data = ?, oraInizioOrdine = ?, oraFineOrdine = ?, oraInizioRitiro = ?, oraFineRitiro = ? WHERE id = ?', [n, data, oraInizioOrdine, oraFineOrdine, oraInizioRitiro, oraFineRitiro, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Turno non trovato' });
        }
        res.json({ message: 'Turno aggiornato con successo' });
    }
    catch (error) {
        console.error('Error updating turno:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
}
);


router.delete('/:id', authenticateJWT, authorizeRole('admin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query('DELETE FROM Turno WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Turno non trovato' });
        }
        res.json({ message: 'Turno eliminato con successo' });
    }
    catch (error) {
        console.error('Error deleting turno:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
}
);
