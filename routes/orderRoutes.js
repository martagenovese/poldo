const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

router.post('/ordine', authenticateJWT, async (req, res) => {
    const { items } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Creazione ordine
        const [orderResult] = await connection.execute(
            'INSERT INTO OrdineSingolo (user, data, nTurno, giorno) VALUES (?, CURDATE(), 1, "LUN")',
            [req.user.id]
        );
        
        const orderId = orderResult.insertId;
        
        // Aggiunta prodotti
        await connection.query(
            'INSERT INTO DettagliOrdineSingolo (idOrdineSingolo, idProdotto, quantita) VALUES ?',
            [items.map(item => [orderId, item.productId, item.quantity])]
        );
        
        await connection.commit();
        res.status(201).json({ orderId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Order creation failed' });
    } finally {
        connection.release();
    }
});