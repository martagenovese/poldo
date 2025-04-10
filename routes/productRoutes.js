const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');


//TODO: da fixare la query per piu tag e piu ingredienti
// ora va solo con 1 tag e 1 ingrediente
async function getProducts(ingredienti, tags, proprietario, prezzoMin, prezzoMax, temporaneo, disponibilita, attivo, 
    orderBy, orderDirection, all = false, eliminato = false) {
        console.log(all);

    const connection = await pool.getConnection();
    try {

        //per ora forza ad uno solo
        const tagList = tags ? [tags.split(',')[0]] : [];
        const ingredientiList = ingredienti ? [ingredienti.split(',')[0]] : [];

        console.log("Tag list:", tagList);
        console.log("Ingredienti list:", ingredientiList);

        // Subquery
        let subQuery = `
            SELECT p1.idProdotto 
            FROM Prodotto p1
            LEFT JOIN ProdottoTag pt1 ON p1.idProdotto = pt1.idProdotto
            LEFT JOIN ProdottoIngrediente pi1 ON p1.idProdotto = pi1.idProdotto
            where 1=1
        `;

        const params = [];
        const havingConditions = [];

        // WHERE
        if (proprietario) {
            subQuery += ' AND p1.proprietario = ?';
            params.push(proprietario);
        }

        if (prezzoMin || prezzoMax) {
            const min = prezzoMin || 0;
            const max = prezzoMax || Number.MAX_SAFE_INTEGER;
            subQuery += ' AND p1.prezzo BETWEEN ? AND ?';
            params.push(min, max);
        }

        if (temporaneo !== undefined) {
            subQuery += ' AND p1.temporaneo = ?';
            params.push(temporaneo === 'true');
        }

        if (disponibilita !== undefined) {
            subQuery += ' AND p1.disponibilita >= ?';
            params.push(disponibilita);
        }

        if (attivo !== undefined) {
            subQuery += ' AND p1.attivo = ?';
            params.push(attivo === 'true');
        }

        // Gestione TAG
        if (tagList.length > 0) {
            subQuery += ` AND pt1.tag IN (${tagList.map(() => '?').join(',')})`;
            params.push(...tagList);
            havingConditions.push('COUNT(DISTINCT pt1.tag) > ?');
            params.push(tagList.length); // Deve avere TUTTI i tag specificati
        }

        // Gestione INGREDIENTI
        if (ingredientiList.length > 0) {
            subQuery += ` AND pi1.ingrediente IN (${ingredientiList.map(() => '?').join(',')})`;
            params.push(...ingredientiList);
            havingConditions.push('COUNT(DISTINCT pi1.ingrediente) > ?');
            params.push(ingredientiList.length); // Deve avere TUTTI gli ingredienti
        }

        // Completa la subquery
        subQuery += ' GROUP BY p1.idProdotto';
        if (havingConditions.length > 0) {
            subQuery += ` HAVING ${havingConditions.join(' AND ')}`;
        }

        // Query
        const selectFields = all === false ? 
            `p.idProdotto, p.nome, p.prezzo, p.descrizione, p.disponibilita` :
            `p.idProdotto, p.nome, p.prezzo, p.descrizione, p.disponibilita, p.temporaneo, p.attivo, p.proprietario, p.eliminato, p.quantita`;

        let mainQuery = `
            SELECT 
                ${selectFields},
                GROUP_CONCAT(DISTINCT pt.tag) as tags,
                GROUP_CONCAT(DISTINCT pi.ingrediente) as ingredienti
            FROM Prodotto p
            LEFT JOIN ProdottoTag pt ON p.idProdotto = pt.idProdotto
            LEFT JOIN ProdottoIngrediente pi ON p.idProdotto = pi.idProdotto
            WHERE p.idProdotto IN (${subQuery})
        `;

        if(eliminato === false){
            mainQuery += ' AND p.eliminato = 0 ';
        }

        // Quert Group by
        mainQuery += `GROUP BY p.idProdotto, ${selectFields}`;

        // Ordinamento
        const validOrderFields = ['nome', 'prezzo'];
        const orderField = validOrderFields.includes(orderBy) ? orderBy : 'nome';
        const direction = orderDirection?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        mainQuery += ` ORDER BY ${orderField} ${direction}`;


        console.log("Query:", mainQuery);
        console.log("Params:", params);

        const [rows] = await connection.execute(mainQuery, params);
        
        return rows;

    } catch (error) {
        console.error("Errore recupero prodotti:", error);
        throw new Error('Errore durante il recupero dei prodotti');
    } finally {
        connection.release();
    }
}


