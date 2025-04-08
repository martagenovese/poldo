const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/', authenticateJWT, authorizeRole(['gestore', 'admin']), async (req, res) => {
    const connection = await pool.getConnection();
    try {

        console.log('rows');

        const [rows] = await connection.execute(`
            SELECT 
                oc.classe,
                oc.nTurno,
                p.idProdotto,
                p.nome AS prodottoNome,
                p.prezzo,
                SUM(dos.quantita) AS quantitaTotale,
                GROUP_CONCAT(DISTINCT t.nome) AS tags
            FROM OrdineClasse oc
            JOIN OrdineSingolo os ON oc.idOrdine = os.idOrdineClasse
            JOIN DettagliOrdineSingolo dos ON os.idOrdine = dos.idOrdineSingolo
            JOIN Prodotto p ON dos.idProdotto = p.idProdotto
            LEFT JOIN ProdottoTag pt ON p.idProdotto = pt.idProdotto
            LEFT JOIN Tag t ON pt.tag = t.nome
            GROUP BY oc.classe, oc.nTurno, p.idProdotto
            ORDER BY oc.classe, oc.nTurno
        `);

        console.log(rows);

        // Raggruppa i risultati per classe e turno
        const groupedOrders = rows.reduce((acc, row) => {
            const key = `${row.classe}-${row.nTurno}`;
            
            if (!acc[key]) {
                acc[key] = {
                    classe: row.classe,
                    nTurno: row.nTurno,
                    prodotti: []
                };
            }
            
            acc[key].prodotti.push({
                idProdotto: row.idProdotto,
                nome: row.prodottoNome,
                prezzo: row.prezzo,
                quantita: row.quantitaTotale,
                tags: row.tags ? row.tags.split(',') : []
            });

            return acc;
        }, {});

        res.json(Object.values(groupedOrders));
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        connection.release();
    }
});

router.post('/', 
    authenticateJWT, 
    authorizeRole(['studente', 'prof', 'segreteria']), 
    async (req, res) => {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            const userId = req.user.idUtente;
            const userRole = req.user.ruolo;
            const { prodotti, idOrdineClasse, nTurno, giorno } = req.body;
            const today = new Date().toISOString().split('T')[0];
            
            // Validazione di base
            if (!prodotti || !Array.isArray(prodotti)) {
                await connection.rollback();
                return res.status(400).json({ error: 'Prodotti mancanti o non validi' });
            }

            let idClasseOrder;

            if (userRole === 'studente') {
                // Caso studente - ordine normale
                if (!idOrdineClasse) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'ID ordine classe richiesto' });
                }

                // Verifica ordine classe esistente e valido
                const [classeOrder] = await connection.query(`
                    SELECT oc.* 
                    FROM OrdineClasse oc
                    JOIN Utente u ON oc.classe = u.classe
                    WHERE oc.idOrdine = ? 
                    AND u.idUtente = ?
                    AND oc.data = ?
                `, [idOrdineClasse, userId, today]);

                if (!classeOrder.length) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Ordine classe non valido' });
                }

                idClasseOrder = idOrdineClasse;

            } else {
                // Caso prof/segreteria - ordine EXT
                if (!nTurno || !giorno) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Turno e giorno richiesti' });
                }

                // Cerca/Crea ordine classe EXT
                const [extOrder] = await connection.query(`
                    SELECT idOrdine 
                    FROM OrdineClasse 
                    WHERE classe = 'EXT' 
                    AND idResponsabile = ?
                    AND nTurno = ?
                    AND giorno = ?
                    AND data = ?
                `, [userId, nTurno, giorno, today]);

                if (extOrder.length > 0) {
                    idClasseOrder = extOrder[0].idOrdine;
                } else {
                    // Crea nuovo ordine EXT
                    const [newOrder] = await connection.query(`
                        INSERT INTO OrdineClasse 
                        (idResponsabile, data, nTurno, giorno, oraRitiro, classe, confermato)
                        VALUES (?, ?, ?, ?, '12:00:00', 'EXT', TRUE)
                    `, [userId, today, nTurno, giorno]);
                    
                    idClasseOrder = newOrder.insertId;
                }
            }

            // Crea ordine singolo
            const [ordineSingolo] = await connection.query(`
                INSERT INTO OrdineSingolo 
                (data, nTurno, giorno, user, idOrdineClasse)
                VALUES (?, ?, ?, ?, ?)
            `, [today, nTurno || 0, giorno || 'EXT', userId, idClasseOrder]);

            // Aggiungi prodotti
            for (const prodotto of prodotti) {
                // Verifica prodotto attivo
                const [prod] = await connection.query(`
                    SELECT idProdotto 
                    FROM Prodotto 
                    WHERE idProdotto = ? 
                    AND attivo = TRUE
                `, [prodotto.idProdotto]);

                if (!prod.length) {
                    await connection.rollback();
                    return res.status(400).json({ error: `Prodotto ${prodotto.idProdotto} non disponibile` });
                }

                await connection.query(`
                    INSERT INTO DettagliOrdineSingolo 
                    (idOrdineSingolo, idProdotto, quantita)
                    VALUES (?, ?, ?)
                `, [ordineSingolo.insertId, prodotto.idProdotto, prodotto.quantita]);
            }

            await connection.commit();
            res.status(201).json({ 
                idOrdine: ordineSingolo.insertId,
                tipo: userRole === 'studente' ? 'classe' : 'ext'
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error:', error);
            res.status(500).json({ error: 'Database error' });
        } finally {
            connection.release();
        }
    }
);

