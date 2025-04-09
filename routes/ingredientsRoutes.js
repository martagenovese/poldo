const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');


router.get('/', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM Ingrediente ORDER BY nome ASC');
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching ingredients:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});


router.post('/', authenticateJWT, authorizeRole(['gestore', 'admin']), async (req, res) => {
    const { nome } = req.body;

    // Validazione dell'input
    if (typeof nome !== 'string' || nome.trim() === '') {
        return res.status(400).json({ error: "Il campo 'nome' deve essere una stringa non vuota" });
    }

    const nomeFromatted = nome.trim().toLowerCase();

    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query(
            'INSERT INTO Ingrediente (nome) VALUES (?)',
            [nomeFromatted]
        );
        
        res.status(201).json({nome: nomeFromatted});

    } catch (error) {
        console.error('Error creating ingredient:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ 
                error: 'Ingrediente già presente nel database',
                details: `L'ingrediente "${nomeFromatted}" esiste già`
            });
        } else {
            res.status(500).json({ 
                error: 'Errore interno del server',
                details: error.message 
            });
        }
    } finally {
        connection.release();
    }
});


router.delete('/:nome', authenticateJWT, authorizeRole(['gestore', 'admin']), async (req, res) => {
    const { nome } = req.params;

    // Validazione dell'input
    if (typeof nome !== 'string' || nome.trim() === '') {
        return res.status(400).json({ error: 'ID non valido' });
    }

    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query(
            'DELETE FROM Ingrediente WHERE nome = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ingrediente non trovato' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting ingredient:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
})


module.exports = router;