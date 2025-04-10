const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

function createQuery(filters) {
    let query = "SELECT p.* FROM Prodotto p";
    let conditions = [];
    let params = [];
  
    // ingredienti
    if (filters.ingredienti && Array.isArray(filters.ingredienti) && filters.ingredienti.length > 0) {
      const placeholders = filters.ingredienti.map(() => '?').join(',');
      conditions.push(`(
        SELECT COUNT(DISTINCT ingrediente)
        FROM ProdottoIngrediente
        WHERE idProdotto = p.idProdotto AND ingrediente IN (${placeholders})
      ) = ?`);
      params.push(...filters.ingredienti, filters.ingredienti.length);
    }
  
    // nonIngredienti
    if (filters.nonIngredienti && Array.isArray(filters.nonIngredienti) && filters.nonIngredienti.length > 0) {
      const placeholders = filters.nonIngredienti.map(() => '?').join(',');
      conditions.push(`NOT EXISTS (
        SELECT 1 FROM ProdottoIngrediente 
        WHERE idProdotto = p.idProdotto AND ingrediente IN (${placeholders})
      )`);
      params.push(...filters.nonIngredienti);
    }
  
    // tag
    if (filters.tag && Array.isArray(filters.tag) && filters.tag.length > 0) {
      const placeholders = filters.tag.map(() => '?').join(',');
      conditions.push(`(
        SELECT COUNT(DISTINCT tag)
        FROM ProdottoTag
        WHERE idProdotto = p.idProdotto AND tag IN (${placeholders})
      ) = ?`);
      params.push(...filters.tag, filters.tag.length);
    }
  
    // nonTag
    if (filters.nonTag && Array.isArray(filters.nonTag) && filters.nonTag.length > 0) {
      const placeholders = filters.nonTag.map(() => '?').join(',');
      conditions.push(`NOT EXISTS (
        SELECT 1 FROM ProdottoTag 
        WHERE idProdotto = p.idProdotto AND tag IN (${placeholders})
      )`);
      params.push(...filters.nonTag);
    }
  
    // proprietario
    if (typeof filters.proprietario !== 'undefined') {
      conditions.push('p.proprietario = ?');
      params.push(filters.proprietario);
    }
  
    // prezzoMin
    if (typeof filters.prezzoMin !== 'undefined') {
      conditions.push('p.prezzo >= ?');
      params.push(filters.prezzoMin);
    }
  
    // prezzoMax
    if (typeof filters.prezzoMax !== 'undefined') {
      conditions.push('p.prezzo <= ?');
      params.push(filters.prezzoMax);
    }
  
    // temporaneo
    if (typeof filters.temporaneo !== 'undefined') {
      conditions.push('p.temporaneo = ?');
      params.push(filters.temporaneo);
    }
  
    // disponibilita
    if (typeof filters.disponibilita !== 'undefined') {
      conditions.push('p.disponibilita > ?');
      params.push(filters.disponibilita);
    }
  
    // attivo
    if (typeof filters.attivo !== 'undefined') {
      conditions.push('p.attivo = ?');
      params.push(filters.attivo);
    }
  
    // eliminato
    if (typeof filters.eliminato !== 'undefined') {
      conditions.push('p.eliminato = ?');
      params.push(filters.eliminato);
    }
  
    // where
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
  
    let orderBy;

    // orderby
    if (filters.orderby) {
      const allowOrders = ['nome', 'prezzo', 'quantita', 'disponibilita', 'lastUpdate'];
      if (allowOrders.includes(filters.orderby)) {
        const direction = (filters.orderDirection && filters.orderDirection.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';
        orderBy = ` ORDER BY p.${filters.orderby} ${direction}`;
      }
    }
  
    return { query, params, orderBy};
}
  

async function filterProducts(filters) {
    const { query: subQuery, params, orderBy} = createQuery(filters);
  
    const bigQuery = `
      SELECT sub.*, 
             ing.ingredienti,
             t.tags
      FROM (
        ${subQuery}
      ) AS sub
      LEFT JOIN (
        SELECT idProdotto, GROUP_CONCAT(DISTINCT ingrediente) AS ingredienti 
        FROM ProdottoIngrediente
        GROUP BY idProdotto
      ) AS ing ON ing.idProdotto = sub.idProdotto
      LEFT JOIN (
        SELECT idProdotto, GROUP_CONCAT(DISTINCT tag) AS tags
        FROM ProdottoTag
        GROUP BY idProdotto
      ) AS t ON t.idProdotto = sub.idProdotto
       ${orderBy}
    `;
  
    console.log("Query:", bigQuery);

    try {
      const [rows] = await pool.execute(bigQuery, params);
      return rows;
    } catch (err) {
      console.error("Errore nell'esecuzione della query:", err);
      throw err;
    }
}



router.get('/', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { ingredienti, nonIngredienti, tag, nonTag, proprietario, prezzoMin, prezzoMax, disponibilita,orderBy, orderDirection } = req.query;

        const filters = {
            ingredienti: ingredienti ? ingredienti.split(',') : [],
            nonIngredienti: nonIngredienti ? nonIngredienti.split(',') : [],
            tag: tag ? tag.split(',') : [],
            nonTag: nonTag ? nonTag.split(',') : [],
            proprietario: proprietario || undefined,
            prezzoMin: prezzoMin || undefined,
            prezzoMax: prezzoMax || undefined,
            temporaneo: undefined,
            disponibilita: disponibilita || 1,
            attivo: true,
            eliminato: false,
            orderby: orderBy || 'nome',
            orderDirection: orderDirection || 'ASC'
        }

        const rows = await filterProducts(filters);
        
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
        const { ingredienti, nonIngredienti, tag, nonTag, prezzoMin, prezzoMax, temporaneo, disponibilita, attivo, orderBy, orderDirection } = req.query;

        const proprietario = req.user.ruolo === 'gestore' ? req.user.idGestione : req.query.proprietario;



        const filters = {
            ingredienti: ingredienti ? ingredienti.split(',') : [],
            nonIngredienti: nonIngredienti ? nonIngredienti.split(',') : [],
            tag: tag ? tag.split(',') : [],
            nonTag: nonTag ? nonTag.split(',') : [],
            proprietario: proprietario || undefined,
            prezzoMin: prezzoMin || undefined,
            prezzoMax: prezzoMax || undefined,
            temporaneo: temporaneo || undefined,
            disponibilita: disponibilita || 1,
            attivo: attivo || undefined,
            eliminato: false,
            orderby: orderBy || 'nome',
            orderDirection: orderDirection || 'ASC'
        }

        const rows = await filterProducts(filters);


        if( rows.length === 0) {
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

router.get('/:id', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const selectFields = ['admin', 'gestore'].includes(req.user.ruolo) ?
        `p.idProdotto, p.nome, p.prezzo, p.descrizione, p.disponibilita, p.temporaneo, p.attivo, p.proprietario` :
        `p.idProdotto, p.nome, p.prezzo, p.descrizione, p.disponibilita`;

        let params = [req.params.id];

        let query = `SELECT ${selectFields}
                    FROM Prodotto p
                    WHERE p.idProdotto = ?  AND p.eliminato = 0`

        if(req.user.ruolo === 'gestore') {
            query += ` AND p.proprietario = ?`
            params.push(req.user.idGestione);
        }

        if(['paninaro', 'studente', 'prof'].includes(req.user.ruolo)) {
            query += ` AND p.attivo = 1`
        }

        const groupBy = ` GROUP BY ${selectFields}`;


        const [rows] = await connection.execute(query + groupBy, params);
        
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