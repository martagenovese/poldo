const mysql = require('mysql2/promise');
const { DB } = require('../config/config');

const pool = mysql.createPool(DB);

module.exports = pool;