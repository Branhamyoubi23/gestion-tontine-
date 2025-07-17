const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',         // adapte selon ton installation
  password: 'Mysql@123',         // adapte selon ton installation
  database: 'gestion_tontine'
});

module.exports = db;