router.get('/', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { ingredienti, tags, idGestione, prezzoMin, prezzoMax, orderBy, orderDirection } = req.query;

        //const [rows] = await getProducts(null, tags, idGestione, prezzoMin, prezzoMax, null, null, null, orderBy, orderDirection);
        const rows = await getProducts(ingredienti, tags, undefined, prezzoMin, prezzoMax, undefined, undefined, undefined, orderBy, orderDirection, false, false);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Nessun prodotto trovato' });
        }

        res.json(rows.map(row => ({
            ...row,
            tags: row.tags ? [...new Set(row.tags.split(','))] : [],
            ingredienti: row.ingredienti ? [...new Set(row.ingredienti.split(','))] : []
        })));
    } catch (error) {
        console.error("Errore recupero prodotti: " + error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
    finally {
        connection.release();
    }
});


router.get('/all', authenticateJWT, authorizeRole(['gestore', 'admin']), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { 
            ingredienti, 
            tags, 
            proprietario, 
            prezzoMin, 
            prezzoMax, 
            temporaneo, 
            disponibilita, 
            attivo,
            orderBy,
            orderDirection
        } = req.query;

        const rows = await getProducts(ingredienti, tags, proprietario, prezzoMin, prezzoMax, temporaneo, disponibilita, attivo, orderBy, orderDirection, true, true);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Nessun prodotto trovato' });
        }

        res.json(rows.map(row => ({
            ...row,
            tags: row.tags ? [...new Set(row.tags.split(','))] : [],
            ingredienti: row.ingredienti ? [...new Set(row.ingredienti.split(','))] : []
        })));

    } catch (error) {
        console.error("Errore recupero prodotti: " + error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});


router.get('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT p.idProdotto, p.nome, p.prezzo, p.descrizione, p.disponibilita
            FROM Prodotto p
            WHERE p.idProdotto = ?
            GROUP BY p.idProdotto, p.nome, p.prezzo, p.descrizione, p.disponibilita
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Prodoto non trovato' });
        }
        
        const [tags] = await connection.execute(`
            SELECT tag 
            FROM ProdottoTag pt
            WHERE pt.idProdotto = ?`, [req.params.id]);
        
        const [ingredienti] = await connection.execute(`
            SELECT ingrediente
            FROM ProdottoIngrediente pi
            WHERE pi.idProdotto = ?`, [req.params.id]);

        const row = rows[0];
        res.json({
            ...row,
            tags: tags.length>0 ? tags.map(tag => tag.tag) : [],
            ingredienti: ingredienti.length>0 ? ingredienti.map(ingrediente => ingrediente.ingrediente) : [],
        });

    } finally {
        connection.release();
    }
})


