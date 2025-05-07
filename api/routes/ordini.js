const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

// Funzione di supporto per analizzare JSON in modo sicuro
const parseJSON = (data) => {
    try {
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

// Funzione di supporto per formattare la data come yyyy-mm-dd
const formatDate = (date) => {
    return new Date(date).toISOString().slice(0, 10);
};

// Ottieni tutti gli ordini individuali
router.get('/',
    authenticateJWT,
    authorizeRole(['admin']),
    async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { startDate, endDate, nTurno, user, confermato, preparato } = req.query;

            let query = `
                SELECT
                    os.idOrdine,
                    os.data,
                    os.nTurno,
                    os.giorno,
                    os.user,
                    oc.classe,
                    oc.confermato,
                    oc.preparato,
                    oc.oraRitiro,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'idProdotto', p.idProdotto,
                            'nome', p.nome,
                            'quantita', dos.quantita,
                            'prezzo', p.prezzo
                        )
                    ) AS prodotti
                FROM OrdineSingolo os
                LEFT JOIN OrdineClasse oc ON os.idOrdineClasse = oc.idOrdine
                LEFT JOIN DettagliOrdineSingolo dos ON os.idOrdine = dos.idOrdineSingolo
                LEFT JOIN Prodotto p ON dos.idProdotto = p.idProdotto
                WHERE 1=1
            `;

            const params = [];

            if (startDate && endDate) {
                query += ` AND os.data BETWEEN ? AND ?`;
                params.push(startDate, endDate);
            } else if (!startDate && !endDate) {
                query += ` AND os.data = CURDATE()`;
            }

            if (nTurno) {
                query += ` AND os.nTurno = ?`;
                params.push(nTurno);
            }

            if (user) {
                query += ` AND os.user = ?`;
                params.push(user);
            }

            if (confermato === '0' || confermato === '1') {
                query += ` AND oc.confermato = ?`;
                params.push(Number(confermato));
            }

            if (preparato === '0' || preparato === '1') {
                query += ` AND oc.preparato = ?`;
                params.push(Number(preparato));
            }
          
            query += ` GROUP BY os.idOrdine ORDER BY os.data DESC, os.idOrdine DESC`;

            const [orders] = await connection.execute(query, params);

            const result = orders.map(order => ({
                ...order,
                data: formatDate(order.data),
                prodotti: order.prodotti
            }));

            res.json(result);

        } catch (error) {
            console.error('Errore nel recupero ordini:', error);
            res.status(500).json({ error: 'Errore del database' });
        } finally {
            connection.release();
        }
    }
);

// Ottieni tutti gli ordini raggruppati per classe
router.get('/classi',
    authenticateJWT,
    authorizeRole(['admin', 'gestore']),
    async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { startDate, endDate, nTurno, confermato, preparato } = req.query;
            const userRole = req.user.ruolo;
            let classeFilter = '';

            if (userRole === 'paninaro') {
                const [classe] = await connection.query(
                    'SELECT classe FROM Utente WHERE idUtente = ?',
                    [req.user.id]
                );
                if (!classe[0]?.classe) return res.status(403).json({ error: 'Nessuna classe assegnata' });
                classeFilter = `AND oc.classe = ${classe[0].classe}`;
            }

            let query = `
                SELECT
                    c.nome AS classe,
                    oc.data,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'idProdotto', p.idProdotto,
                            'nome', p.nome,
                            'quantita', dos.totalQuantita,
                            'prezzo', p.prezzo
                        )
                    ) AS prodotti
                FROM OrdineClasse oc
                JOIN Classe c ON oc.classe = c.id
                JOIN (
                    SELECT os.idOrdineClasse, dos.idProdotto, SUM(dos.quantita) AS totalQuantita
                    FROM OrdineSingolo os
                    JOIN DettagliOrdineSingolo dos ON os.idOrdine = dos.idOrdineSingolo
                    GROUP BY os.idOrdineClasse, dos.idProdotto
                ) dos ON oc.idOrdine = dos.idOrdineClasse
                JOIN Prodotto p ON dos.idProdotto = p.idProdotto
                WHERE 1=1
                ${classeFilter}
            `;

            const params = [];

            if (startDate && endDate) {
                query += ` AND oc.data BETWEEN ? AND ?`;
                params.push(startDate, endDate);
            } else if (!startDate && !endDate) {
                query += ` AND oc.data = CURDATE()`;
            }

            if (nTurno) {
                query += ` AND oc.nTurno = ?`;
                params.push(nTurno);
            }

            if (confermato === '0' || confermato === '1') {
                query += ` AND oc.confermato = ?`;
                params.push(Number(confermato));
            }

            if (preparato === '0' || preparato === '1') {
                query += ` AND oc.preparato = ?`;
                params.push(Number(preparato));
            }

            query += ` GROUP BY c.nome, oc.data ORDER BY oc.classe ASC`;

            const [results] = await connection.execute(query, params);

            const formatted = results.map(row => ({
                classe: row.classe,
                data: formatDate(row.data),
                prodotti: row.prodotti
            }));

            res.json(formatted);

        } catch (error) {
            console.error('Errore nel recupero ordini per classi:', error);
            res.status(500).json({ error: 'Errore del database' });
        } finally {
            connection.release();
        }
    }
);

