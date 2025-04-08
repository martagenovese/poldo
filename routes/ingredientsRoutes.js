const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');


router.get('/ingredienti', authenticateJWT, authorizeRole('gestore', 'admin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM ingredienti');
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching ingredients:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});


router.post('/ingredienti', authenticateJWT, authorizeRole('gestore', 'admin'), async (req, res) => {
    const { nome } = req.body;

    // Validazione dell'input
    if (typeof nome !== 'string' || nome.trim() === '') {
        return res.status(400).json({ error: "Il campo 'nome' deve essere una stringa non vuota" });
    }

    nome = nome.trim().toLowerCase();

    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query(
            'INSERT INTO ingredienti (nome) VALUES (?)',
            [nome]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            nome: nome 
        });

    } catch (error) {
        console.error('Error creating ingredient:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ 
                error: 'Ingrediente già presente nel database',
                details: `L'ingrediente "${nome}" esiste già`
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