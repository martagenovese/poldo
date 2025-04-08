const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/prodotti', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT p.*, GROUP_CONCAT(pt.tag) as tags 
            FROM Prodotto p
            LEFT JOIN ProdottoTag pt ON p.idProdotto = pt.idProdotto
            WHERE p.attivo = true
            GROUP BY p.idProdotto
        `);
        res.json(rows.map(row => ({
            ...row,
            tags: row.tags ? row.tags.split(',') : []
        })));
    } finally {
        connection.release();
    }
});

router.post('/prodotti', authenticateJWT, authorizeRole(['gestore']), async (req, res) => {
    const { nome, prezzo, descrizione, tags, ingredienti } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const [productResult] = await connection.execute(
            'INSERT INTO Prodotto (nome, prezzo, descrizione, proprietario) VALUES (?, ?, ?, ?)',
            [nome, prezzo, descrizione, req.user.idGestione]
        );
        
        const productId = productResult.insertId;
        
        if (tags && tags.length > 0) {
            await connection.execute(
                'INSERT INTO ProdottoTag (idProdotto, tag) VALUES ?',
                [tags.map(tag => [productId, tag])]
            );
        }
        
        await connection.commit();
        res.status(201).json({ id: productId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Database error' });
    } finally {
        connection.release();
    }
});