router.get('/classi/me/oggi',
    authenticateJWT,
    authorizeRole(['paninaro']),
    async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { nTurno } = req.query;
            const giorniEnum = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
            const giorno = giorniEnum[new Date().getDay()];
            if (!nTurno) {
                return res.status(400).json({ error: 'Parametro nTurno obbligatorio' });
            }
    
            // Recupera la classe del paninaro
            const [classePaninaro] = await connection.query(
                'SELECT classe FROM Utente WHERE idUtente = ?',
                [req.user.id]
            );
            
            if (!classePaninaro[0]?.classe) {
                return res.status(403).json({ error: 'Nessuna classe assegnata' });
            }
    
            const query = `
                SELECT
                    os.idOrdine,
                    os.confermato,
                    os.user,
                    u.nome AS nomeUtente,
                    sum(dos.quantita*p.prezzo) AS totale,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'idProdotto', p.idProdotto,
                            'nome', p.nome,
                            'quantita', dos.quantita,
                            'prezzo', p.prezzo
                        )
                    ) AS prodotti
                FROM OrdineSingolo os
                JOIN Utente u ON os.user = u.idUtente
                JOIN DettagliOrdineSingolo dos ON os.idOrdine = dos.idOrdineSingolo
                JOIN Prodotto p ON dos.idProdotto = p.idProdotto
                WHERE u.classe = ?
                AND os.data = CURDATE()
                AND os.nTurno = ? and giorno = ?
                GROUP BY os.idOrdine, os.user, u.nome
                ORDER BY os.idOrdine DESC
            `;
    
            const [orders] = await connection.execute(query, [
                classePaninaro[0].classe,
                nTurno, giorno
            ]);
    
            if (orders.length === 0) {
                return res.status(404).json({ error: 'Nessun ordine trovato per oggi in questo turno' });
            }
            
            const totaleAccettato = orders.reduce((acc, order) => {
                return order.confermato ? acc + Number(order.totale) : acc
            }, 0);

            const formattedOrders = orders.map(order => ({
                idOrdine: order.idOrdine,
                confermato: order.confermato,
                totale: order.totale,
                user: {
                    id: order.user,
                    nome: order.nomeUtente
                },
                prodotti: order.prodotti
            }));
    
            res.json({
                nTurno: Number(nTurno),
                totale: totaleAccettato,
                ordini: formattedOrders
            });
    
        } catch (error) {
            console.error('Errore nel recupero ordini della classe per oggi:', error);
            res.status(500).json({ error: 'Errore del database' });
        } finally {
            connection.release();
        }
    });