router.get('/utente/:idUtente', 
    authenticateJWT, 
    authorizeRole(['admin', 'paninaro', 'studente', 'prof', 'segreteria']), 
    async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { idUtente } = req.params;

            // Ottieni tutti gli ordini singoli dell'utente
            const [ordini] = await connection.execute(`
                SELECT 
                    os.idOrdine,
                    os.data,
                    os.nTurno,
                    os.giorno,
                    oc.classe,
                    oc.oraRitiro,
                    GROUP_CONCAT(DISTINCT p.nome) AS prodotti
                FROM OrdineSingolo os
                LEFT JOIN OrdineClasse oc ON os.idOrdineClasse = oc.idOrdine
                JOIN DettagliOrdineSingolo dos ON os.idOrdine = dos.idOrdineSingolo
                JOIN Prodotto p ON dos.idProdotto = p.idProdotto
                WHERE os.user = ?
                GROUP BY os.idOrdine
                ORDER BY os.data DESC
            `, [idUtente]);

            if (ordini.length === 0) {
                return res.status(404).json({ error: 'Nessun ordine trovato per questo utente' });
            }

            // Ottieni i dettagli completi per ogni ordine
            const ordiniConDettagli = await Promise.all(ordini.map(async (ordine) => {
                const [dettagli] = await connection.execute(`
                    SELECT 
                        dos.idProdotto,
                        p.nome AS prodotto,
                        p.prezzo,
                        SUM(dos.quantita) AS quantita,
                        GROUP_CONCAT(DISTINCT t.nome) AS tags
                    FROM DettagliOrdineSingolo dos
                    JOIN Prodotto p ON dos.idProdotto = p.idProdotto
                    LEFT JOIN ProdottoTag pt ON p.idProdotto = pt.idProdotto
                    LEFT JOIN Tag t ON pt.tag = t.nome
                    WHERE dos.idOrdineSingolo = ?
                    GROUP BY dos.idProdotto, p.nome, p.prezzo
                `, [ordine.idOrdine]);

                return {
                    ...ordine,
                    prodotti: dettagli.map(d => ({
                        ...d,
                        tags: d.tags ? d.tags.split(',') : []
                    }))
                };
            }));

            res.json(ordiniConDettagli);

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Database error' });
        } finally {
            connection.release();
        }
    }
);

