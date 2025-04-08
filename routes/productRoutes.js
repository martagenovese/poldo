const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');


//TODO: filtro per tag && ingredienti && filtri vari

router.get('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT p.idProdotto, p.nome, p.prezzo, p.descrizione, p.disponibilita, GROUP_CONCAT(pt.tag) as tags 
            FROM Prodotto p
            LEFT JOIN ProdottoTag pt ON p.idProdotto = pt.idProdotto
            WHERE p.attivo = true
            GROUP BY p.idProdotto, p.nome, p.prezzo, p.descrizione, p.disponibilita
        `);

        res.json(rows.map(row => ({
            ...row,
            tags: row.tags ? row.tags.split(',') : []
        })));
    } finally {
        connection.release();
    }
});


router.get('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT p.idProdotto, p.nome, p.prezzo, p.descrizione, p.disponibilita, GROUP_CONCAT(pt.tag) as tags, GROUP_CONCAT(pi.ingrediente) as ingredienti 
            FROM Prodotto p
            LEFT JOIN ProdottoIngrediente pi ON p.idProdotto = pi.idProdotto
            LEFT JOIN ProdottoTag pt ON p.idProdotto = pt.idProdotto
            WHERE p.idProdotto = ? AND p.attivo = true
            GROUP BY p.idProdotto, p.nome, p.prezzo, p.descrizione, p.disponibilita
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Prodoto non trovato' });
        }
        
        const row = rows[0];
        res.json({
            ...row,
            tags: row.tags ? row.tags.split(',') : [],
            ingredienti: row.ingredienti ? row.ingredienti.split(',') : []
        });
    } finally {
        connection.release();
    }
})

router.post('/', authenticateJWT, authorizeRole(['gestore', 'admin']), async (req, res) => {
    const { nome, prezzo, descrizione, tags, ingredienti, quantita} = req.body;
    if (!nome || !prezzo || !quantita || quantita < 0 || !descrizione || tags.length <= 0 || ingredienti.length <= 0) {
        return res.status(400).json({ error: 'inserire nome, descrizione, prezzo, quantita, tag e ingredienti' });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const [productResult] = await connection.execute(
            'INSERT INTO Prodotto (nome, prezzo, descrizione, proprietario, quantita) VALUES (?, ?, ?, ?, ?)',
            [nome, prezzo, descrizione, req.user.idGestione, quantita]
        );
        
        const productId = productResult.insertId;
        console.log(productId);
        
        
        if (tags && tags.length > 0) {
            const tagData = tags.map(tag => [productId, tag]);
            await connection.query(
                'INSERT INTO ProdottoTag (idProdotto, tag) VALUES ?',
                [tagData]
            );
        }

        if (ingredienti && ingredienti.length > 0) {
            const ingredientiData = ingredienti.map(ingrediente => [productId, ingrediente]);
            await connection.query(
                'INSERT INTO ProdottoIngrediente (idProdotto, ingrediente) VALUES ?',
                [ingredientiData]
            );
        }
        
        await connection.commit();
        res.status(201).json({ id: productId });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});


//TODO: route 4 delete


router.put('/:id', authenticateJWT, authorizeRole(['gestore', 'admin']), async (req, res) => {
    const { nome, prezzo, descrizione, tags, ingredienti } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [productResult] = await connection.execute(
            'UPDATE Prodotto SET nome = ?, prezzo = ?, descrizione = ? WHERE idProdotto = ? AND proprietario = ?',
            [nome, prezzo, descrizione, req.params.id, req.user.idGestione]
        );

        if (productResult.affectedRows === 0) {
            return res.status(404).json({ error: 'Prodotto non trovato o non tuo' });
        }


        if (tags && tags.length > 0) {
            await connection.execute(
                'DELETE FROM ProdottoTag WHERE idProdotto = ?',
                [req.params.id]
            );
            await connection.execute(
                'INSERT INTO ProdottoTag (idProdotto, tag) VALUES ?',
                [tags.map(tag => [req.params.id, tag])]
            );
        }


        if(ingredienti && ingredienti.length > 0) {
            await connection.execute(
                'DELETE FROM ProdottoIngrediente WHERE idProdotto = ?',
                [req.params.id]
            );
            await connection.execute(
                'INSERT INTO ProdottoIngrediente (idProdotto, ingrediente) VALUES ?',
                [ingredienti.map(ingrediente => [req.params.id, ingrediente])]
            );
        }

        
        await connection.commit();
        res.status(200).json({ message: 'Prodotto aggiunto con successo' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});



router.patch('/:id/setStatus', authenticateJWT, authorizeRole(['gestore', 'admin']), async (req, res) => {
    const { attivo } = req.body;
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.execute(
            'UPDATE Prodotto SET attivo = ? WHERE idProdotto = ? AND proprietario = ?',
            [attivo, req.params.id, req.user.idGestione]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Prodotto non trovato o non tuo' });
        }

        res.status(200).json({ message: 'Prodotto aggiunto con successo' });
    } finally {
        connection.release();
    }
});



module.exports = router;