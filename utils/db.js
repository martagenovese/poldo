const mysql = require('mysql2/promise');
const { DB } = require('./config');

class DatabaseManager {
    constructor() {
        this.pool = mysql.createPool(DB);
    }

    async getRuolo(idUser) {
        const connection = await this.pool.getConnection();
        try {
            const [rows] = await connection.execute(
                "SELECT ruolo FROM Utente WHERE idUtente = ?",
                [idUser]
            );
            return rows[0]?.ruolo || null;
        } finally {
            connection.release();
        }
    }
}

module.exports = DatabaseManager;