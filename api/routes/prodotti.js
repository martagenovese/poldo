const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

// Configurazione Multer
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/tmp/');
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ];
        cb(null, allowedMimes.includes(file.mimetype));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Funzione per salvare/aggiornare l'immagine
async function handleProductImage(file, productId) {
    const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp'
    };
    
    const ext = mimeToExt[file.mimetype];
    const imagesDir = path.join(__dirname, '../public/images/products');
    
    // Elimina immagini esistenti
    const deletePromises = Object.values(mimeToExt).map(async (ext) => {
        const filePath = path.join(imagesDir, `${productId}${ext}`);
        try {
            await fs.unlink(filePath);
        } catch {}
    });

    await Promise.all(deletePromises);

    // Salva nuova immagine
    const targetPath = path.join(imagesDir, `${productId}${ext}`);
    await fs.rename(file.path, targetPath);
    
    return `/image/${productId}`;
}

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
  
    //console.log("Query:", bigQuery);

    try {
      const [rows] = await pool.execute(bigQuery, params);
      return rows;
    } catch (err) {
      console.error("Errore nell'esecuzione della query:", err);
      throw err;
    }
}

// Ottieni tutti i prodotti
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

// Ottieni tutti i prodotti per gestore o admin
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

// Ottieni un prodotto specifico
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

// Crea un nuovo prodotto
router.post('/', authenticateJWT, authorizeRole(['gestore', 'admin']), upload.single('image'), async (req, res) => {
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
        // Cleanup immagine se presente
        if(req.file) await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ error: 'Campi obbligatori: nome, descrizione, prezzo, quantita, tags e ingredienti' });
    }

    if(req.user.ruolo === 'admin' && !req.body.idGestione) {
        if(req.file) await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ error: 'Campo idGestione obbligatorio per admin' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Inserimento prodotto (rimane identico)
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
                temporaneo || false,
                disponibilita ?? 0,
                attivo ?? true
            ]
        );

        const productId = productResult.insertId;

        // Inserimento tags e ingredienti (rimane identico)
        await connection.query(
            'INSERT INTO ProdottoTag (idProdotto, tag) VALUES ?',
            [tags.map(tag => [productId, tag])]
        );

        await connection.query(
            'INSERT INTO ProdottoIngrediente (idProdotto, ingrediente) VALUES ?',
            [ingredienti.map(ingrediente => [productId, ingrediente])]
        );

        // Gestione immagine
        let imageUrl;
        if(req.file) {
            try {
                imageUrl = await handleProductImage(req.file, productId);
            } catch (error) {
                console.error('Errore salvataggio immagine:', error);
                await fs.unlink(req.file.path).catch(() => {});
                throw new Error('Salvataggio immagine fallito');
            }
        }

        await connection.commit();
        res.status(201).json({ 
            id: productId,
            ...(imageUrl && { image: imageUrl })
        });

    } catch (error) {
        await connection.rollback();
        if(req.file) await fs.unlink(req.file.path).catch(() => {});
        
        console.error("Errore inserimento prodotto:", error);
        
        if(error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Nome prodotto già esistente' });
        }
        if(error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ error: 'Gestione non trovata' });
        }
        if(error.message === 'Salvataggio immagine fallito') {
            return res.status(500).json({ error: 'Errore nel salvataggio dell\'immagine' });
        }
        
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});

// Elimina un prodotto
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