router.post('/', authenticateJWT, authorizeRole(['gestore', 'admin']), async (req, res) => {
    const { 
        nome, 
        prezzo, 
        descrizione, 
        tags, 
        ingredienti, 
        quantita,
        temporaneo,
        disponibilita,
        attivo
    } = req.body;

    if (!nome || !prezzo || !quantita || quantita < 0 || !descrizione || !tags?.length || !ingredienti?.length) {
        return res.status(400).json({ error: 'Campi obbligatori: nome, descrizione, prezzo, quantita, tags e ingredienti' });
    }

    // Gestione idGestione per admin
    if(req.user.ruolo === 'admin') {
        if(!req.body.idGestione) {
            return res.status(400).json({ error: 'Campo idGestione obbligatorio per admin' });
        }
        req.user.idGestione = req.body.idGestione;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [productResult] = await connection.execute(
            `INSERT INTO Prodotto (
                nome, 
                prezzo, 
                descrizione, 
                proprietario, 
                quantita,
                temporaneo,
                disponibilita,
                attivo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome,
                prezzo,
                descrizione,
                req.user.idGestione,
                quantita,
                temporaneo || false, // Default 
                disponibilita !== undefined ? disponibilita : 0, // Default
                attivo !== undefined ? attivo : true // Default
            ]
        );

        const productId = productResult.insertId;

        // Tags
        await connection.query(
            'INSERT INTO ProdottoTag (idProdotto, tag) VALUES ?',
            [tags.map(tag => [productId, tag])]
        );

        // Ingredienti
        await connection.query(
            'INSERT INTO ProdottoIngrediente (idProdotto, ingrediente) VALUES ?',
            [ingredienti.map(ingrediente => [productId, ingrediente])]
        );

        await connection.commit();
        res.status(201).json({ 
            id: productId
        });

    } catch (error) {
        await connection.rollback();
        console.error("Errore inserimento prodotto:", error);

        if(error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Nome prodotto già esistente' });
        }
        if(error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ error: 'Gestione non trovata' });
        }
        if(error.code === 'ER_BAD_NULL_ERROR') {
            return res.status(400).json({ error: 'Valori non validi per i campi obbligatori' });
        }
        
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});


router.delete('/:id', authenticateJWT, authorizeRole(['gestore', 'admin']), async (req, res) => {
    const connection = await pool.getConnection();

    if(req.user.ruolo === 'admin'){
        const {idGestione} = req.body;
        if(!idGestione){
            return res.status(400).json({ error: 'Inserire idGestione' });
        }
        req.user.idGestione = idGestione;
    }

    try {
        await connection.beginTransaction();

        const [result] = await connection.execute(
            'UPDATE Prodotto SET eliminato = 1 WHERE idProdotto = ? AND proprietario = ?',
            [req.params.id, req.user.idGestione]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Prodotto non trovato o non tuo' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Prodotto eliminato con successo' });
    }
    catch (error) {
        await connection.rollback();
        console.error("Errore eliminazione prodotto:", error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
    finally {
        connection.release();
    }
})


router.put('/:id', authenticateJWT, authorizeRole(['gestore', 'admin']), async (req, res) => {
    const { nome, prezzo, descrizione, tags, ingredienti } = req.body;
    
    if(!nome || !prezzo || !descrizione || tags.length <= 0 || ingredienti.length <= 0) {
        return res.status(400).json({ error: 'Inserire nome, descrizione, prezzo, tag e ingredienti' });
    }
    
    if(req.user.ruolo === 'admin'){
        const {idGestione} = req.body;
        if(!idGestione){
            return res.status(400).json({ error: 'Inserire idGestione' });
        }
        req.user.idGestione = idGestione;
    }

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
            const tagData = tags.map(tag => [req.params.id, tag]);
            await connection.query(
                'INSERT INTO ProdottoTag (idProdotto, tag) VALUES ?',
                [tagData]
            );
        }


        if(ingredienti && ingredienti.length > 0) {
            await connection.execute(
                'DELETE FROM ProdottoIngrediente WHERE idProdotto = ?',
                [req.params.id]
            );
            const ingredientiData = ingredienti.map(ingrediente => [req.params.id, ingrediente]);
            await connection.query(
                'INSERT INTO ProdottoIngrediente (idProdotto, ingrediente) VALUES ?',
                [ingredientiData]
            );
        }

        
        await connection.commit();
        res.status(200).json({ message: 'Prodotto modificato con successo' });
    } catch (error) {
        await connection.rollback();
        console.log("Errore aggiornamento prodotto: " + error);
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});


router.patch('/:id/setStatus', authenticateJWT, authorizeRole(['gestore', 'admin']), async (req, res) => {
    const { attivo } = req.body;

    if(req.user.ruolo === 'admin'){
        const {idGestione} = req.body;
        if(!idGestione){
            return res.status(400).json({ error: 'Inserire idGestione' });
        }
        req.user.idGestione = idGestione;
    }

    const connection = await pool.getConnection();
    try {
        const [result] = await connection.execute(
            'UPDATE Prodotto SET attivo = ? WHERE idProdotto = ? AND proprietario = ?',
            [attivo, req.params.id, req.user.idGestione]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Prodotto non trovato o non tuo' });
        }

        res.status(200).json({ message: 'Prodotto modificato con successo' });
    } catch (error) {
        console.error("Errore aggiornamento stato prodotto: " + error);
        res.status(500).json({ error: 'Errore interno del server' });
    }finally {
        connection.release();
    }
});



module.exports = router;