// Ottieni i propri ordini
router.get('/me',
    authenticateJWT,
    authorizeRole(['admin', 'paninaro', 'studente', 'prof', 'segreteria']),
    async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const userId = req.user.id;
            let { startDate, endDate, nTurno } = req.query;

            if (startDate) startDate = startDate.replace(/\//g, '-');
            if (endDate) endDate = endDate.replace(/\//g, '-');

            let query = `
                SELECT
                    os.idOrdine, os.data, os.nTurno, os.giorno,
                    oc.classe, oc.confermato, oc.preparato,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'idProdotto', p.idProdotto,
                            'nome', p.nome,
                            'quantita', dos.quantita,
                            'prezzo', p.prezzo
                        )
                    ) AS prodotti
                FROM OrdineSingolo os
                LEFT JOIN OrdineClasse oc ON os.idOrdineClasse = oc.idOrdine
                LEFT JOIN DettagliOrdineSingolo dos ON os.idOrdine = dos.idOrdineSingolo
                LEFT JOIN Prodotto p ON dos.idProdotto = p.idProdotto
                WHERE os.user = ?
            `;

            const params = [userId];

            if (startDate && endDate) {
                query += ` AND os.data BETWEEN ? AND ?`;
                params.push(startDate, endDate);
            } else if (!startDate && !endDate) {
                query += ` AND os.data = CURDATE()`;
            }

            if (nTurno) {
                query += ` AND os.nTurno = ?`;
                params.push(nTurno);
            }

            query += ` GROUP BY os.idOrdine ORDER BY os.data DESC, os.idOrdine DESC`;

            const [orders] = await connection.execute(query, params);

            if (orders.length === 0) return res.status(404).json({ error: 'Nessun ordine trovato' });

            const result = orders.map(order => ({
                ...order,
                prodotti: order.prodotti
            }));

            res.json(result);

        } catch (error) {
            console.error(`Errore nel recuperare i propri ordini per utente ${req.user.id}:`, error);
            res.status(500).json({ error: 'Errore del database nel recuperare i propri ordini.' });
        } finally {
            if (connection) connection.release();
        }
    }
);

// Crea un nuovo ordine
router.post('/',
    authenticateJWT,
    authorizeRole(['studente', 'prof', 'segreteria', 'terminale', 'admin']),
    async (req, res) => {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const userId = req.user.id;
            const userRole = req.user.ruolo;
            const { prodotti, nTurno: bodyTurno } = req.body;
            const today = new Date().toISOString().split('T')[0];

            const giorniEnum = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
            const giorno = giorniEnum[new Date().getDay()];
            const giorniValidi = ['lun', 'mar', 'mer', 'gio', 'ven'];

            if (!giorniValidi.includes(giorno)) {
                await connection.rollback();
                return res.status(400).json({ error: 'Ordini consentiti solo nei giorni feriali' });
            }

            let nTurno;
            if (userRole === 'studente' || userRole === 'paninaro') {
                nTurno = parseInt(bodyTurno, 10);
                if (![1, 2].includes(nTurno)) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Turno non valido per studenti' });
                }

                const [turno] = await connection.query(`
                    SELECT oraInizioOrdine, oraFineOrdine FROM Turno 
                    WHERE n = ? AND giorno = ?
                `, [nTurno, giorno]);

                if (turno.length === 0) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Turno non disponibile' });
                }

                const oraCorrente = new Date().toLocaleTimeString('it-IT', { 
                    hour12: false, 
                    timeZone: 'Europe/Rome' 
                }).slice(0, 5);

                const { oraInizioOrdine, oraFineOrdine } = turno[0];
                if (oraCorrente < oraInizioOrdine || oraCorrente > oraFineOrdine) {
                    await connection.rollback();
                    return res.status(400).json({ 
                        error: `Fuori orario per il turno ${nTurno}: ${oraInizioOrdine}-${oraFineOrdine}`
                    });
                }
            } else {
                nTurno = 0;
                const [turno] = await connection.query(`
                    SELECT * FROM Turno WHERE n = ? AND giorno = ?
                `, [nTurno, giorno]);

                if (turno.length === 0) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Configurazione turno non trovata' });
                }
            }

            if (!prodotti || !Array.isArray(prodotti) || prodotti.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Lista prodotti vuota' });
            }

            const productIds = prodotti.map(p => p.idProdotto);
            const placeholders = productIds.map(() => '?').join(',');
            const [dbProducts] = await connection.query(`
                SELECT idProdotto, prezzo, nome FROM Prodotto
                WHERE idProdotto IN (${placeholders}) AND attivo = TRUE
            `, [...productIds]);

            const availableProductMap = new Map(dbProducts.map(p => [p.idProdotto, p]));
            for (const item of prodotti) {
                if (!availableProductMap.has(item.idProdotto)) {
                    await connection.rollback();
                    return res.status(400).json({ error: `Prodotto ${item.idProdotto} non disponibile` });
                }
                if (!Number.isInteger(item.quantita) || item.quantita <= 0) {
                    await connection.rollback();
                    return res.status(400).json({ error: `Quantità non valida per prodotto ${item.idProdotto}` });
                }
            }

            let idOrdineClasse;
            let idOrdineSingolo;

            if (userRole === 'studente' || userRole === 'paninaro') {
                const [userClass] = await connection.query(`
                    SELECT classe FROM Utente WHERE idUtente = ?
                `, [userId]);

                if (!userClass[0]?.classe) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Classe non assegnata' });
                }
                
                const [ordineSingoloResult] = await connection.query(`
                    INSERT INTO OrdineSingolo (data, nTurno, giorno, user)
                    VALUES (?, ?, ?, ?)
                `, [today, nTurno, giorno, userId]);
                idOrdineSingolo = ordineSingoloResult.insertId;

            } else {
                const classeExt = userId;
                const [newOrderClasseResult] = await connection.query(`
                    INSERT INTO OrdineClasse (idResponsabile, data, nTurno, giorno, classe, confermato, preparato)
                    VALUES (?, ?, ?, ?, ?, TRUE, FALSE)
                `, [userId, today, nTurno, giorno, classeExt]);
                idOrdineClasse = newOrderClasseResult.insertId;

                const [ordineSingoloResult] = await connection.query(`
                    INSERT INTO OrdineSingolo (data, nTurno, giorno, user, idOrdineClasse)
                    VALUES (?, ?, ?, ?, ?)
                `, [today, nTurno, giorno, userId, idOrdineClasse]);
                idOrdineSingolo = ordineSingoloResult.insertId;
            }

            const dettagliValues = prodotti.map(item => [idOrdineSingolo, item.idProdotto, item.quantita]);
            await connection.query(`
                INSERT INTO DettagliOrdineSingolo (idOrdineSingolo, idProdotto, quantita)
                VALUES ?
            `, [dettagliValues]);

            await connection.commit();
            res.status(201).json({
                success: true,
                idOrdineSingolo: idOrdineSingolo,
                idOrdineClasse: idOrdineClasse
            });

        } catch (error) {
            await connection.rollback();
            console.error('Errore creazione ordine:', error);
            res.status(500).json({ error: error.code === 'ER_DUP_ENTRY' ? 
                'Ordine duplicato' : 'Errore database' });
        } finally {
            if (connection) connection.release();
        }
    }
);

