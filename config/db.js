const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}


const dbPath = path.join(dbDir, 'afaw.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error('❌ DB Error:', err.message);
    console.log(`Database connected!`);
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

module.exports = db;