// Aggiorna un prodotto
router.patch('/:id', authenticateJWT, authorizeRole(['gestore', 'admin']), upload.single('image'), async (req, res) => {
    const { nome, prezzo, descrizione, tags, ingredienti, idGestione } = req.body;
    
    if(req.user.ruolo === 'admin') {
        if(!idGestione) {
            if(req.file) await fs.unlink(req.file.path).catch(() => {});
            return res.status(400).json({ error: 'Inserire idGestione' });
        }
        req.user.idGestione = idGestione;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const updateFields = [];
        const updateValues = [];
        
        if(nome !== undefined) {
            updateFields.push('nome = ?');
            updateValues.push(nome);
        }
        
        if(prezzo !== undefined) {
            updateFields.push('prezzo = ?');
            updateValues.push(prezzo);
        }
        
        if(descrizione !== undefined) {
            updateFields.push('descrizione = ?');
            updateValues.push(descrizione);
        }

        let productResult;
        if(updateFields.length > 0) {
            const query = `UPDATE Prodotto SET ${updateFields.join(', ')} WHERE idProdotto = ? AND proprietario = ?`;
            const params = [...updateValues, req.params.id, req.user.idGestione];
            [productResult] = await connection.execute(query, params);
            
            if(productResult.affectedRows === 0) {
                await connection.rollback();
                if(req.file) await fs.unlink(req.file.path).catch(() => {});
                return res.status(404).json({ error: 'Prodotto non trovato o non tuo' });
            }
        }

        // Update tags e ingredienti (rimane identico)
        if(tags !== undefined) {
            await connection.execute(
                'DELETE FROM ProdottoTag WHERE idProdotto = ?',
                [req.params.id]
            );
            
            if(tags.length > 0) {
                const tagData = tags.map(tag => [req.params.id, tag]);
                await connection.query(
                    'INSERT INTO ProdottoTag (idProdotto, tag) VALUES ?',
                    [tagData]
                );
            }
        }

        if(ingredienti !== undefined) {
            await connection.execute(
                'DELETE FROM ProdottoIngrediente WHERE idProdotto = ?',
                [req.params.id]
            );
            
            if(ingredienti.length > 0) {
                const ingredientiData = ingredienti.map(ing => [req.params.id, ing]);
                await connection.query(
                    'INSERT INTO ProdottoIngrediente (idProdotto, ingrediente) VALUES ?',
                    [ingredientiData]
                );
            }
        }

        // Gestione immagine
        let imageUrl;
        if(req.file) {
            try {
                imageUrl = await handleProductImage(req.file, req.params.id);
            } catch (error) {
                console.error('Errore aggiornamento immagine:', error);
                await fs.unlink(req.file.path).catch(() => {});
                throw new Error('Aggiornamento immagine fallito');
            }
        }

        await connection.commit();
        res.status(200).json({ 
            message: 'Prodotto modificato con successo',
            ...(imageUrl && { image: imageUrl })
        });

    } catch (error) {
        await connection.rollback();
        if(req.file) await fs.unlink(req.file.path).catch(() => {});
        
        console.error("Errore aggiornamento prodotto:", error);
        
        if(error.message === 'Aggiornamento immagine fallito') {
            return res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'immagine' });
        }
        
        res.status(500).json({ error: 'Errore interno del server' });
    } finally {
        connection.release();
    }
});

// Modifica lo stato di un prodotto
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

// Route immagini prodotti
router.get('/image/:id', authenticateJWT, async (req, res) => {
    try {
        const productId = req.params.id;
        const imagesDir = path.join(__dirname, '../public/images/products');
        const defaultImage = path.join(imagesDir, 'default.png');

        // Validazione ID
        if (isNaN(productId)) {
            return res.status(400).json({ error: 'ID prodotto non valido' });
        }

        // Gestione immagine default
        if (productId == -1) {
            try {
                await fs.access(defaultImage);
                return res.sendFile(defaultImage, {
                    headers: {
                        'Content-Type': 'image/png',
                        'Cache-Control': 'public, max-age=2592000'
                    }
                });
            } catch {
                return res.status(404).json({ error: 'Immagine default non trovata' });
            }
        }

        // Verifica esistenza prodotto
        const [result] = await pool.execute(
            'SELECT idProdotto FROM Prodotto WHERE idProdotto = ?',
            [productId]
        );

        if (result.length === 0) {
            return res.status(404).json({ error: 'Prodotto non trovato' });
        }

        const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        
        // Ricerca file immagine
        let imagePath;
        for (const ext of allowedExtensions) {
            const candidatePath = path.join(imagesDir, `${productId}${ext}`);
            try {
                await fs.access(candidatePath);
                imagePath = candidatePath;
                break;
            } catch {
                // Ignora e continua
            }
        }

        if (!imagePath) {
            return res.status(404).json({ error: 'Immagine non trovata' });
        }

        res.sendFile(imagePath, {
            headers: {
                'Content-Type': `image/${path.extname(imagePath).slice(1)}`,
                'Cache-Control': 'public, max-age=2592000'
            }
        });
        
    } catch (error) {
        next(error);
    }
});


module.exports = router;