// Ottieni tutti gli ordini per la classe del paninaro
router.get('/classi/me',
    authenticateJWT,
    authorizeRole(['paninaro']),
    async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const [classeResult] = await connection.query(
                'SELECT classe FROM Utente WHERE idUtente = ?',
                [req.user.id]
            );

            if (!classeResult[0]?.classe) {
                return res.status(404).json({ error: 'Nessuna classe assegnata' });
            }

            const classeId = classeResult[0].classe;

            const query = `
                SELECT
                    u.idUtente AS userId,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'idOrdineSingolo', os.idOrdine,
                            'data', os.data,
                            'prodotti', (
                                SELECT JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'idProdotto', p.idProdotto,
                                        'nome', p.nome,
                                        'quantita', dos.quantita,
                                        'prezzo', p.prezzo
                                    )
                                )
                                FROM DettagliOrdineSingolo dos
                                JOIN Prodotto p ON dos.idProdotto = p.idProdotto
                                WHERE dos.idOrdineSingolo = os.idOrdine
                            )
                        )
                    ) AS ordini
                FROM OrdineSingolo os
                JOIN Utente u ON os.user = u.idUtente
                WHERE u.classe = ?
                GROUP BY u.idUtente
            `;

            const [orders] = await connection.execute(query, [classeId]);

            const formattedOrders = orders.map(order => ({
                userId: order.userId,
                ordini: order.ordini
            }));

            res.json(formattedOrders);

        } catch (error) {
            console.error('Errore nel recupero ordini per la classe del paninaro:', error);
            res.status(500).json({ error: 'Errore del database' });
        } finally {
            connection.release();
        }
    }
);

