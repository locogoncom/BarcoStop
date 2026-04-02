require('dotenv').config();

const mysqlDb = require('./db');
const sqliteDb = require('./sqlite-db');

const dbType = (process.env.DB_TYPE || 'sqlite').toLowerCase();
const selectedDb = dbType === 'mysql' ? mysqlDb : sqliteDb;

module.exports = {
  ...selectedDb,
  dbType,
};