// Check paninaro appartiene a una classe
router.get('/classe/:classe', 
    authenticateJWT, 
    authorizeRole(['gestore', 'admin', 'paninaro']), 
    async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { classe } = req.params;

            const [rows] = await connection.execute(`
                SELECT 
                    oc.nTurno,
                    p.idProdotto,
                    p.nome AS prodottoNome,
                    p.prezzo,
                    SUM(dos.quantita) AS quantitaTotale,
                    GROUP_CONCAT(DISTINCT t.nome) AS tags
                FROM OrdineClasse oc
                JOIN OrdineSingolo os ON oc.idOrdine = os.idOrdineClasse
                JOIN DettagliOrdineSingolo dos ON os.idOrdine = dos.idOrdineSingolo
                JOIN Prodotto p ON dos.idProdotto = p.idProdotto
                LEFT JOIN ProdottoTag pt ON p.idProdotto = pt.idProdotto
                LEFT JOIN Tag t ON pt.tag = t.nome
                WHERE oc.classe = ?
                GROUP BY oc.nTurno, p.idProdotto
                ORDER BY oc.nTurno
            `, [classe]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Nessun ordine trovato per questa classe' });
            }

            // Raggruppa per turno
            const groupedOrders = rows.reduce((acc, row) => {
                const turno = row.nTurno;
                
                if (!acc[turno]) {
                    acc[turno] = {
                        classe: classe,
                        nTurno: turno,
                        prodotti: []
                    };
                }
                
                acc[turno].prodotti.push({
                    idProdotto: row.idProdotto,
                    nome: row.prodottoNome,
                    prezzo: row.prezzo,
                    quantita: row.quantitaTotale,
                    tags: row.tags ? row.tags.split(',') : []
                });

                return acc;
            }, {});

            res.json(Object.values(groupedOrders));
            
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Database error' });
        } finally {
            connection.release();
        }
    }
);

router.get('/:idOrdine', 
    authenticateJWT, 
    authorizeRole(['gestore', 'admin', 'paninaro']), 
    async (req, res) => {
        const { idOrdine } = req.params;
        const connection = await pool.getConnection();
        
        try {
            // Cerca prima negli ordini singoli (studenti)
            let [order] = await connection.execute(`
                SELECT 
                    os.*, 
                    oc.classe,
                    oc.oraRitiro,
                    u.mail AS userEmail,
                    u.ruolo AS userRole
                FROM OrdineSingolo os
                LEFT JOIN OrdineClasse oc ON os.idOrdineClasse = oc.idOrdine
                JOIN Utente u ON os.user = u.idUtente
                WHERE os.idOrdine = ?
            `, [idOrdine]);

            if (order.length > 0) {
                // Caso ordine studente
                const [details] = await connection.execute(`
                    SELECT 
                        dos.*, 
                        p.nome AS prodottoNome,
                        p.prezzo,
                        GROUP_CONCAT(DISTINCT t.nome) AS tags
                    FROM DettagliOrdineSingolo dos
                    JOIN Prodotto p ON dos.idProdotto = p.idProdotto
                    LEFT JOIN ProdottoTag pt ON p.idProdotto = pt.idProdotto
                    LEFT JOIN Tag t ON pt.tag = t.nome
                    WHERE dos.idOrdineSingolo = ?
                    GROUP BY dos.id
                `, [idOrdine]);

                return res.json({
                    ...order[0],
                    tipo: 'singolo',
                    dettagli: details.map(d => ({
                        ...d,
                        tags: d.tags ? d.tags.split(',') : []
                    }))
                });
            }

            // Cerca negli ordini classe (professori/segreteria)
            [order] = await connection.execute(`
                SELECT 
                    oc.*,
                    u.mail AS responsabileEmail
                FROM OrdineClasse oc
                JOIN Utente u ON oc.idResponsabile = u.idUtente
                WHERE oc.idOrdine = ? 
                AND oc.classe = 'EXT'
            `, [idOrdine]);

            if (order.length > 0) {
                // Caso ordine prof/segreteria
                const [prodotti] = await connection.execute(`
                    SELECT 
                        p.idProdotto,
                        p.nome,
                        p.prezzo,
                        SUM(dos.quantita) AS quantita,
                        GROUP_CONCAT(DISTINCT t.nome) AS tags
                    FROM OrdineSingolo os
                    JOIN DettagliOrdineSingolo dos ON os.idOrdine = dos.idOrdineSingolo
                    JOIN Prodotto p ON dos.idProdotto = p.idProdotto
                    LEFT JOIN ProdottoTag pt ON p.idProdotto = pt.idProdotto
                    LEFT JOIN Tag t ON pt.tag = t.nome
                    WHERE os.idOrdineClasse = ?
                    GROUP BY p.idProdotto
                `, [idOrdine]);

                return res.json({
                    ...order[0],
                    tipo: 'classe',
                    prodotti: prodotti.map(p => ({
                        ...p,
                        tags: p.tags ? p.tags.split(',') : []
                    }))
                });
            }

            res.status(404).json({ error: 'Ordine non trovato' });

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Database error' });
        } finally {
            connection.release();
        }
    }
);

module.exports = router;