// Conferma ordini individuali e crea ordine di classe
router.put('/classi/me/conferma',
    authenticateJWT,
    authorizeRole(['paninaro']),
    async (req, res) => {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const paninaroId = req.user.id;
            const { nTurno } = req.body;
            const today = new Date().toISOString().split('T')[0];
            const giorniEnum = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
            const giorno = giorniEnum[new Date().getDay()];
            const [classePaninaro] = await connection.query(
                'SELECT classe FROM Utente WHERE idUtente = ?',
                [paninaroId]
            );

            if (!classePaninaro[0]?.classe) {
                await connection.rollback();
                return res.status(403).json({ error: 'Paninaro non assegnato a nessuna classe' });
            }

            const [ordiniDaConfermare] = await connection.query(`
                SELECT os.idOrdine 
                FROM OrdineSingolo os
                JOIN Utente u ON os.user = u.idUtente
                WHERE 
                    u.classe = ? 
                    AND os.data = ? 
                    AND os.nTurno = ? 
                    AND os.idOrdineClasse IS NULL`,
                [classePaninaro[0].classe, today, nTurno]
            );

            if (ordiniDaConfermare.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Nessun ordine da confermare per questo turno' });
            }

            const [nuovoOrdineClasse] = await connection.query(`
                INSERT INTO OrdineClasse 
                    (classe, data, nTurno, giorno, idResponsabile, confermato, preparato)
                VALUES (?, ?, ?, ?, ?, TRUE, FALSE)`,
                [classePaninaro[0].classe, today, nTurno, giorno, paninaroId]
            );

            await connection.query(`
                UPDATE OrdineSingolo 
                SET idOrdineClasse = ? 
                WHERE idOrdine IN (?)`,
                [nuovoOrdineClasse.insertId, ordiniDaConfermare.map(o => o.idOrdine)]
            );

            await connection.commit();
            res.json({ 
                success: true,
                idOrdineClasse: nuovoOrdineClasse.insertId,
                classe: classePaninaro[0].classe,
                nOrdiniCollegati: ordiniDaConfermare.length,
                nTurno: nTurno,
                data: today
            });

        } catch (error) {
            await connection.rollback();
            console.error('Errore conferma ordine:', error);
            res.status(500).json({ error: 'Errore del database' });
        } finally {
            connection.release();
        }
    }
);

// Ottieni ordini di classe raggruppati per nome di classe specifico
router.get('/classi/:classe',
    authenticateJWT,
    authorizeRole(['admin', 'gestore']),
    async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { classe } = req.params;
            const { startDate, endDate, nTurno } = req.query;

            let query = `
                SELECT
                    oc.idOrdine AS idOrdineClasse,
                    oc.data,
                    oc.nTurno,
                    oc.giorno,
                    oc.confermato,
                    oc.preparato,
                    oc.oraRitiro,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'idOrdineSingolo', os.idOrdine,
                            'user', os.user,
                            'prodotti', (
                                SELECT JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'idProdotto', p.idProdotto,
                                        'nome', p.nome,
                                        'quantita', dos.totalQuantita,
                                        'prezzo', p.prezzo
                                    )
                                )
                                FROM (
                                    SELECT dos.idProdotto, SUM(dos.quantita) AS totalQuantita
                                    FROM DettagliOrdineSingolo dos
                                    WHERE dos.idOrdineSingolo = os.idOrdine
                                    GROUP BY dos.idProdotto
                                ) dos
                                JOIN Prodotto p ON dos.idProdotto = p.idProdotto
                            )
                        )
                    ) AS ordiniSingoli
                FROM OrdineClasse oc
                JOIN OrdineSingolo os ON oc.idOrdine = os.idOrdineClasse
                JOIN Classe c ON oc.classe = c.id
                WHERE c.nome = ?
            `;

            const params = [classe];

            if (startDate && endDate) {
                query += ` AND oc.data BETWEEN ? AND ?`;
                params.push(startDate, endDate);
            } else if (!startDate && !endDate) {
                query += ` AND oc.data = CURDATE()`;
            }

            if (nTurno) {
                query += ` AND oc.nTurno = ?`;
                params.push(nTurno);
            }

            query += ` 
                GROUP BY 
                    oc.idOrdine,
                    oc.data,
                    oc.nTurno,
                    oc.giorno,
                    oc.confermato,
                    oc.preparato,
                    oc.oraRitiro
                ORDER BY oc.data DESC, oc.idOrdine DESC
            `;

            const [orders] = await connection.execute(query, params);

            const result = orders.map(order => ({
                ...order,
                ordiniSingoli: parseJSON(order.ordiniSingoli)
            }));

            res.json(result);

        } catch (error) {
            console.error('Errore nel recuperare ordini per classe:', error);
            res.status(500).json({ error: 'Errore del database nel recuperare ordini per classe.' });
        } finally {
            if (connection) connection.release();
        }
    }
);

module.exports = router;
