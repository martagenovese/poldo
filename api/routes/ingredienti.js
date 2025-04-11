const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

// Ottieni tutti gli ingredienti
router.get('/', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();

    const { orderDirection } = req.query;
    const validOrderDirections = ['ASC', 'DESC'];

    if (orderDirection && !validOrderDirections.includes(orderDirection)) {
        return res.status(400).json({ error: 'Direzione di ordinamento non valida' });
    }

    const orderBy = orderDirection ? orderDirection : 'ASC';

    try {
        const [rows] = await connection.query(`SELECT * FROM Ingrediente ORDER BY nome ${orderBy}`);
        
        if(rows.length === 0) {
            return res.status(404).json({ error: 'Nessun ingrediente trovato' });
        }
        
        res.json(rows);
    }
    catch (error) {
        console.error('Errore nel recupero degli ingredienti:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});

// Aggiungi un nuovo ingrediente
router.post('/', authenticateJWT, authorizeRole(['gestore', 'admin']), async (req, res) => {
    const { nomeIngrediente } = req.body;

    // Validazione dell'input
    if (typeof nomeIngrediente !== 'string' || nomeIngrediente.trim() === '') {
        return res.status(400).json({ error: "Il campo 'nome' deve essere una stringa non vuota" });
    }

    const nomeFromatted = nomeIngrediente.trim().toLowerCase();

    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query(
            'INSERT INTO Ingrediente (nome) VALUES (?)',
            [nomeFromatted]
        );
        
        res.status(201).json({nome: nomeFromatted});

    } catch (error) {
        console.error('Errore nella creazione dell\'ingrediente:', error);
        
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

// Elimina un ingrediente
router.delete('/:nomeIngrediente', authenticateJWT, authorizeRole(['gestore', 'admin']), async (req, res) => {
    const nomeIngrediente = req.params.nomeIngrediente;

    // Validazione dell'input
    if (typeof nomeIngrediente !== 'string' || nomeIngrediente.trim() === '') {
        return res.status(400).json({ error: 'ID non valido' });
    }

    const connection = await pool.getConnection();

    const nomeFromatted = nomeIngrediente.trim().toLowerCase();

    try {
        const [result] = await connection.query(
            'DELETE FROM Ingrediente WHERE nome = ?',
            [nomeFromatted]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ingrediente non trovato' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Errore nell\'eliminazione dell\'ingrediente:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
})

module.exports = router;